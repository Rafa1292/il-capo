"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

const COOKIE = "il-capo-sede";
const MAX_AGE = 180 * 24 * 60 * 60; // 6 meses

/**
 * Deja anotada la sede por la que entró el cliente.
 *
 * La cookie la escribe el navegador y no el servidor porque la página es
 * estática: si el servidor tuviera que ponerla, cada visita se renderizaría de
 * nuevo y se perdería el caché del menú.
 *
 * Si la sede cambia, el carrito se vacía: los productos son de otro tenant y
 * sus identificadores no existen en esta sede — al cobrar fallarían uno por uno.
 */
export function RememberLocation({ slug }: { slug: string }) {
  const cartLocation = useCartStore((s) => s.locationSlug);
  const setLocation = useCartStore((s) => s.setLocation);

  useEffect(() => {
    document.cookie = `${COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
    if (cartLocation !== slug) setLocation(slug);
  }, [slug, cartLocation, setLocation]);

  return null;
}
