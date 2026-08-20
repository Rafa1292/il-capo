import { NextRequest, NextResponse } from "next/server";
import { nicoPost } from "@/lib/nico";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { requireLocation } from "@/lib/api-location";

/**
 * Puente hacia nico para contar visitas.
 *
 * Existe porque la clave de la API vive solo en el servidor; el navegador no
 * puede hablarle a nico directo.
 *
 * No se manda nada del visitante: solo qué pasó y de qué cubeta de origen
 * viene. La IP no viaja a nico — se usa acá y se descarta, únicamente para
 * frenar a quien quiera inflar el contador.
 */

const METRICS = ["VISIT", "CART_ADD", "CHECKOUT"];
const SOURCES = ["google", "facebook", "instagram", "whatsapp", "tiktok", "direct", "other"];

export async function POST(req: NextRequest) {
  // Una visita por pantalla, no cien: sin tope, cualquiera podría dejar el
  // panel diciendo que hubo 10.000 visitas un martes.
  const rl = rateLimit(`metrics:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return new NextResponse(null, { status: 204 });

  const { location, response } = await requireLocation();
  // Sin sede no hay a quién atribuirle la visita. Se descarta callado: es una
  // métrica, no vale la pena molestar al cliente con un error.
  if (response) return new NextResponse(null, { status: 204 });

  try {
    const body = await req.json();
    const metric = String(body?.metric ?? "");
    const source = String(body?.source ?? "direct");
    if (!METRICS.includes(metric)) return new NextResponse(null, { status: 204 });

    await nicoPost(
      "/api/public/web-metrics",
      { metric, source: SOURCES.includes(source) ? source : "other" },
      location
    );
  } catch {
    // Que no se pueda contar una visita no es motivo para que se entere nadie.
  }

  return new NextResponse(null, { status: 204 });
}
