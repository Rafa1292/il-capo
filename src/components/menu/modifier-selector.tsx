"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";
import type { MenuItem, CartModifierGroup, CartModifierElement } from "@/types";

interface Props {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
  onConfirm: (modifiers: CartModifierGroup[]) => void;
}

export function ModifierSelector({ item, open, onClose, onConfirm }: Props) {
  // State: for each group, track selected elements {id -> quantity}
  const [selected, setSelected] = useState<Record<string, Record<string, number>>>({});

  function getQty(groupId: string, elementId: string) {
    return selected[groupId]?.[elementId] ?? 0;
  }

  function setQty(groupId: string, elementId: string, qty: number, maxSelect: number) {
    setSelected((prev) => {
      const group = { ...(prev[groupId] ?? {}) };
      const groupTotal = Object.values(group).reduce((s, v) => s + v, 0);
      const current = group[elementId] ?? 0;
      const delta = qty - current;

      if (delta > 0 && groupTotal + delta > maxSelect) return prev; // cap
      if (qty <= 0) {
        delete group[elementId];
      } else {
        group[elementId] = qty;
      }
      return { ...prev, [groupId]: group };
    });
  }

  function isValid() {
    for (const group of item.modifierGroups) {
      const total = Object.values(selected[group.modifierGroupId] ?? {}).reduce(
        (s, v) => s + v,
        0
      );
      if (total < group.minSelect) return false;
    }
    return true;
  }

  function handleConfirm() {
    const modifiers: CartModifierGroup[] = item.modifierGroups
      .map((g) => {
        const selectedEls = selected[g.modifierGroupId] ?? {};
        const elements: CartModifierElement[] = g.elements
          .filter((el) => (selectedEls[el.modifierElementId] ?? 0) > 0)
          .map((el) => ({
            modifierElementId: el.modifierElementId,
            name: el.name,
            price: el.price,
            quantity: selectedEls[el.modifierElementId],
          }));
        return { ...g, elements };
      })
      .filter((g) => g.elements.length > 0);

    onConfirm(modifiers);
    setSelected({});
    onClose();
  }

  function handleClose() {
    setSelected({});
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl flex flex-col max-h-[88vh] p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <SheetTitle className="text-base">{item.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4 px-5 overflow-y-auto flex-1">
          {item.modifierGroups.map((group) => {
            const groupTotal = Object.values(selected[group.modifierGroupId] ?? {}).reduce(
              (s, v) => s + v,
              0
            );
            const required = group.minSelect > 0;
            return (
              <div key={group.modifierGroupId} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{group.name}</h3>
                  {required && (
                    <Badge variant="destructive" className="text-xs">
                      Requerido
                    </Badge>
                  )}
                  {group.maxSelect > 1 && (
                    <span className="text-xs text-muted-foreground">
                      Máx {group.maxSelect}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {group.elements.map((el) => {
                    const qty = getQty(group.modifierGroupId, el.modifierElementId);
                    return (
                      <div key={el.modifierElementId} className="flex items-center justify-between gap-3 py-1">
                        <div>
                          <span className="text-sm">{el.name}</span>
                          {el.price > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              +₡{el.price.toLocaleString("es-CR")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {qty > 0 ? (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  setQty(group.modifierGroupId, el.modifierElementId, qty - 1, group.maxSelect)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-4 text-center text-sm font-medium">{qty}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  setQty(group.modifierGroupId, el.modifierElementId, qty + 1, group.maxSelect)
                                }
                                disabled={groupTotal >= group.maxSelect}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                setQty(group.modifierGroupId, el.modifierElementId, 1, group.maxSelect)
                              }
                              disabled={groupTotal >= group.maxSelect}
                            >
                              Agregar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <SheetFooter className="px-5 py-4 border-t border-border shrink-0 flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid()}
            className="flex-1 bg-primary text-primary-foreground"
          >
            Agregar al carrito
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
