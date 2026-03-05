import { NextResponse } from "next/server";
import { nicoGet } from "@/lib/nico";

export const revalidate = 60; // cache menu for 1 minute

export async function GET() {
  try {
    const data = await nicoGet("/api/public/menu");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al cargar el menú" },
      { status: 500 }
    );
  }
}
