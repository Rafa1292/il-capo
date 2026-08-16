import { PauseCircle } from "lucide-react";
import type { StoreStatus } from "@/lib/store-status";

/**
 * Aviso de que la sede no está tomando pedidos.
 *
 * Va arriba de la carta y no escondido en el checkout: el objetivo es que nadie
 * arme un pedido de ₡15.000 para descubrir al pagar que la cocina está cerrada.
 * La carta se sigue viendo a propósito —sirve para consultar precios— pero
 * queda claro desde el primer momento que hoy no se puede pedir.
 */
export function PausedBanner({ status }: { status: StoreStatus }) {
  if (status.ordersEnabled) return null;

  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">Por ahora no estamos recibiendo pedidos</p>
        <p className="text-xs text-muted-foreground">
          {status.pausedNote ?? "Podés ver la carta, pero todavía no se puede pedir."}
        </p>
      </div>
    </div>
  );
}
