import { nicoGet } from "@/lib/nico";
import { DEFAULT_SCHEDULE, parseSchedule, type RawScheduleDay, type Schedule } from "@/lib/schedule";
import type { Location } from "@/lib/locations";

/**
 * Lo que el local publica sobre la sede: si recibe pedidos ahora mismo y en qué
 * horario atiende. Las dos cosas se administran en nico, sede por sede.
 *
 * Sirve para avisar ANTES: sin esto el cliente arma un carrito, llena sus datos
 * y se entera al pagar de que la cocina está cerrada.
 *
 * Esto es solo el aviso. El corte de verdad está en nico, que rechaza el pedido
 * con `ORDERS_PAUSED` — un cliente con la página vieja abierta no se cuela.
 */

export interface StoreStatus {
  ordersEnabled: boolean;
  pausedNote: string | null;
  schedule: Schedule;
}

interface RawStatus {
  ordersEnabled: boolean;
  pausedNote: string | null;
  schedule?: RawScheduleDay[] | null;
}

const FALLBACK: StoreStatus = {
  ordersEnabled: true,
  pausedNote: null,
  schedule: DEFAULT_SCHEDULE,
};

export async function getStoreStatus(location: Location): Promise<StoreStatus> {
  try {
    const json = await nicoGet<{ data: RawStatus }>("/api/public/status", {
      // 30s: apagar las ventas es urgente (se dañó el horno) y nadie quiere
      // esperar un minuto a que la página se entere. El horario viaja en la
      // misma respuesta para no agregar otro viaje de red.
      revalidate: 30,
      location,
    });
    const data = json.data;
    if (!data) return FALLBACK;

    return {
      ordersEnabled: data.ordersEnabled,
      pausedNote: data.pausedNote,
      schedule: parseSchedule(data.schedule),
    };
  } catch {
    // Si nico no responde, se asume abierto y con el horario de respaldo. Es lo
    // correcto: un fallo de red no puede cerrarle las ventas al negocio, y si
    // de verdad está pausado el pedido se rechaza igual al enviarlo.
    return FALLBACK;
  }
}
