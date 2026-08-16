import type { MetadataRoute } from "next";
import { getLocations } from "@/lib/locations";
import { absoluteUrl } from "@/lib/site";

/**
 * El mapa del sitio: la portada y la carta de cada sede.
 *
 * Se arma desde `getLocations()`, así que agregar una sucursal en
 * `NICO_LOCATIONS` la mete acá sola — no hay una lista que se olvide de
 * actualizar.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...getLocations().map((location) => ({
      url: absoluteUrl(`/${location.slug}`),
      lastModified: now,
      // La carta y los precios cambian seguido: los sirve nico y esta página se
      // revalida cada 60s.
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    // Las legales cambian casi nunca, pero tienen que ser rastreables: Google
    // las exige para publicar la pantalla de consentimiento del login.
    ...["/privacidad", "/terminos"].map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
