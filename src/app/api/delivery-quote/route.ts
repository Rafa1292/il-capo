import { NextRequest, NextResponse } from "next/server";
import { nicoGet } from "@/lib/nico";
import { quoteDelivery } from "@/lib/delivery";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { requireLocation } from "@/lib/api-location";

/**
 * Puente hacia nico para el mapa del checkout.
 *
 * Existe porque la llave de la API de nico es secreta y vive solo en el
 * servidor: el navegador no puede preguntarle directo.
 *
 * GET  — dónde está el local, para centrar el mapa.
 * POST — cuánto sale el envío al punto marcado.
 *
 * El precio que sale de acá es solo para mostrar. El que se cobra se vuelve a
 * pedir al autorizar el pago y nico lo verifica otra vez al registrar el pedido.
 */
export async function GET() {
  const { location, response } = await requireLocation();
  if (response) return response;

  try {
    const json = await nicoGet<{ data: { origin: { latitude: number; longitude: number } | null } }>(
      "/api/public/delivery-quote",
      { revalidate: 300, location }
    );
    return NextResponse.json(json.data);
  } catch (err) {
    console.error("[delivery-quote:GET]", err);
    return NextResponse.json({ error: "No se pudo cargar el mapa" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Cada cotización es una llamada a nico: no dejamos que se convierta en un
  // barrido de precios de toda la ciudad.
  const rl = rateLimit(`quote:${clientIp(req)}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Probá en un momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { location, response } = await requireLocation();
  if (response) return response;

  try {
    const body = await req.json();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "Punto inválido" }, { status: 400 });
    }

    // Las zonas son por sede: el mismo punto cuesta distinto desde cada local.
    const quote = await quoteDelivery({ latitude, longitude }, location);
    return NextResponse.json(quote);
  } catch (err) {
    console.error("[delivery-quote:POST]", err);
    return NextResponse.json({ error: "No se pudo calcular el envío" }, { status: 500 });
  }
}
