import { NextResponse } from "next/server";
import { requireLocation } from "@/lib/api-location";
import { getStoreStatus } from "@/lib/store-status";
import { closedNow } from "@/lib/schedule";

/**
 * Si la sede recibe pedidos AHORA, para la pantalla de pago.
 *
 * El checkout es una página de cliente sin el estado de la carta, y lo necesita
 * para no dejar llenar todo y recién al pagar avisar que está cerrado. Se
 * calcula en cada llamada: el horario es por minuto y no puede salir de caché.
 */
export async function GET() {
  const { location, response } = await requireLocation();
  if (response) return response;
  const status = await getStoreStatus(location);
  const shut = closedNow(status.schedule, status.scheduleConfigured && status.ordersEnabled);
  return NextResponse.json(
    {
      ordersEnabled: status.ordersEnabled,
      pausedNote: status.pausedNote,
      closed: shut.closed,
      opensAt: shut.next,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export const dynamic = "force-dynamic";
