import { nicoGet } from "@/lib/nico";
import { NextResponse } from "next/server";
import type { PizzaBuilderData } from "@/types";

export async function GET() {
  try {
    const json = await nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder");
    return NextResponse.json(json.data);
  } catch (e) {
    console.error("[api/pizza-builder]", e);
    // Mensaje genérico: no filtramos detalles internos (URLs, errores de nico).
    return NextResponse.json({ error: "Error al cargar el pizza builder" }, { status: 500 });
  }
}
