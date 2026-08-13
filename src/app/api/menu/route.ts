import { NextResponse } from "next/server";
import { nicoGet } from "@/lib/nico";

export const revalidate = 60; // cache menu for 1 minute

export async function GET() {
  try {
    const data = await nicoGet("/api/public/menu", { revalidate: 60 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/menu]", err);
    // Mensaje genérico: no filtramos detalles internos (URLs, errores de nico).
    return NextResponse.json({ error: "Error al cargar el menú" }, { status: 500 });
  }
}
