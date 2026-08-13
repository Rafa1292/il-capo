import { NextRequest, NextResponse } from "next/server";
import { createPayment, TILOPAY_CURRENCY } from "@/lib/tilopay";
import { getCatalog } from "@/lib/catalog";
import { priceCart, PricingError, type PriceableItem } from "@/lib/pricing";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { requireLocation } from "@/lib/api-location";
import { resolveDeliveryFee, OutOfRangeError } from "@/lib/delivery";

interface CreateBody {
  items: PriceableItem[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod?: "TAKEOUT" | "DELIVERY";
  /** Pin de entrega: define la zona y con ella el costo del envío. */
  deliveryLocation?: { latitude: number; longitude: number } | null;
  /** Total que el cliente vio en pantalla; si difiere del recalculado, se frena. */
  expectedTotal?: number;
}

/** Trunca strings del cliente a un largo razonable antes de reenviarlos. */
function clip(s: string | undefined, max: number): string {
  return (s ?? "").trim().slice(0, max);
}

function newOrderNumber(): string {
  // crypto: el orderNumber es la referencia usada por verify/webhook; evitamos Math.random.
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `ILCAPO-${Date.now()}-${rand}`;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function POST(req: NextRequest) {
  try {
    // Anti-abuso: cada intento crea una autorización en Tilopay (evita card-testing).
    const rl = rateLimit(`pay-create:${clientIp(req)}`, 8, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en un momento." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = (await req.json()) as CreateBody;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }
    if (!body.customerName?.trim() || !body.customerEmail?.trim()) {
      return NextResponse.json(
        { error: "Nombre y correo son requeridos para el pago" },
        { status: 400 }
      );
    }

    // Sede: define el catálogo, los precios y las zonas de entrega. Sin ella
    // no hay a quién preguntarle.
    const { location: sede, response } = await requireLocation();
    if (response) return response;

    // 🔒 Monto autoritativo: se recalcula en el servidor con precios reales de nico.
    // NUNCA se confía en un monto enviado por el cliente.
    const catalog = await getCatalog(sede);
    let total: number;
    try {
      total = priceCart(body.items, catalog).total;
    } catch (e) {
      if (e instanceof PricingError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }
    if (total <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    // El envío entra en la autorización: después no se puede sumar. Una tarjeta
    // se captura por el monto autorizado o menos, nunca por más.
    let deliveryFee: number;
    try {
      deliveryFee = await resolveDeliveryFee(
        body.deliveryMethod ?? "TAKEOUT",
        body.deliveryLocation ?? null,
        sede
      );
    } catch (e) {
      if (e instanceof OutOfRangeError) {
        return NextResponse.json({ error: e.message, code: "OUT_OF_RANGE" }, { status: 409 });
      }
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo calcular el envío" },
        { status: 400 }
      );
    }
    total += deliveryFee;

    // 🛑 Si el precio de algo cambió entre que el cliente armó el carrito y pagó,
    // el total que vio NO es el que se le cobraría. Frenamos antes de autorizar:
    // nunca cobrar un monto distinto al mostrado.
    if (
      typeof body.expectedTotal === "number" &&
      Math.round(body.expectedTotal * 100) !== Math.round(total * 100)
    ) {
      return NextResponse.json(
        {
          error: "Los precios del menú se actualizaron. Revisá tu carrito antes de pagar.",
          code: "PRICES_CHANGED",
          total,
        },
        { status: 409 }
      );
    }

    const orderNumber = newOrderNumber();

    // URL de retorno absoluta (Tilopay hace un GET aquí al terminar).
    const origin = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, "");
    const redirect = `${origin}/checkout/return`;

    const { firstName, lastName } = splitName(clip(body.customerName, 100));

    const { url } = await createPayment({
      orderNumber,
      amount: total,
      currency: TILOPAY_CURRENCY,
      redirect,
      customer: {
        firstName,
        lastName,
        email: clip(body.customerEmail, 254),
        phone: clip(body.customerPhone, 30) || "00000000",
      },
      returnData: JSON.stringify({ orderNumber, amount: total }),
    });

    return NextResponse.json({ url, orderNumber });
  } catch (err) {
    console.error("[payments/create]", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
}
