// Pricing autoritativo del carrito.
//
// Es la ÚNICA fuente de verdad para calcular totales y se usa en el servidor para
// NO confiar en los precios que manda el cliente. Recalcula todo a partir del
// catálogo real de nico (menú + pizza builder). La misma lógica que muestra el
// cliente (menu-item-card / modifier-selector / pizza-builder), pero con precios
// que vienen del backend, no del navegador.

import type {
  MenuCategory,
  MenuItem,
  PizzaBuilderData,
  PizzaBuilderTopping,
  PizzaBuilderCartSelection,
} from "@/types";

/** Error de negocio: ítem/modificador/selección inexistente o inválida. */
export class PricingError extends Error {}

// ── Topes de sanidad ─────────────────────────────────────────────────────────
// Evitan pedidos absurdos (qty 5000, 2.5, carritos de 500 líneas) antes de
// autorizar un cobro. Son generosos para uso legítimo de un restaurante.
export const MAX_CART_LINES = 50;
export const MAX_LINE_QUANTITY = 50;
export const MAX_MODIFIER_QUANTITY = 20;
export const MAX_TOPPING_PORTIONS = 10;

/** Valida que una cantidad sea un entero entre 1 y max. Lanza PricingError si no. */
export function assertQuantity(qty: unknown, max: number, what: string): asserts qty is number {
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > max) {
    throw new PricingError(`Cantidad inválida de ${what}`);
  }
}

// ── Vista mínima de un ítem para tarificar (solo ids/cantidades, sin precios) ──
export interface PriceableModifierElement {
  modifierElementId: string;
  quantity: number;
  isCombined?: boolean;
}
export interface PriceableModifierGroup {
  modifierGroupId: string;
  elements: PriceableModifierElement[];
}
export interface PriceableItem {
  saleItemId: string;
  quantity: number;
  modifiers?: PriceableModifierGroup[];
  pizzaBuilder?: PizzaBuilderCartSelection;
}

export interface Catalog {
  categories: MenuCategory[];
  builder: PizzaBuilderData | null;
}

// ── Índice del menú para lookups O(1) ────────────────────────────────────────
export interface MenuIndex {
  itemById: Map<string, MenuItem>;
  /** saleItemId -> (modifierElementId -> precio autoritativo). Incluye combinables. */
  elementPriceByItem: Map<string, Map<string, number>>;
}

export function buildMenuIndex(categories: MenuCategory[]): MenuIndex {
  const itemById = new Map<string, MenuItem>();
  const elementPriceByItem = new Map<string, Map<string, number>>();

  for (const cat of categories) {
    for (const item of cat.items) {
      itemById.set(item.id, item);
      const elMap = new Map<string, number>();
      for (const g of item.modifierGroups) {
        for (const el of g.elements) {
          elMap.set(el.modifierElementId, el.price);
          for (const ce of el.combinableGroupElements ?? []) {
            elMap.set(ce.modifierElementId, ce.price);
          }
        }
      }
      elementPriceByItem.set(item.id, elMap);
    }
  }
  return { itemById, elementPriceByItem };
}

/** Precio autoritativo de un modificador de un ítem. Lanza si no existe. */
export function authoritativeElementPrice(
  index: MenuIndex,
  saleItemId: string,
  modifierElementId: string
): number {
  const price = index.elementPriceByItem.get(saleItemId)?.get(modifierElementId);
  if (price === undefined) {
    throw new PricingError(`Modificador inválido (${modifierElementId}) para el ítem ${saleItemId}`);
  }
  return price;
}

