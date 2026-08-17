"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatMinutes, openStatus, type Schedule } from "@/lib/schedule";

/**
 * "Abierto · 11:00 – 20:30" en la cabecera de la portada.
 *
 * El horario llega ya resuelto desde el servidor (lo publica el local en nico),
 * pero si está abierto AHORA se calcula en el cliente a propósito: la portada
 * es estática con ISR, así que un cálculo en el servidor quedaría congelado
 * hasta la próxima revalidación y podría decir "abierto" a las 11 de la noche.
 */
export function OpeningStatus({ schedule }: { schedule: Schedule }) {
  const [state, setState] = useState<{ isOpen: boolean; hours: string | null } | null>(null);

  useEffect(() => {
    const tick = () => {
      const { isOpen, hours } = openStatus(schedule);
      setState({
        isOpen,
        hours: hours ? `${formatMinutes(hours.open)} – ${formatMinutes(hours.close)}` : null,
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [schedule]);

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
