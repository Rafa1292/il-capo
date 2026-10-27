"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pizza, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MenuItem, ModifierGroup } from "@/types";

interface Props {
  item: MenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Grupo que define el precio (tamaños), si el ítem cuesta 0 por sí solo. */
  priceGroup?: ModifierGroup;
  /** El mismo control de la tarjeta (Agregar / stepper / Personalizar). */
  action: React.ReactNode;
  /** Arte de promo (4:5, con textos): se muestra entero, sin recortar. */
  isArt?: boolean;
}

/** Cuánto hay que arrastrar hacia abajo (px) para cerrar. */
const SWIPE_CLOSE_PX = 110;

/**
 * El botón "atrás" del celular cierra la vista en vez de salir de la página.
 * Al abrir se agrega una entrada al historial (copiando el estado de Next para
 * que su router la trate como la misma página); "atrás" la saca y cierra. Si se
 * cierra de otra forma (X, deslizar), se saca esa entrada a mano.
 */
function useCloseOnBack(open: boolean, close: () => void): void {
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!open) return;
    const isOurs = () => Boolean((window.history.state as { productDetail?: boolean } | null)?.productDetail);
    if (!isOurs()) window.history.pushState({ ...(window.history.state ?? {}), productDetail: true }, "");

    const onPop = () => close();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Diferido: en modo estricto el efecto se desmonta y vuelve a montar al
      // toque, y ahí la vista sigue abierta (no hay que sacar la entrada).
      setTimeout(() => {
        if (!openRef.current && isOurs()) window.history.back();
      }, 0);
    };
  }, [open, close]);
}

/** Vista del producto a pantalla completa: foto grande, descripción entera y el botón. */
export function ProductDetail({ item, open, onOpenChange, priceGroup, action, isArt }: Props) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useCloseOnBack(open, close);

  // Deslizar hacia abajo para cerrar, solo cuando el contenido está arriba de
  // todo (si no, el gesto es scroll normal).
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  function onTouchStart(e: React.TouchEvent) {
    startY.current = (scrollRef.current?.scrollTop ?? 0) <= 0 ? e.touches[0].clientY : null;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    setDragY(dy > 0 ? dy : 0);
  }
  function onTouchEnd() {
    if (startY.current !== null && dragY > SWIPE_CLOSE_PX) close();
    startY.current = null;
    setDragY(0);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100"
        style={
          dragY > 0
            ? { transform: `translateY(${dragY}px)`, opacity: Math.max(0.4, 1 - dragY / 600), transition: "none" }
            : undefined
        }
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {/* Manija: avisa que se puede deslizar hacia abajo para cerrar */}
        <div className="pointer-events-none absolute top-2 left-1/2 z-10 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/80 shadow" />
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-2xl">
            <div
              className={cn(
                "relative w-full bg-muted",
                isArt ? "aspect-[4/5] bg-black" : "aspect-square sm:aspect-[4/3]"
              )}
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 672px) 100vw, 672px"
                  className={isArt ? "object-contain" : "object-cover"}
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                  <Pizza className="h-16 w-16" />
                </div>
              )}
              <DialogClose
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </DialogClose>
            </div>

            <div className="space-y-3 p-5">
              <DialogTitle className="text-2xl font-bold leading-tight">{item.name}</DialogTitle>
              {item.schedule && (
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {item.schedule}
                </span>
              )}
              {item.description ? (
                <DialogDescription className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                  {item.description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">{item.name}</DialogDescription>
              )}

              {priceGroup && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {[...priceGroup.elements]
                    .sort((a, b) => a.price - b.price)
                    .map((el) => (
                      <span
                        key={el.modifierElementId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        <span className="font-medium">{el.name.trim()}</span>
                        <span className="font-semibold text-primary">₡{el.price.toLocaleString("es-CR")}</span>
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pie fijo: precio + el mismo botón de la tarjeta */}
        <div className="border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-3">
            <p className="text-2xl font-black text-primary">
              {priceGroup ? (
                <>
                  <span className="mr-1 text-xs font-medium text-muted-foreground">desde</span>₡
                  {Math.min(...priceGroup.elements.map((e) => e.price)).toLocaleString("es-CR")}
                </>
              ) : (
                <>₡{item.price.toLocaleString("es-CR")}</>
              )}
            </p>
            {action}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
