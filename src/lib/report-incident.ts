import { nicoPost } from "@/lib/nico";
import type { Location } from "@/lib/locations";

/**
 * Le avisa a nico que un cobro quedó autorizado sin pedido.
 *
 * Toda la reconciliación de pagos de nico arranca desde un pedido guardado: solo
 * revisa pedidos que existen. Cuando la cadena se rompe justo acá —la tarjeta ya
 * autorizada, el pedido sin entrar— no hay nada en su base que revisar, así que
 * la plata queda retenida en la tarjeta del cliente y el negocio no se entera.
 * Ya pasó tres veces y se descubrió mirando el estado de cuenta, no el sistema.
 *
 * Esta es la única parte del sistema que sabe que pasó, porque es donde se
 * rompe. Por eso lo reporta y no lo deduce nico.
 */

interface IncidentInput {
  orderNumber: string;
  amount: number;
  currency?: string;
  authCode?: string;
  /** VERIFY: no se pudo confirmar el cobro. REGISTER: confirmado y sin pedido. */
  stage: "VERIFY" | "REGISTER";
  reason: string;
  customerName?: string;
  customerPhone?: string;
}

/**
 * Nunca lanza ni se espera en el camino del cliente.
 *
 * Si reportar la incidencia fallara, lo último que queremos es empeorar la
 * respuesta de alguien que ya tuvo un problema pagando. Se registra en el log y
 * sigue: el reporte es para el negocio, no para el cliente.
 */
export function reportIncident(sede: Location, input: IncidentInput): void {
  void nicoPost("/api/public/order-incidents", input, sede).catch((err) => {
    console.error(
      `[incident] no se pudo reportar el cobro huérfano ${input.orderNumber}:`,
      err
    );
  });
}
