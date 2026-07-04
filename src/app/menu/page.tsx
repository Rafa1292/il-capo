import { nicoGet } from "@/lib/nico";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { CategoryNav } from "@/components/menu/category-nav";
import type { MenuCategory } from "@/types";

async function getMenu(): Promise<MenuCategory[]> {
  try {
    const json = await nicoGet<{ data: MenuCategory[] }>("/api/public/menu");
    return json.data ?? [];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function MenuPage() {
  const categories = await getMenu();

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          El menú no está disponible en este momento.
        </p>
        <p className="text-sm text-muted-foreground">
          Por favor intenta nuevamente más tarde.
        </p>
      </div>
    );
  }

  return (
    <div>
      <CategoryNav categories={categories} />

      <div className="space-y-7 mt-4">
        {categories.map((category) => (
          <section key={category.id} id={`cat-${category.id}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 pb-2 border-b border-border">
              {category.name}
            </h2>
            {/* Carrusel horizontal — categorías cortas (≤4 ítems) */}
            <div
              className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {category.items.map((item) => (
                <div key={item.id} className="w-72 shrink-0 snap-start">
                  <MenuItemCard item={item} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
