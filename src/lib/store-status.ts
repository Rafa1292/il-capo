import { nicoGet } from "@/lib/nico";
import type { Location } from "@/lib/locations";

/**
 * ¿La sede está recibiendo pedidos ahora mismo?
 *
 * Lo decide el local desde nico, sede por sede. Sirve para avisar ANTES: sin
 * esto el cliente arma un carrito, llena sus datos y se entera al pagar de que
 * la cocina está cerrada.
 *
 * Esto es solo el aviso. El corte de verdad está en nico, que rechaza el pedido
 * con `ORDERS_PAUSED` — un cliente con la página vieja abierta no se cuela.
 */

export interface StoreStatus {
  ordersEnabled: boolean;
  pausedNote: string | null;
}

const OPEN: StoreStatus = { ordersEnabled: true, pausedNote: null };

export async function getStoreStatus(location: Location): Promise<StoreStatus> {
  try {
    const json = await nicoGet<{ data: StoreStatus }>("/api/public/status", {
      // 30s: apagar las ventas es urgente (se dañó el horno) y nadie quiere
      // esperar un minuto a que la página se entere.
      revalidate: 30,
      location,
    });
    return json.data ?? OPEN;
  } catch {
    // Si nico no responde, se asume abierto. Es lo correcto: un fallo de red
    // no puede cerrarle las ventas al negocio, y si de verdad está pausado el
    // pedido se rechaza igual al enviarlo.
    return OPEN;
  }
}
