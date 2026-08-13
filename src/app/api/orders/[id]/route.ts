import { NextRequest, NextResponse } from "next/server";
import { nicoGet } from "@/lib/nico";
import { verifyOrderToken } from "@/lib/order-token";
import { requireLocation } from "@/lib/api-location";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Solo quien tiene el token firmado del pedido puede verlo (evita IDOR/fuga de PII).
    const token = req.nextUrl.searchParams.get("t");
    if (!verifyOrderToken(id, token)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // El pedido pertenece a la sede donde se hizo: preguntárselo a otra
    // devolvería "no existe" aunque el token sea válido.
    const { location, response } = await requireLocation();
    if (response) return response;

    const data = await nicoGet(`/api/public/orders/${id}`, { location });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[orders/:id]", err);
    return NextResponse.json({ error: "Error al consultar el pedido" }, { status: 500 });
  }
}
