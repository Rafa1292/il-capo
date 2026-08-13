"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatMinutes, openStatus } from "@/lib/schedule";

/**
 * "Abierto · 11:00 – 20:30" en la cabecera de la portada.
 *
 * Se calcula en el cliente a propósito: la portada es estática con ISR, así que
 * un cálculo en el servidor quedaría congelado hasta la próxima revalidación y
 * podría decir "abierto" a las 11 de la noche.
 */
export function OpeningStatus() {
  const [state, setState] = useState<{ isOpen: boolean; hours: string | null } | null>(null);

  useEffect(() => {
    const tick = () => {
      const { isOpen, block } = openStatus();
      setState({
        isOpen,
        hours: block ? `${formatMinutes(block.open)} – ${formatMinutes(block.close)}` : null,
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Antes de montar reservamos el alto para que la cabecera no salte.
  if (!state) return <span className="h-5 block" aria-hidden />;

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          state.isOpen ? "bg-emerald-500" : "bg-muted-foreground/40"
        )}
        aria-hidden
      />
      <span className={cn("font-medium", state.isOpen ? "text-foreground" : "text-muted-foreground")}>
        {state.isOpen ? "Abierto" : "Cerrado"}
      </span>
      {state.hours && (
        <span className="text-muted-foreground tabular-nums">· {state.hours}</span>
      )}
    </span>
  );
}
