import { NextRequest, NextResponse } from "next/server";
import { nicoPost, NicoApiError } from "@/lib/nico";
import { resolveDeliveryFee, OutOfRangeError } from "@/lib/delivery";
import { getCatalog } from "@/lib/catalog";
import {
  buildMenuIndex,
  priceItemBase,
  priceItemModifiers,
  authoritativeElementPrice,
  assertQuantity,
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  PricingError,
  type PriceableItem,
} from "@/lib/pricing";
import { consultPayment, TILOPAY_CURRENCY } from "@/lib/tilopay";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { signOrderId } from "@/lib/order-token";
import { isPhoneVerifiedHere } from "@/lib/cash-verification";
import { requireLocation } from "@/lib/api-location";
import type { PizzaBuilderCartSelection } from "@/types";

// Idempotencia best-effort dentro del proceso. La dedupe autoritativa (persistente)
// debe vivir en nico: rechazar/ignorar una segunda orden con el mismo orderNumber.
const inFlight = new Set<string>();

interface IncomingElement {
  modifierElementId: string;
  name?: string;
  price?: number; // ← se IGNORA: el precio se recalcula en el servidor
  quantity: number;
  isCombined?: boolean;
}
interface IncomingGroup {
  modifierGroupId: string;
  name?: string;
  minSelect?: number;
  maxSelect?: number;
  showLabel?: boolean;
  sortOrder?: number;
  elements: IncomingElement[];
}
interface IncomingItem {
  saleItemId: string;
  description?: string;
  quantity: number;
  modifiers?: IncomingGroup[];
  pizzaBuilder?: PizzaBuilderCartSelection;
}
interface ConfirmBody {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: "TAKEOUT" | "DELIVERY";
  deliveryAddress?: string;
  /** CASH = se cobra al entregar; no pasa por Tilopay. */
  paymentMethod?: "CASH" | "CARD";
  /** Pin que marcó el cliente en el mapa: define la zona y el costo del envío. */
  deliveryLocationPin?: { latitude: number; longitude: number } | null;
  notes?: string;
  items: IncomingItem[];
}

