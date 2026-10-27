/**
 * Contar visitas sin rastrear a nadie.
 *
 * No hay cookies, ni identificador, ni nada que persista entre sesiones. Lo
 * único que se guarda es una marca en `sessionStorage` para no contar diez
 * visitas cuando alguien navega entre pantallas — y eso muere al cerrar la
 * pestaña.
 *
 * De dónde llegó el visitante se reduce a una cubeta ("google", "facebook") y
 * nunca se manda la URL completa: los enlaces de referencia arrastran
 * parámetros que suelen traer datos personales sin que nadie lo note.
 */

export type Metric =
  | "VISIT"
  | "CART_ADD"
  | "CHECKOUT"
  /** Salió a pagar con tarjeta (a la pasarela). */
  | "PAY_START"
  /** Volvió de la pasarela sin pagar. */
  | "PAY_FAIL"
  /** Marcó una entrega fuera de la zona. */
  | "OUT_OF_RANGE"
  /** Llegó a pagar con el local cerrado. */
  | "STORE_CLOSED";

function bucketOf(referrer: string): string {
  if (!referrer) return "direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (host.includes("google")) return "google";
  if (host.includes("facebook") || host.includes("fb.")) return "facebook";
  if (host.includes("instagram")) return "instagram";
  if (host.includes("whatsapp") || host.includes("wa.me")) return "whatsapp";
  if (host.includes("tiktok")) return "tiktok";
  // El propio sitio no es una fuente: es navegación interna.
  if (typeof location !== "undefined" && host === location.hostname) return "direct";
  return "other";
}

/**
 * Links de anuncios pagados: `?src=anuncio-almuerzo` / `?src=anuncio-cena`.
 * Solo se aceptan estos valores fijos (nada que pueda traer datos de nadie).
 */
const AD_SOURCES: Record<string, string> = {
  "anuncio-almuerzo": "ad_lunch",
  "anuncio-cena": "ad_dinner",
};
const SOURCE_KEY = "ilcapo:src";

/**
 * De dónde llegó esta visita, fijado en la primera pantalla y recordado en la
 * pestaña: el carrito, el pago y el pedido de esa visita cuentan para el mismo
 * origen aunque después el referrer sea el propio sitio o la pasarela de pago.
 * Un link de anuncio siempre gana.
 */
export function trafficSource(): string {
  if (typeof window === "undefined") return "direct";
  try {
    const param = new URLSearchParams(location.search).get("src");
    const fromAd = param ? AD_SOURCES[param] : undefined;
    if (fromAd) {
      sessionStorage.setItem(SOURCE_KEY, fromAd);
      return fromAd;
    }
    const saved = sessionStorage.getItem(SOURCE_KEY);
    if (saved) return saved;
    const bucket = bucketOf(document.referrer);
    sessionStorage.setItem(SOURCE_KEY, bucket);
    return bucket;
  } catch {
    return bucketOf(typeof document === "undefined" ? "" : document.referrer);
  }
}

/**
 * Nunca lanza ni bloquea. Una métrica que rompe la pantalla del cliente cuesta
 * mucho más de lo que vale el dato.
 */
export function track(metric: Metric, options?: { once?: boolean }): void {
  if (typeof window === "undefined") return;

  try {
    if (options?.once) {
      const key = `ilcapo:m:${metric}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    }

    const body = JSON.stringify({ metric, source: trafficSource() });

    // `sendBeacon` sobrevive a que el usuario cierre o navegue justo después,
    // que es exactamente cuando se pierden las métricas interesantes.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/metrics", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // sessionStorage bloqueado, modo privado, lo que sea: se pierde el dato.
  }
}
