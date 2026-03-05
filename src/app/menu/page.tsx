import { nicoGet } from "@/lib/nico";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import type { MenuCategory } from "@/types";

async function getMenu(): Promise<MenuCategory[]> {
  try {
    const json = await nicoGet<{ data: { categories: MenuCategory[] } }>("/api/public/menu");
    return json.data.categories ?? [];
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Nuestro menú</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agrega productos al carrito y procede al checkout
        </p>
      </div>

      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="text-lg font-bold mb-1 pb-2 border-b border-primary/30">
            {category.name}
          </h2>
          <div>
            {category.items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
