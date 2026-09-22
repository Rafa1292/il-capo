import { NextRequest, NextResponse } from "next/server";
import { nicoGet, nicoPost, NicoApiError } from "@/lib/nico";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { requireLocation } from "@/lib/api-location";
import {
  buildCookieValue,
  VERIFIED_PHONE_COOKIE,
  VERIFIED_PHONE_MAX_AGE,
  readVerifiedPhone,
} from "@/lib/cash-verification";

/**
 * Verificación del número para pagar en efectivo.
 *
 * Va al revés que un código enviado: el cliente manda un token desde SU
 * WhatsApp y el negocio lo reconoce. Escribir desde la línea prueba lo mismo
 * que recibir un código ahí, y además Meta no nos deja mandar códigos (las
 * plantillas de Autenticación exigen el negocio verificado, que hoy no lo
 * está), esto no cuesta por mensaje y deja el chat abierto para avisarle
 * del pedido.
 *
 * GET  — ¿este dispositivo ya comprobó un número?
 * POST — pedile a nico el token y el link de WhatsApp
 * PUT  — ¿ya lo mandó? Si sí, deja la cookie firmada con el número que escribió
 *
 * La cookie solo evita volver a preguntar. El permiso real vive en nico y se
 * comprueba otra vez al crear cada pedido: una cookie no autoriza nada.
 */

export async function GET(req: NextRequest) {
  const phone = readVerifiedPhone(req.cookies.get(VERIFIED_PHONE_COOKIE)?.value);
  return NextResponse.json({ phone });
}

export async function POST(req: NextRequest) {
  // Ya no cuesta un mensaje, pero cada token es una fila en nico: no dejamos
  // que alguien los emita en masa.
  const rl = rateLimit(`cash-link:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá en unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { location, response } = await requireLocation();
  if (response) return response;

  try {
    const json = await nicoPost<{
      data: { ref: string; token: string; waLink: string; expiresAt: string };
    }>("/api/public/cash-verification/link", {}, location);

    return NextResponse.json({
      ref: json.data.ref,
      token: json.data.token,
      waLink: json.data.waLink,
      expiresAt: json.data.expiresAt,
    });
  } catch (err) {
    // La sede sin WhatsApp conectado no puede verificar a nadie. No es un
    // fallo pasajero: mientras siga así, el efectivo no se puede ofrecer ahí.
    if (err instanceof NicoApiError && err.code === "WHATSAPP_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: "El pago en efectivo no está disponible en esta sede",
          code: "WHATSAPP_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }
    console.error("[cash-verification:POST]", err);
    return NextResponse.json({ error: "No se pudo empezar la verificación" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Esto es un sondeo mientras el cliente va a WhatsApp y vuelve, así que el
  // tope tiene que dar para varios minutos seguidos — pero existir, para que
  // nadie lo use de ariete contra nico.
  const rl = rateLimit(`cash-poll:${clientIp(req)}`, 200, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá en unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { location, response } = await requireLocation();
  if (response) return response;

  try {
    const body = await req.json();
    const ref = String(body?.ref ?? "").trim();
    if (!ref) return NextResponse.json({ error: "Falta la referencia" }, { status: 400 });

    const json = await nicoGet<{
      data: { verified: boolean; phone: string | null; expired: boolean };
    }>(`/api/public/cash-verification/link/${encodeURIComponent(ref)}`, { location });

    const { verified, phone, expired } = json.data ?? {};
    if (!verified || !phone) {
      return NextResponse.json({ verified: false, expired: !!expired });
    }

    // El número que vale es el que escribió por WhatsApp, no el que digitó en
    // el formulario: ese es el que nico habilitó y contra el que va a comparar
    // cuando llegue el pedido.
    const res = NextResponse.json({ verified: true, phone });
    res.cookies.set(VERIFIED_PHONE_COOKIE, buildCookieValue(phone), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VERIFIED_PHONE_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("[cash-verification:PUT]", err);
    return NextResponse.json({ error: "No se pudo comprobar la verificación" }, { status: 500 });
  }
}
