"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { closedNow, type Schedule } from "@/lib/schedule";

/**
 * Aviso de que ahora el local está cerrado y no se reciben pedidos.
 *
 * Se calcula en el cliente por lo mismo que `OpeningStatus`: la carta es ISR y
 * un cálculo en el servidor quedaría congelado hasta la próxima revalidación.
 * Solo aparece si la sede publicó su horario en nico (sin horario no se corta
 * nada) y si los pedidos no están pausados (de eso avisa `PausedBanner`).
 */
export function ClosedBanner({
  schedule,
  configured,
  ordersEnabled,
}: {
  schedule: Schedule;
  configured: boolean;
  ordersEnabled: boolean;
}) {
  const [next, setNext] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => {
      const shut = closedNow(schedule, configured && ordersEnabled);
      setNext(shut.closed ? shut.next ?? null : undefined);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [schedule, configured, ordersEnabled]);

  if (next === undefined) return null;
  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">
          Ahora estamos cerrados{next ? ` · abrimos ${next}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Podés ver la carta, pero los pedidos se reciben solo en nuestro horario.
        </p>
      </div>
    </div>
  );
}
