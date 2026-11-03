"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/types";
import type { AppliedPromo } from "./promo-code-field";

/**
 * Descuento del código guardado (el del link de WhatsApp) sobre el carrito
 * actual, para mostrarlo ya en el carrito y no solo en el checkout. Solo
 * muestra: el cobro lo vuelve a calcular el servidor.
 *
 * Se espera un momento después de cada cambio: tocar + tres veces no tiene
 * que gastar tres consultas (el endpoint tiene tope por IP).
 */
export function useCartPromo(code: string, items: CartItem[]): { promo: AppliedPromo | null; error: string | null } {
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || items.length === 0) {
      setPromo(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/promo-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            code,
            items: items.map((i) => ({
              saleItemId: i.saleItemId,
              quantity: i.quantity,
              modifiers: i.modifiers,
              pizzaBuilder: i.pizzaBuilder,
            })),
          }),
        });
        const json = await res.json();
        if (res.ok) {
          setPromo(json as AppliedPromo);
          setError(null);
        } else {
          setPromo(null);
          setError(json.error ?? null);
        }
      } catch {
        // Abortado o sin red: el checkout lo vuelve a intentar.
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [code, items]);

  return { promo, error };
}
