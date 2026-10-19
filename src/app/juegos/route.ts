import { NextRequest, NextResponse } from "next/server";
import { currentLocation } from "@/lib/current-location";
import { gamesEntry } from "@/lib/games";

/**
 * GET /juegos — el link "Juegos" del menú. Pide a nico el link en el momento
 * (el pase directo dura pocos minutos, así que no se puede dejar fijo en la
 * página) y redirige. Sin juegos en la sede, vuelve al inicio.
 */
export async function GET(req: NextRequest) {
  try {
    const location = await currentLocation();
    if (location) {
      const entry = await gamesEntry(location);
      if (entry.enabled) return NextResponse.redirect(entry.url);
    }
  } catch (err) {
    console.error("[juegos]", err);
  }
  return NextResponse.redirect(new URL("/", req.url));
}
