"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DragScrollerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Carrusel horizontal que además se arrastra con el mouse.
 *
 * En laptop el scroll horizontal sale gratis (dos dedos en el trackpad), pero
 * con un mouse de escritorio no hay gesto: la rueda hace scroll vertical y la
 * barra está oculta, así que el carrusel parecía no tener más contenido.
 *
 * Solo se engancha al puntero de tipo mouse — en táctil el scroll nativo ya
 * funciona y capturarlo lo empeoraría. El arrastre no rompe el clic de las
 * tarjetas: hasta que no se superan unos pocos píxeles no se considera
 * arrastre, y si lo hubo se cancela el clic que el navegador dispara al soltar.
 */
export function DragScroller({ children, className }: DragScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const [scrollable, setScrollable] = useState(false);

  // El cursor de "agarrar" solo tiene sentido si hay algo fuera de la vista.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [children]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startScroll: el.scrollLeft };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const el = ref.current;
    if (!state.active || !el) return;

    const dx = e.clientX - state.startX;
    if (!state.moved) {
      if (Math.abs(dx) < 5) return; // umbral: un clic con temblor sigue siendo clic
      state.moved = true;
      el.setPointerCapture(e.pointerId);
      // El snap obligatorio pelea contra el scroll programático: se apaga
      // mientras dura el arrastre y vuelve al soltar para que encaje solo.
      el.style.scrollSnapType = "none";
      el.style.userSelect = "none";
    }
    el.scrollLeft = state.startScroll - dx;
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const el = ref.current;
    if (!state.active || !el) return;
    state.active = false;

    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    el.style.scrollSnapType = "";
    el.style.userSelect = "";

    if (state.moved) {
      // Soltar dispara un clic en la tarjeta de abajo: se traga solo ese.
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      el.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => el.removeEventListener("click", swallow, true), 0);
    }
  }, []);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // Sin esto el navegador arranca su propio arrastre de imagen/texto.
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        className,
        scrollable && "cursor-grab active:cursor-grabbing"
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {children}
    </div>
  );
}