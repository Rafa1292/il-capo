import { Flame, UtensilsCrossed } from "lucide-react";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { DragScroller } from "@/components/ui/drag-scroller";
import type { MenuItem } from "@/types";

interface Props {
  items: MenuItem[];
  /** Título del carrusel; por defecto "Promo"/"Promos" según la cantidad. */
  title?: string;
  icon?: "promo" | "lunch";
}

/**
 * Carrusel arriba de la carta con las tarjetas de arte entero. Se usa para
 * "Promos" (la categoría de promociones y lo que tiene horario de venta, ej.
 * "2x1 solo los lunes") y para "Almuerzos". nico solo manda cada producto
 * dentro de su horario y la carta se recalcula cada minuto, así que lo del día
 * desaparece solo fuera de hora.
 */
export function TodayPromos({ items, title, icon = "promo" }: Props) {
  if (items.length === 0) return null;
  const Icon = icon === "lunch" ? UtensilsCrossed : Flame;
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon className="h-4 w-4" />
          </span>
          {title ?? (items.length === 1 ? "Promo" : "Promos")}
        </h2>
        {items.length > 1 && <p className="text-xs text-muted-foreground">Deslizá para ver más →</p>}
      </div>
      <DragScroller className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {items.map((item) => (
          <div key={item.id} className={items.length === 1 ? "w-full shrink-0" : "w-[85%] max-w-[340px] shrink-0 snap-start"}>
            <MenuItemCard item={item} variant="promo" />
          </div>
        ))}
      </DragScroller>
    </section>
  );
}
