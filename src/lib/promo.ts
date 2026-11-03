// Códigos de descuento (recuperación VUELVE- o de campaña).
//
// El descuento lo decide nico: acá solo se le pregunta cuánto da un código
// sobre el subtotal de la comida, calculado en este servidor con precios
// reales. Se pregunta al escribirlo, antes de autorizar la tarjeta y otra vez
// al crear el pedido; nico lo vuelve a verificar y lo reserva al recibirlo.

import { nicoPost, NicoApiError } from "@/lib/nico";
import type { Location } from "@/lib/locations";

export interface PromoQuote {
  code: string;
  /** Colones enteros que se restan de la comida (nunca del envío). */
  discount: number;
  label: string;
  /** Aclaración ("No aplica a promociones ni almuerzos"), si el código la tiene. */
  note?: string | null;
  /** Colones del carrito que el código no descuenta. */
  excluded?: number;
}

/** Línea del carrito para que nico sepa qué descuenta (los VUELVE- no tocan promos ni almuerzos). */
export interface PromoLine {
  saleItemId: string;
  amount: number;
}

/** Líneas de un carrito ya valorado con precios reales. */
export function promoLinesFrom(lines: { saleItemId: string; lineTotal: number }[]): PromoLine[] {
  return lines.map((l) => ({ saleItemId: l.saleItemId, amount: l.lineTotal }));
}

/** El código no sirve (no existe, venció, ya se usó): el mensaje es para el cliente. */
export class PromoError extends Error {}

export async function quotePromo(
  code: string,
  subtotal: number,
  location: Location,
  lines: PromoLine[]
): Promise<PromoQuote> {
  try {
    const res = await nicoPost<{ data: PromoQuote }>(
      "/api/public/promo-codes/quote",
      { code: code.trim().toUpperCase(), subtotal, lines },
      location
    );
    return res.data;
  } catch (err) {
    if (err instanceof NicoApiError && err.status === 400) throw new PromoError(err.message);
    throw err;
  }
}

/** Normaliza lo que manda el navegador: vacío o basura = sin código. */
export function cleanPromoCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return code && code.length <= 40 ? code : null;
}
