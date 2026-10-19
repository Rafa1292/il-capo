import { Flame } from "lucide-react";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import type { MenuItem } from "@/types";

/**
 * "Promos", arriba de la carta: la categoría de promociones y lo que tiene
 * horario de venta (ej. "2x1 solo los lunes"). nico solo manda cada producto
 * dentro de su horario y la carta se recalcula cada minuto, así que las del
 * día desaparecen solas al día siguiente.
 */
export function TodayPromos({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold uppercase tracking-[0.12em] text-primary">
        <Flame className="h-5 w-5" />
        {items.length === 1 ? "Promo" : "Promos"}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            {item.schedule && (
              <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {item.schedule}
              </span>
            )}
            <MenuItemCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
