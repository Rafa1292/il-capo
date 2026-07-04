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
      {/* Encabezado — misma firma elegante del home */}
      <div className="flex flex-col items-center gap-3 pb-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Nuestra carta
        </p>
        <div className="flex items-center gap-3 w-40">
          <span className="flex-1 border-t border-border" />
          <span className="text-primary/60 text-[10px]">✦</span>
          <span className="flex-1 border-t border-border" />
        </div>
      </div>

      <CategoryNav categories={categories} />

      <div className="space-y-8 mt-5">
        {categories.map((category) => (
          <section key={category.id} id={`cat-${category.id}`}>
            {/* Divisor ornamental centrado — estilo carta italiana */}
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-[0.15em] text-foreground">
                <span className="text-[9px] text-primary/70">✦</span>
                {category.name}
                <span className="text-[9px] text-primary/70">✦</span>
              </h2>
              <span className="h-px flex-1 bg-border" />
            </div>
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
