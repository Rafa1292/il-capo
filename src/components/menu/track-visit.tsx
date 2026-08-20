"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/**
 * Cuenta una visita al abrir la carta.
 *
 * `once` la limita a una por pestaña: alguien que va del menú al carrito y
 * vuelve es una visita, no tres.
 */
export function TrackVisit() {
  useEffect(() => {
    track("VISIT", { once: true });
  }, []);

  return null;
}
