import { NextRequest, NextResponse } from "next/server";
import { nicoPost, nicoPut } from "@/lib/nico";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  buildCookieValue,
  VERIFIED_PHONE_COOKIE,
  VERIFIED_PHONE_MAX_AGE,
  readVerifiedPhone,
} from "@/lib/cash-verification";

/**
 * Verificación del número para pagar en efectivo.
 *
 * GET  — ¿este dispositivo ya comprobó un número?
 * POST — pedile a nico que mande el código por WhatsApp
 * PUT  — comprobá el código; si es correcto, deja la cookie firmada
 *
 * La cookie solo evita volver a preguntar. El permiso real vive en nico y se
 * comprueba otra vez al crear cada pedido: una cookie no autoriza nada.
 */

export async function GET(req: NextRequest) {
  const phone = readVerifiedPhone(req.cookies.get(VERIFIED_PHONE_COOKIE)?.value);
  return NextResponse.json({ phone });
}

export async function POST(req: NextRequest) {
  // Cada envío es un mensaje de WhatsApp que se paga: no dejamos que alguien
  // lo use para bombardear a un tercero.
  const rl = rateLimit(`otp-send:${clientIp(req)}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá en unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const phone = String(body?.phone ?? "").trim();
    if (phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Número inválido" }, { status: 400 });
    }

    const json = await nicoPost<{ data: { cooldown: boolean } }>(
      "/api/public/cash-verification",
      { phone }
    );
    return NextResponse.json({ cooldown: !!json.data?.cooldown });
  } catch (err) {
    console.error("[cash-verification:POST]", err);
    return NextResponse.json({ error: "No se pudo enviar el código" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const rl = rateLimit(`otp-check:${clientIp(req)}`, 12, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá en unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const phone = String(body?.phone ?? "").trim();
    const code = String(body?.code ?? "").trim();

    const json = await nicoPut<{ data: { verified: boolean; reason?: string } }>(
      "/api/public/cash-verification",
      { phone, code, customerName: body?.customerName }
    );

    if (!json.data?.verified) {
      return NextResponse.json({ verified: false, reason: json.data?.reason ?? "mismatch" });
    }

    const res = NextResponse.json({ verified: true });
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
    return NextResponse.json({ error: "No se pudo verificar el código" }, { status: 500 });
  }
}
