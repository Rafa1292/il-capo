import { NextRequest, NextResponse } from "next/server";
import { nicoPost } from "@/lib/nico";
import { verifyOrderToken } from "@/lib/order-token";
import { requireLocation } from "@/lib/api-location";

/**
 * El cliente tocó "Estoy aquí" (pedido para recoger con la puerta cerrada):
 * nico le avisa a la cocina. Solo quien tiene el token firmado del pedido.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get("t");
    if (!verifyOrderToken(id, token)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { location, response } = await requireLocation();
    if (response) return response;

    const data = await nicoPost<{ data: unknown }>(`/api/public/orders/${id}/arrived`, {}, location);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[orders/:id/arrived]", err);
    return NextResponse.json({ error: "No pudimos avisar a la cocina" }, { status: 500 });
  }
}
