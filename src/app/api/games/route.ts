import { NextResponse } from "next/server";
import { requireLocation } from "@/lib/api-location";
import { gamesEntry } from "@/lib/games";

/**
 * GET /api/games — para "Mis fichas" en la cuenta: si la sede tiene juegos y
 * el saldo (solo cuando el número ya está comprobado en este aparato). El link
 * no se devuelve: el botón va a /juegos, que lo pide fresco.
 */
export async function GET() {
  try {
    const { location, response } = await requireLocation();
    if (response) return response;
    const entry = await gamesEntry(location);
    return NextResponse.json({
      data: entry.enabled ? { enabled: true, direct: entry.direct, balance: entry.balance } : { enabled: false },
    });
  } catch (err) {
    // Es un extra de la cuenta: si falla, no se muestra.
    console.error("[api/games]", err);
    return NextResponse.json({ data: { enabled: false } });
  }
}
