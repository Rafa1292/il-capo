import { nicoGet } from "@/lib/nico";
import type { MenuCategory, PizzaBuilderData } from "@/types";
import type { Catalog } from "@/lib/pricing";

// Trae el catálogo autoritativo (precios reales) desde nico para tarificar en el servidor.
export async function getCatalog(): Promise<Catalog> {
  const [menu, builder] = await Promise.all([
    nicoGet<{ data: MenuCategory[] }>("/api/public/menu"),
    nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder").catch(() => null),
  ]);
  return {
    categories: menu.data ?? [],
    builder: builder?.data ?? null,
  };
}
