import { NextRequest, NextResponse } from "next/server";
import { consultPayment } from "@/lib/tilopay";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Verifica el estado real de una transacción contra Tilopay.
// NO se confía en el `code` que Tilopay agrega a la URL de retorno (es falsificable):
// aquí re-consultamos el estado autoritativo por orderNumber.
export async function POST(req: NextRequest) {
  try {
    // Devuelve auth code y últimos 4 dígitos: rate limit para frenar enumeración
    // de orderNumbers (además de que son impredecibles).
    const rl = rateLimit(`pay-verify:${clientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en un momento." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { orderNumber } = (await req.json()) as { orderNumber?: string };
    if (!orderNumber) {
      return NextResponse.json({ error: "orderNumber requerido" }, { status: 400 });
    }

    const tx = await consultPayment(orderNumber);

    if (!tx) {
      return NextResponse.json({ approved: false, reason: "Transacción no encontrada" });
    }

    const approved = tx.code === "1";
    return NextResponse.json({
      approved,
      reason: approved ? undefined : tx.response,
      payment: {
        provider: "tilopay",
        // Echo del orderNumber de entrada (Tilopay lo devuelve con prefijo de
        // comercio en tx.orderNumber, pero consult funciona con el nuestro).
        orderNumber,
        amount: Number(tx.amount),
        currency: tx.currency,
        auth: tx.auth,
        card: tx.last,
        tilopayId: tx.id_tilopay,
        environment: tx.environment,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al verificar el pago" },
      { status: 500 }
    );
  }
}
