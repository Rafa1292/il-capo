import { NextRequest, NextResponse } from "next/server";
import { nicoPost } from "@/lib/nico";
import { verifyOrderToken } from "@/lib/order-token";
import { requireLocation } from "@/lib/api-location";

/**
 * Invitación a los juegos en la página del pedido: el link (directo si el
 * cliente ya verificó su WhatsApp) y las fichas que le da el pedido. Lo decide
 * nico; si la sede no tiene juegos, responde `enabled: false` y no se muestra
 * nada.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // El link puede entrar directo a la cuenta del cliente: solo para quien
    // tiene el token firmado del pedido, igual que el estado.
    const token = req.nextUrl.searchParams.get("t");
    if (!verifyOrderToken(id, token)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { location, response } = await requireLocation();
    if (response) return response;

    const data = await nicoPost<{ data: unknown }>("/api/public/games/pass", { orderId: id }, location);
    return NextResponse.json(data);
  } catch (err) {
    // Es un extra de la página: si falla, simplemente no se muestra.
    console.error("[orders/:id/games]", err);
    return NextResponse.json({ data: { enabled: false } });
  }
}
