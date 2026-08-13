import "server-only";
import { NextResponse } from "next/server";
import { currentLocation } from "@/lib/current-location";
import type { Location } from "@/lib/locations";

/**
 * Sede con la que atender una petición de la API, o la respuesta de error lista.
 *
 * Sin sede no se puede seguir: cada una es un tenant distinto en nico, y elegir
 * mal significa cobrar los precios de otra sucursal o mandarle el pedido a una
 * cocina que no lo espera.
 */
export async function requireLocation(): Promise<
  { location: Location; response: null } | { location: null; response: NextResponse }
> {
  const location = await currentLocation();
  if (location) return { location, response: null };

  return {
    location: null,
    response: NextResponse.json(
      { error: "Elegí primero de cuál sede querés pedir", code: "LOCATION_REQUIRED" },
      { status: 400 }
    ),
  };
}
