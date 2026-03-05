import { NextRequest, NextResponse } from "next/server";
import { nicoGet } from "@/lib/nico";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await nicoGet(`/api/public/orders/${id}`);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al consultar el pedido" },
      { status: 500 }
    );
  }
}
