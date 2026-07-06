import { NextRequest, NextResponse } from "next/server";
import { nicoGet } from "@/lib/nico";
import { verifyOrderToken } from "@/lib/order-token";

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

    const data = await nicoGet(`/api/public/orders/${id}`);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[orders/:id]", err);
    return NextResponse.json({ error: "Error al consultar el pedido" }, { status: 500 });
  }
}
