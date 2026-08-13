import "server-only";

/**
 * Sedes del negocio.
 *
 * Cada sede es un tenant distinto en nico —con su propia caja, inventario y
 * catálogo— así que tiene su propia clave de API. Acá se resuelve cuál usar.
 *
 * Configuración por `NICO_LOCATIONS`, un JSON:
 *
 *   [{"slug":"grecia","name":"Grecia","apiKey":"nco_..."},
 *    {"slug":"san-ramon","name":"San Ramón","apiKey":"nco_..."}]
 *
 * Si no está, se arma una sola sede con `NICO_API_KEY`. Con una sola sede la
 * web no pregunta nada y se comporta igual que antes de existir esto.
 */

export interface Location {
  /** Va en la URL: /grecia, /san-ramon. */
  slug: string;
  name: string;
  apiKey: string;
}

const FALLBACK_SLUG = process.env.NICO_DEFAULT_LOCATION_SLUG || "principal";
const FALLBACK_NAME = process.env.NICO_DEFAULT_LOCATION_NAME || "il Capo";

function parseLocations(): Location[] {
  const raw = process.env.NICO_LOCATIONS?.trim();

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Location[];
      const valid = parsed.filter((l) => l?.slug && l?.name && l?.apiKey);
      if (valid.length > 0) return valid;
      console.error("[locations] NICO_LOCATIONS no trae ninguna sede válida");
    } catch (err) {
      // No tumbamos la app por un JSON mal escrito: se cae a la sede única y
      // el pedido sigue entrando, que es lo que no puede fallar.
      console.error("[locations] NICO_LOCATIONS no es JSON válido:", err);
    }
  }

  const apiKey = process.env.NICO_API_KEY;
  if (!apiKey) return [];
  return [{ slug: FALLBACK_SLUG, name: FALLBACK_NAME, apiKey }];
}

let cached: Location[] | null = null;

export function getLocations(): Location[] {
  cached ??= parseLocations();
  return cached;
}

export function hasMultipleLocations(): boolean {
  return getLocations().length > 1;
}

export function findLocation(slug: string | undefined | null): Location | null {
  if (!slug) return null;
  return getLocations().find((l) => l.slug === slug) ?? null;
}

/** La sede por defecto: la única que hay, o null si hay varias y hay que elegir. */
export function defaultLocation(): Location | null {
  const all = getLocations();
  return all.length === 1 ? all[0] : null;
}

/**
 * Sede con la que atender una petición: la pedida, la recordada, o la única.
 * Devuelve null solo si hay varias y no se eligió ninguna.
 */
export function resolveLocation(preferred?: string | null): Location | null {
  return findLocation(preferred) ?? defaultLocation();
}

/** Lo que se puede mandar al navegador: nunca la clave. */
export function publicLocations(): { slug: string; name: string }[] {
  return getLocations().map(({ slug, name }) => ({ slug, name }));
}
