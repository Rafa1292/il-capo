import "server-only";
import { cookies } from "next/headers";
import { resolveLocation, type Location } from "@/lib/locations";

/**
 * Sede elegida, recordada en una cookie.
 *
 * El menú vive en la URL (/grecia, /san-ramon) porque conviene poder enlazarlo
 * y cachearlo por sede. Pero el checkout, el pedido y el cobro son un solo
 * flujo: cargarles la sede en la URL obligaría a arrastrarla por todas las
 * pantallas. La cookie la lleva sola.
 *
 * No va firmada a propósito: elegir sede no da acceso a nada. Lo peor que puede
 * hacer alguien editándola es verse la carta de la otra sucursal.
 */

export const LOCATION_COOKIE = "il-capo-sede";
const MAX_AGE = 180 * 24 * 60 * 60; // 6 meses

export async function readLocationCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(LOCATION_COOKIE)?.value ?? null;
}

/**
 * Sede con la que atender esta petición: la de la cookie, o la única que haya.
 * Null solo si hay varias configuradas y el cliente todavía no eligió.
 */
export async function currentLocation(): Promise<Location | null> {
  return resolveLocation(await readLocationCookie());
}

export const locationCookieOptions = {
  httpOnly: false, // el cliente la lee para mostrar en qué sede está
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
