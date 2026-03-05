"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { ModifierSelector } from "./modifier-selector";
import type { MenuItem, CartModifierGroup } from "@/types";

interface Props {
  item: MenuItem;
}

export function MenuItemCard({ item }: Props) {
  const [modifierOpen, setModifierOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    if (item.modifierGroups.length > 0) {
      setModifierOpen(true);
    } else {
      addItem({
        saleItemId: item.id,
        description: item.name,
        quantity: 1,
        unitPrice: item.price,
        modifiers: [],
      });
    }
  }

  function handleModifierConfirm(modifiers: CartModifierGroup[]) {
    addItem({
      saleItemId: item.id,
      description: item.name,
      quantity: 1,
      unitPrice: item.price,
      modifiers,
    });
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3 py-3 border-b last:border-b-0">
        <div className="space-y-0.5 flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight">{item.name}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          )}
          <p className="text-sm font-semibold text-primary">
            ₡{item.price.toLocaleString("es-CR")}
          </p>
        </div>
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/90"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {item.modifierGroups.length > 0 && (
        <ModifierSelector
          item={item}
          open={modifierOpen}
          onClose={() => setModifierOpen(false)}
          onConfirm={handleModifierConfirm}
        />
      )}
    </>
  );
}
