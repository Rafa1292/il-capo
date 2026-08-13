import { nicoGet } from "@/lib/nico";
import { NextResponse } from "next/server";
import { requireLocation } from "@/lib/api-location";
import type { PizzaBuilderData } from "@/types";

// Depende de la cookie de sede: cada una tiene sus masas, salsas y toppings.
export const dynamic = "force-dynamic";

export async function GET() {
  const { location, response } = await requireLocation();
  if (response) return response;

  try {
    const json = await nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder", {
      revalidate: 60,
      location,
    });
    return NextResponse.json(json.data);
  } catch (e) {
    console.error("[api/pizza-builder]", e);
    // Mensaje genérico: no filtramos detalles internos (URLs, errores de nico).
    return NextResponse.json({ error: "Error al cargar el pizza builder" }, { status: 500 });
  }
}
