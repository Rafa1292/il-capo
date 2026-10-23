"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

/**
 * Guarda el código que trae el link (`?codigo=VUELVE-XXXX`, el botón del
 * WhatsApp de "volvé"): el checkout lo aplica solo. Se lee de la URL en el
 * cliente para no volver dinámicas las páginas de la carta.
 */
export function PromoCodeCapture() {
  const setPromoCode = useCartStore((s) => s.setPromoCode);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("codigo");
    if (code && code.trim().length <= 40) setPromoCode(code);
  }, [setPromoCode]);

  return null;
}
