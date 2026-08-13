import { nicoPost } from "@/lib/nico";
import type { Location } from "@/lib/locations";

/**
 * Costo del envío. Lo decide nico según la distancia entre el local y el pin
 * que marcó el cliente; acá nunca se calcula ni se acepta del navegador.
 *
 * Se consulta dos veces a propósito: al mostrar el checkout (para que el
 * cliente vea el monto) y otra vez al autorizar y al registrar el pedido. Con
 * tarjeta el monto se autoriza una sola vez y no se puede capturar de más, así
 * que el número que se cobra tiene que salir de la misma fuente que lo valida.
 */

export interface DeliveryQuote {
  covered: boolean;
  price: number;
  distanceKm: number;
  zoneName: string | null;
}

export class OutOfRangeError extends Error {
  constructor() {
    super("La dirección está fuera de nuestra zona de entrega");
  }
}

export async function quoteDelivery(
  point: { latitude: number; longitude: number },
  sede: Location
): Promise<DeliveryQuote> {
  const json = await nicoPost<{ data: DeliveryQuote }>(
    "/api/public/delivery-quote",
    point,
    sede
  );
  return json.data;
}

/**
 * Envío que corresponde a un pedido. Cero para retiro en el local.
 * Lanza `OutOfRangeError` si el punto quedó fuera de toda zona.
 */
export async function resolveDeliveryFee(
  deliveryMethod: "TAKEOUT" | "DELIVERY",
  point: { latitude: number; longitude: number } | null,
  sede: Location
): Promise<number> {
  if (deliveryMethod !== "DELIVERY") return 0;
  if (!point) {
    throw new Error("Falta marcar en el mapa dónde entregamos");
  }

  const quote = await quoteDelivery(point, sede);
  if (!quote.covered) throw new OutOfRangeError();

  return quote.price;
}
