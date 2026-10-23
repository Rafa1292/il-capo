import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { priceCart, PricingError, type PriceableItem } from "@/lib/pricing";
import { sanitizeGift } from "@/lib/gift";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { requireLocation } from "@/lib/api-location";
import { cleanPromoCode, quotePromo, PromoError } from "@/lib/promo";

/**
 * POST /api/promo-code — { code, items }: cuánto descuenta el código sobre
 * este carrito. Solo para mostrarlo en el checkout; el cobro lo vuelve a
 * calcular el servidor.
 */
export async function POST(req: NextRequest) {
  // Los códigos son cortos: sin tope, se podrían probar a ciegas.
  const rl = rateLimit(`promo:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en un momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }
  try {
    const body = (await req.json().catch(() => null)) as { code?: unknown; items?: PriceableItem[] } | null;
    const code = cleanPromoCode(body?.code);
    if (!code) return NextResponse.json({ error: "Ingresá un código" }, { status: 400 });
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const { location, response } = await requireLocation();
    if (response) return response;
    const catalog = await getCatalog(location);
    const subtotal = priceCart(sanitizeGift(body.items), catalog).total;

    const quote = await quotePromo(code, subtotal, location);
    return NextResponse.json(quote);
  } catch (err) {
    if (err instanceof PromoError || err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/promo-code]", err);
    return NextResponse.json({ error: "No pudimos revisar el código" }, { status: 500 });
  }
}
