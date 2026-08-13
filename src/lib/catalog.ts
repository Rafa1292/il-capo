import { nicoGet } from "@/lib/nico";
import type { Location } from "@/lib/locations";
import type { MenuCategory, PizzaBuilderData } from "@/types";
import type { Catalog } from "@/lib/pricing";

// Trae el catálogo autoritativo (precios reales) desde nico para tarificar en el
// servidor. Va por sede: cada una es un tenant con su propio catálogo y precios.
export async function getCatalog(location: Location): Promise<Catalog> {
  const [menu, builder] = await Promise.all([
    nicoGet<{ data: MenuCategory[] }>("/api/public/menu", { location }),
    nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder", { location }).catch(
      () => null
    ),
  ]);
  return {
    categories: menu.data ?? [],
    builder: builder?.data ?? null,
  };
}