// ── Precio BASE de un ítem (sin modificadores) ───────────────────────────────
// nico espera unitPrice = solo el precio propio del ítem (pizza = base+toppings);
// los modificadores se listan aparte en modifiers[] y se suman por separado.
export function priceItemBase(item: PriceableItem, catalog: Catalog, index: MenuIndex): number {
  if (item.pizzaBuilder) {
    // Error normal (no PricingError): que el builder no cargue es un fallo de
    // infraestructura reintentable (500), no un carrito inválido (400).
    if (!catalog.builder) throw new Error("Pizza builder no disponible");
    return pricePizzaUnit(item.pizzaBuilder, catalog.builder);
  }
  const menuItem = index.itemById.get(item.saleItemId);
  if (!menuItem) throw new PricingError(`Ítem inexistente: ${item.saleItemId}`);
  return menuItem.price;
}

// ── Suma de los modificadores de un ítem (precios autoritativos) ─────────────
export function priceItemModifiers(item: PriceableItem, index: MenuIndex): number {
  let sum = 0;
  for (const g of item.modifiers ?? []) {
    for (const el of g.elements) {
      const qty = el.quantity ?? 1;
      assertQuantity(qty, MAX_MODIFIER_QUANTITY, "modificadores");
      sum += authoritativeElementPrice(index, item.saleItemId, el.modifierElementId) * qty;
    }
  }
  return sum;
}

// ── Precio unitario de una pizza del builder ─────────────────────────────────
export function pricePizzaUnit(sel: PizzaBuilderCartSelection, data: PizzaBuilderData): number {
  const size = data.sizes.find((s) => s.id === sel.sizeId);
  const dough = data.doughs.find((d) => d.id === sel.doughId);
  const sauce = data.sauces.find((s) => s.id === sel.sauceId);
  if (!size || !dough || !sauce) throw new PricingError("Selección de pizza inválida (tamaño/masa/salsa)");

  const toppingById = new Map<string, PizzaBuilderTopping>();
  for (const g of data.toppingGroups) for (const t of g.toppings) toppingById.set(t.id, t);

  let total = size.basePrice + dough.extraPrice + sauce.extraPrice;

  const addToppings = (
    list: { toppingId: string; portions: number }[] | undefined,
    half: boolean
  ) => {
    for (const { toppingId, portions } of list ?? []) {
      if (!portions) continue;
      assertQuantity(portions, MAX_TOPPING_PORTIONS, "porciones");
      const t = toppingById.get(toppingId);
      if (!t) throw new PricingError(`Topping inválido: ${toppingId}`);
      const row = t.portionsBySize.find((p) => p.sizeId === sel.sizeId);
      if (!row) throw new PricingError(`Topping ${toppingId} no disponible para el tamaño ${sel.sizeId}`);
      const units = half ? row.unitsPerHalf : row.unitsPerPortion;
      total += t.pricePerUnit * units * portions;
    }
  };

  if (sel.isHalf) {
    addToppings(sel.leftToppings, true);
    addToppings(sel.rightToppings, true);
  } else {
    addToppings(sel.toppings, false);
  }
  return total;
}

/**
 * Total autoritativo de UNA unidad = base + modificadores.
 * (El campo unitPrice que se envía a nico es solo la base; ver priceItemBase.)
 */
export function priceItemUnit(item: PriceableItem, catalog: Catalog, index: MenuIndex): number {
  return priceItemBase(item, catalog, index) + priceItemModifiers(item, index);
}

// ── Total autoritativo del carrito ───────────────────────────────────────────
export interface PricedLine {
  saleItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
export interface PricedCart {
  total: number;
  lines: PricedLine[];
}

export function priceCart(items: PriceableItem[], catalog: Catalog): PricedCart {
  if (!items || items.length === 0) throw new PricingError("Carrito vacío");
  if (items.length > MAX_CART_LINES) throw new PricingError("Demasiados artículos en el carrito");
  const index = buildMenuIndex(catalog.categories);

  const lines: PricedLine[] = items.map((item) => {
    assertQuantity(item.quantity, MAX_LINE_QUANTITY, "artículos");
    const unitPrice = priceItemUnit(item, catalog, index);
    return {
      saleItemId: item.saleItemId,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { total, lines };
}
