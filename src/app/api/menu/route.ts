import { NextResponse } from "next/server";
import { nicoGet } from "@/lib/nico";
import { requireLocation } from "@/lib/api-location";

// Depende de la cookie de sede, así que se resuelve por petición. El caché de
// la respuesta de nico sigue vivo (revalidate abajo), compartido por sede.
export const dynamic = "force-dynamic";

export async function GET() {
  const { location, response } = await requireLocation();
  if (response) return response;

  try {
    const data = await nicoGet("/api/public/menu", { revalidate: 60, location });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/menu]", err);
    // Mensaje genérico: no filtramos detalles internos (URLs, errores de nico).
    return NextResponse.json({ error: "Error al cargar el menú" }, { status: 500 });
  }
}
