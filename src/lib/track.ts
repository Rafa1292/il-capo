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

export type Metric = "VISIT" | "CART_ADD" | "CHECKOUT";

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

    const body = JSON.stringify({ metric, source: bucketOf(document.referrer) });

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
