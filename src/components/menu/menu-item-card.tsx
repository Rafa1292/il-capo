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
  /** `promo`: tarjeta destacada del carrusel de promos (foto grande, sticker, precio grande). */
  variant?: "default" | "promo";
}

/** "2x1", "3x2"… si el nombre lo dice; si no, "Promo". Va como sticker en la foto. */
function promoSticker(name: string): string {
  const m = /(\d+)\s*x\s*(\d+)/i.exec(name);
  return m ? `${m[1]}x${m[2]}` : "Promo";
}

export function MenuItemCard({ item, variant = "default" }: Props) {
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

  function handleModifierConfirm(
    lines: { modifiers: CartModifierGroup[]; quantity: number }[]
  ) {
    for (const line of lines) {
      addItem({
        saleItemId: item.id,
        description: item.name,
        quantity: line.quantity,
        unitPrice: item.price,
        modifiers: line.modifiers,
      });
    }
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

  // El precio más bajo cuando lo define el tamaño: en la promo se muestra "desde".
  const fromPrice = priceGroup ? Math.min(...priceGroup.elements.map((e) => e.price)) : item.price;

  if (variant === "promo") {
    return (
      <>
        {/* 100% foto: nombre, precio y botón van encima de la imagen. */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative aspect-[4/5] w-full bg-muted">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 85vw, 340px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                <Pizza className="h-12 w-12" />
              </div>
            )}
            {/* Degradado para que el texto se lea sobre cualquier foto. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            {/* Todo abajo: si la foto es un arte (logo, título), arriba queda limpio. */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="-rotate-3 rounded-md bg-primary px-2.5 py-0.5 text-sm font-black uppercase tracking-tight text-primary-foreground shadow-lg">
                  {promoSticker(item.name)}
                </span>
                {item.schedule && (
                  <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow">
                    {item.schedule}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold leading-tight text-white drop-shadow">{item.name}</p>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-white/80">{item.description}</p>
              )}
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-3xl font-black text-white drop-shadow">
                  {priceGroup && <span className="mr-1 text-xs font-medium text-white/70">desde</span>}
                  ₡{fromPrice.toLocaleString("es-CR")}
                </p>
                {/* Sobre la foto: el control va en una píldora blanca para que se lea. */}
                <div className="rounded-full bg-white/95 p-1 shadow-lg">{action}</div>
              </div>
            </div>
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
