"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Minus, Pizza } from "lucide-react";
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
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const items = useCartStore((s) => s.items);

  // Evita mismatch de hidratación: el carrito persistido solo se refleja tras montar
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Solo abrimos el configurador si hay una elección obligatoria (ej. tamaño/sabor)
  const needsConfig = item.modifierGroups.some((g) => g.minSelect > 0);
  // Tiene extras opcionales que se pueden personalizar sin forzar
  const hasExtras = item.modifierGroups.some((g) => g.elements.length > 0);

  // Ítems de precio 0: el precio lo define un grupo "elegir uno" requerido cuyos
  // elementos tienen precio (ej. Tamaño: Personal/Mediana/Grande). Lo mostramos en la card.
  const priceGroup =
    item.price === 0
      ? item.modifierGroups.find(
          (g) =>
            g.maxSelect === 1 &&
            g.minSelect >= 1 &&
            g.elements.length > 0 &&
            g.elements.every((e) => e.price > 0)
        )
      : undefined;

  // Línea "simple" de este producto (sin modificadores) — para el stepper de 1 toque
  const plainLine = mounted
    ? items.find(
        (i) => i.saleItemId === item.id && i.modifiers.length === 0 && !i.pizzaBuilder
      )
    : undefined;
  const plainQty = plainLine?.quantity ?? 0;
  // Cantidad total de este producto en el carrito (todas las configuraciones)
  const totalQty = mounted
    ? items.filter((i) => i.saleItemId === item.id).reduce((s, i) => s + i.quantity, 0)
    : 0;

  function quickAdd() {
    if (plainLine) {
      updateQuantity(plainLine.cartId, plainLine.quantity + 1);
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

  function quickRemove() {
    if (plainLine) updateQuantity(plainLine.cartId, plainLine.quantity - 1); // 0 → elimina
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

  const action = (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {needsConfig ? (
        // Requiere elegir (tamaño/sabor): abre el configurador
        <Button
          size="sm"
          className="relative h-8 gap-1 rounded-full bg-primary px-4 hover:bg-primary/90"
          onClick={() => setModifierOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Agregar
          {totalQty > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
              {totalQty}
            </span>
          )}
        </Button>
      ) : plainQty > 0 ? (
        // Ya agregado: stepper de cantidad
        <div className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 p-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
            onClick={quickRemove}
            aria-label="Quitar uno"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-5 text-center text-sm font-semibold tabular-nums">
            {plainQty}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
            onClick={quickAdd}
            aria-label="Agregar uno"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="h-8 gap-1 rounded-full bg-primary px-4 hover:bg-primary/90"
          onClick={quickAdd}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      )}

      {/* Extras opcionales: acceso al configurador sin forzarlo */}
      {!needsConfig && hasExtras && (
        <button
          onClick={() => setModifierOpen(true)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Personalizar
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Foto (placeholder mientras no haya imageUrl) */}
        <div className="relative aspect-[16/10] w-full bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
              <Pizza className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5">
          <p className="text-sm font-semibold leading-tight">{item.name}</p>
          {item.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}

          {priceGroup ? (
            // Precio definido por tamaño: mostramos las opciones con su precio
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...priceGroup.elements]
                  .sort((a, b) => a.price - b.price)
                  .map((el) => (
                  <span
                    key={el.modifierElementId}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"
                  >
                    <span className="font-medium">{el.name.trim()}</span>
                    <span className="font-semibold text-primary">
                      ₡{el.price.toLocaleString("es-CR")}
                    </span>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex justify-end">{action}</div>
            </>
          ) : (
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-sm font-bold text-primary">
                ₡{item.price.toLocaleString("es-CR")}
              </p>
              {action}
            </div>
          )}
        </div>
      </div>

      {(needsConfig || hasExtras) && (
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
