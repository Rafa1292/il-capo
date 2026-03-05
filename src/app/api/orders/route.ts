import { NextRequest, NextResponse } from "next/server";
import { nicoPost } from "@/lib/nico";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await nicoPost("/api/public/orders", body);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear el pedido" },
      { status: 500 }
    );
  }
}
