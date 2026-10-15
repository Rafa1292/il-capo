import { nowInCostaRica } from "@/lib/schedule";

/**
 * Regalo de la web: pan de ajo gratis de lunes a jueves.
 *
 * Es un producto de nico con precio ₡0 ("Regalia pan ajo"), marcado oculto en
 * la web para que el bot de WhatsApp no lo ofrezca. Así sale
 * facturado y descontado del inventario como cualquier otro. No se muestra en
 * la carta: se reclama desde el carrito, uno por pedido y solo si el pedido
 * trae algo más. El servidor vuelve a aplicar estas reglas antes de mandar el
 * pedido a nico, porque esconder el botón no impide armar el carrito a mano.
 */
export const GIFT = {
  saleItemId: "cmv8txm6j0009if06c1nxh6js",
  description: "Pan de ajo de regalo",
  /** Días de la semana en Costa Rica (0 = domingo). */
  days: [1, 2, 3, 4],
} as const;

export function isGift(saleItemId: string): boolean {
  return saleItemId === GIFT.saleItemId;
}

export function giftAvailableToday(date: Date = new Date()): boolean {
  return (GIFT.days as readonly number[]).includes(nowInCostaRica(date).day);
}

/**
 * Deja el regalo solo si corresponde: hoy es día de regalo, hay al menos otro
 * producto, y como mucho una unidad. Si no corresponde, lo saca sin error: es
 * ₡0, así que el total no cambia.
 */
export function sanitizeGift<T extends { saleItemId: string; quantity: number }>(
  items: T[],
  date: Date = new Date()
): T[] {
  const others = items.filter((i) => !isGift(i.saleItemId));
  const gift = items.find((i) => isGift(i.saleItemId));
  if (!gift || others.length === 0 || !giftAvailableToday(date)) return others;
  return [...others, { ...gift, quantity: 1 }];
}