function centsEqual(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

/** Trunca strings del cliente a un largo razonable antes de reenviarlos al POS. */
function clip(s: string | undefined, max: number): string | undefined {
  const t = s?.trim();
  return t ? t.slice(0, max) : undefined;
}

// Crea el pedido en nico SOLO tras verificar el pago en Tilopay y que el monto
// pagado coincida con el total recalculado en el servidor con precios reales.
export async function POST(req: NextRequest) {
  let orderNumber = "";
  try {
    const rl = rateLimit(`orders:${clientIp(req)}`, 15, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en un momento." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = (await req.json()) as ConfirmBody;
    orderNumber = body.orderNumber?.trim();

    // Efectivo: no hay cobro en línea, así que no hay referencia de pago que
    // verificar. La idempotencia se apoya en una referencia propia.
    const isCash = body.paymentMethod === "CASH";

    // El interruptor tiene que estar acá y no solo en la pantalla: esconder un
    // botón no impide que alguien llame al endpoint a mano.
    if (isCash && process.env.NEXT_PUBLIC_CASH_ENABLED !== "true") {
      return NextResponse.json(
        { error: "El pago en efectivo no está disponible", code: "CASH_DISABLED" },
        { status: 403 }
      );
    }
    if (isCash && !orderNumber) {
      orderNumber = `CASH-${crypto.randomUUID()}`;
    }

    // ── Validaciones básicas ──
    if (!orderNumber) {
      return NextResponse.json({ error: "Falta la referencia de pago" }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }
    if (body.items.length > MAX_CART_LINES) {
      return NextResponse.json({ error: "Demasiados artículos en el carrito" }, { status: 400 });
    }
    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json({ error: "Nombre y teléfono son requeridos" }, { status: 400 });
    }
    if (body.deliveryMethod === "DELIVERY" && !body.deliveryAddress?.trim()) {
      return NextResponse.json({ error: "La dirección es requerida para entregas" }, { status: 400 });
    }

    // ── Idempotencia (evita doble creación por doble submit) ──
    if (inFlight.has(orderNumber)) {
      return NextResponse.json({ error: "El pedido ya se está procesando" }, { status: 409 });
    }
    inFlight.add(orderNumber);

    // Sede: define el catálogo, los precios y las zonas de entrega.
    const { location: sede, response } = await requireLocation();
    if (response) return response;

    // ── Recalcular precios con el catálogo real y sanear los ítems ──
    const catalog = await getCatalog(sede);
    const index = buildMenuIndex(catalog.categories);

    let total = 0;
    const nicoItems = body.items.map((item) => {
      assertQuantity(item.quantity, MAX_LINE_QUANTITY, "artículos");

      // unitPrice = solo la base del ítem (nico suma los modificadores por su cuenta).
      const base = priceItemBase(item as PriceableItem, catalog, index);
      const modSum = priceItemModifiers(item as PriceableItem, index);
      total += (base + modSum) * item.quantity;

      // Reescribimos los precios de los modificadores con los autoritativos.
      const modifiers = (item.modifiers ?? []).map((g) => ({
        ...g,
        elements: g.elements.map((el) => ({
          ...el,
          price: authoritativeElementPrice(index, item.saleItemId, el.modifierElementId),
        })),
      }));

      return {
        saleItemId: item.saleItemId,
        description: clip(item.description, 200),
        quantity: item.quantity,
        unitPrice: base, // ← solo base; los modificadores van aparte en modifiers[]
        modifiers: modifiers.length > 0 ? modifiers : undefined,
        pizzaBuilder: item.pizzaBuilder,
      };
    });

    if (total <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    // ── Envío: el mismo cálculo que entró en la autorización ──
    // Se vuelve a preguntar en vez de confiar en lo que manda el navegador: si
    // no coincidiera con lo autorizado, el chequeo de monto de abajo lo frena.
    let deliveryFee: number;
    try {
      deliveryFee = await resolveDeliveryFee(
        body.deliveryMethod,
        body.deliveryLocationPin ?? null,
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

    // ── Verificación del pago ──
    // En efectivo no hay nada que verificar: se cobra al entregar. Lo que sí se
    // exige es que el número esté comprobado en este dispositivo; nico lo vuelve
    // a comprobar por su cuenta y rechaza si no.
    let tx: Awaited<ReturnType<typeof consultPayment>> = null;
    if (isCash) {
      if (!(await isPhoneVerifiedHere(body.customerPhone))) {
        return NextResponse.json(
          { error: "Necesitamos verificar tu número", code: "CASH_NOT_VERIFIED" },
          { status: 403 }
        );
      }
    } else {
      tx = await consultPayment(orderNumber);
      if (!tx || tx.code !== "1") {
        return NextResponse.json({ error: "El pago no está aprobado" }, { status: 402 });
      }
      if (tx.currency !== TILOPAY_CURRENCY) {
        return NextResponse.json({ error: "Moneda del pago no coincide" }, { status: 409 });
      }
      // 🔒 El monto pagado DEBE coincidir con el total recalculado en el servidor.
      if (!centsEqual(Number(tx.amount), total)) {
        console.error(
          `[orders] Monto no coincide orderNumber=${orderNumber} pagado=${tx.amount} total=${total}`
        );
        return NextResponse.json({ error: "El monto pagado no coincide con el pedido" }, { status: 409 });
      }
    }

    // ── Crear el pedido en nico con precios autoritativos + referencia de pago ──
    const payload = {
      customerName: clip(body.customerName, 100),
      customerPhone: clip(body.customerPhone, 30),
      deliveryMethod: body.deliveryMethod,
      deliveryAddress:
        body.deliveryMethod === "DELIVERY" ? clip(body.deliveryAddress, 500) : undefined,
      // nico vuelve a cotizar con este pin y compara contra expressFee: si no
      // cuadra, rechaza el pedido en vez de aceptarlo mal cobrado.
      deliveryLatitude: body.deliveryLocationPin?.latitude,
      deliveryLongitude: body.deliveryLocationPin?.longitude,
      expressFee: body.deliveryMethod === "DELIVERY" ? deliveryFee : undefined,
      notes: clip(body.notes, 500),
      items: nicoItems,
      // El total del pedido es solo la comida: en nico el express va aparte,
      // fuera del total de venta.
      estimatedTotal: total - deliveryFee,
      // El cajero necesita saberlo antes de despachar: si es efectivo, el
      // mensajero sale con vuelto.
      paymentMethodHint: isCash ? ("CASH" as const) : ("CARD" as const),
      payment: tx
        ? {
            provider: "tilopay",
            orderNumber,
            auth: tx.auth,
            amount: Number(tx.amount),
            currency: tx.currency,
            tilopayId: tx.id_tilopay,
          }
        : undefined,
    };

    const data = await nicoPost<{ success?: boolean; data?: { id?: string } }>(
      "/api/public/orders",
      payload
    );

    // Token de acceso al pedido: solo con él se puede consultar el estado (cierra IDOR).
    const id = data?.data?.id;
    const accessToken = id ? signOrderId(id) : undefined;

    return NextResponse.json(
      { ...data, data: { ...data?.data, accessToken } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    // nico rechazó con un motivo concreto (pedidos pausados, fuera de
    // cobertura, precio que no cuadra). Devolverlo tal cual en vez de un 500
    // genérico: el cliente puede hacer algo con "volvemos a las 11", con
    // "no se pudo registrar el pedido" no.
    if (err instanceof NicoApiError) {
      // Con tarjeta el pago ya está autorizado en este punto: dejarlo en el log
      // con su orderNumber es lo único que permite encontrar la retención
      // después y liberarla.
      console.error(`[orders] nico rechazó ${err.code} orderNumber=${orderNumber}: ${err.message}`);
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status === 503 ? 503 : 409 }
      );
    }
    console.error("[orders]", err);
    return NextResponse.json({ error: "No se pudo registrar el pedido" }, { status: 500 });
  } finally {
    if (orderNumber) inFlight.delete(orderNumber);
  }
}
