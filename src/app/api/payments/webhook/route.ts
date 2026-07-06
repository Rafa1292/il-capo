import { NextRequest, NextResponse } from "next/server";
import { consultPayment, modifyPayment } from "@/lib/tilopay";
import { safeEqual } from "@/lib/order-token";

// Webhook llamado por nico cuando cambia el estado de un pedido pagado con Tilopay.
//
// Modelo de cobro: autorizar al pagar (capture:0) y liquidar según la decisión:
//   ACCEPTED           → captura (type 1): se cobra la retención.
//   REJECTED/CANCELLED → reverso (type 3): se libera la retención.
//
// ⚠️ IDEMPOTENTE: nico tiene un cron que reintenta el mismo (orderNumber+status)
// cada ~15 min hasta recibir 200. Por eso:
//   - Un ACCEPTED sobre un pago YA capturado devuelve 200 sin volver a cobrar.
//   - Un REJECTED sobre un pago ya reversado devuelve 200 sin volver a reversar.
//   - Nunca devolvemos 200 en ACCEPTED si NO se logró capturar (evita reportar
//     "cobrado" cuando no lo está; el cron reintenta hasta lograrlo).
//
// Seguridad: header X-Webhook-Secret (comparación en tiempo constante). El monto
// se toma autoritativo de Tilopay, no del body.
export async function POST(req: NextRequest) {
  const secret = process.env.NICO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }
  if (!safeEqual(req.headers.get("x-webhook-secret"), secret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let orderNumber: string | undefined;
  let status: string | undefined;
  try {
    const body = (await req.json()) as { orderNumber?: string; status?: string };
    orderNumber = body.orderNumber;
    status = body.status?.toUpperCase();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!orderNumber || !status) {
    return NextResponse.json({ error: "orderNumber y status son requeridos" }, { status: 400 });
  }

  const isReject = status === "REJECTED" || status === "CANCELLED";
  const isAccept = status === "ACCEPTED";
  if (!isAccept && !isReject) {
    return NextResponse.json({ action: "none", status });
  }

  // Estado autoritativo desde Tilopay.
  const tx = await consultPayment(orderNumber);

  // Sin transacción: para reverso es idempotente (nada que liberar) → 200.
  // Para captura no hay nada que capturar → 409 (que nico lo revise).
  if (!tx) {
    if (isReject) return NextResponse.json({ action: "reversal", ok: true, already: true });
    return NextResponse.json({ error: "Transacción inexistente en Tilopay" }, { status: 409 });
  }

  const captureState = (tx.capture ?? "").toLowerCase();
  const isCaptured = captureState.startsWith("captur");
  const isApproved = tx.code === "1";
  const amount = Number(tx.amount);

  // ── ACCEPTED → captura (idempotente) ──
  if (isAccept) {
    if (isCaptured) {
      return NextResponse.json({ action: "capture", ok: true, already: true });
    }
    if (!isApproved) {
      return NextResponse.json({ error: "La transacción no está autorizada" }, { status: 409 });
    }
    const result = await modifyPayment({ orderNumber, type: "1", amount });
    if (result.ok) return NextResponse.json({ action: "capture", ok: true });
    // ¿ya estaba capturada? tratamos como éxito idempotente.
    if (/captur|already|procesad|duplicad/i.test(result.message ?? "")) {
      return NextResponse.json({ action: "capture", ok: true, already: true });
    }
    // No se pudo cobrar (ej. "User in review"): 502 → el cron reintentará.
    return NextResponse.json({ action: "capture", ok: false, message: result.message }, { status: 502 });
  }

  // ── REJECTED / CANCELLED → reverso (idempotente) ──
  if (isCaptured) {
    // Ya se había cobrado y ahora se rechaza: corresponde REEMBOLSO (type 2), no reverso.
    const result = await modifyPayment({ orderNumber, type: "2", amount });
    if (result.ok || /refund|reembols|already|procesad/i.test(result.message ?? "")) {
      return NextResponse.json({ action: "refund", ok: true });
    }
    return NextResponse.json({ action: "refund", ok: false, message: result.message }, { status: 502 });
  }
  if (!isApproved) {
    // Ya no está viva (probablemente reversada) → idempotente.
    return NextResponse.json({ action: "reversal", ok: true, already: true });
  }
  const result = await modifyPayment({ orderNumber, type: "3", amount });
  if (result.ok || /revers|anul|already|procesad|duplicad/i.test(result.message ?? "")) {
    return NextResponse.json({ action: "reversal", ok: true });
  }
  return NextResponse.json({ action: "reversal", ok: false, message: result.message }, { status: 502 });
}
