import { WHATSAPP_NUMBER } from "@/lib/contact";

/**
 * Datos físicos de cada local: dirección, coordenadas y teléfono.
 *
 * Van acá y no en `NICO_LOCATIONS` a propósito. Esa variable lleva las claves de
 * API, así que es secreta y vive en el proveedor; esto en cambio es información
 * pública que tiene que salir en el HTML (datos estructurados, mapa, "cómo
 * llegar") y no cambia nunca. Separarlas evita tener que tocar un secreto para
 * corregir una coma en una dirección.
 *
 * Se indexa por el `slug` de la sede. Una sede sin entrada acá sigue
 * funcionando: simplemente no publica datos estructurados de local.
 */

export interface LocationInfo {
  /** Dirección tal como la diría alguien del pueblo. */
  streetAddress: string;
  /** Cantón. Es el término por el que la gente busca ("pizza en Grecia"). */
  locality: string;
  region: string;
  latitude: number;
  longitude: number;
  /** Formato internacional. `null` cuando el local solo atiende por WhatsApp. */
  phone: string | null;
}

const INFO: Record<string, LocationInfo> = {
  grecia: {
    streetAddress: "25 metros sur del Templo Católico Las Mercedes",
    locality: "Grecia",
    region: "Alajuela",
    latitude: 10.0722274,
    longitude: -84.3110346,
    phone: "+50624443001",
  },
  "san-ramon": {
    streetAddress: "Diagonal a la sucursal de la CCSS, frente al Bar El Establo",
    locality: "San Ramón",
    region: "Alajuela",
    latitude: 10.0829742,
    longitude: -84.4724061,
    phone: null,
  },
};

export function locationInfo(slug: string): LocationInfo | null {
  return INFO[slug] ?? null;
}

/** Teléfono para mostrar/publicar: el fijo del local, o el WhatsApp del negocio. */
export function contactPhone(info: LocationInfo | null): string {
  return info?.phone ?? `+${WHATSAPP_NUMBER}`;
}

export const CUISINE = ["Pizza", "Italiana"];
export const PRICE_RANGE = "₡₡";
