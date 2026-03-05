"use client";

import { useEffect } from "react";

/**
 * En desarrollo, desregistra cualquier service worker activo para evitar que
 * el SW del build de producción intercepte peticiones y cause loops de recarga.
 * En producción no hace nada.
 */
export function SwManager() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
        console.info("[SW] Desregistrado en desarrollo:", reg.scope);
      }
    });
  }, []);

  return null;
}
