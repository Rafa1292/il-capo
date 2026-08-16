import { SCHEDULE, formatMinutes } from "@/lib/schedule";

/**
 * URL pública del sitio. Es la base de los canonical, el sitemap y las imágenes
 * de Open Graph, que tienen que ser absolutas: un `og:image` relativo no lo
 * resuelve ni WhatsApp ni Facebook y la vista previa sale sin imagen.
 *
 * `NEXT_PUBLIC_APP_URL` ya era obligatoria en producción para el retorno de
 * Tilopay, así que esto no agrega configuración nueva. El respaldo con la
 * variable de Vercel existe porque si esa se olvidara, el sitio publicaría
 * canonicals y sitemap apuntando a localhost — Google desindexaría el sitio
 * entero y nadie se daría cuenta hasta semanas después.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl().replace(/\/$/, "");

export const SITE_NAME = "il Capo Pizzería";

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * El horario en el formato que entiende schema.org. Sale del mismo `SCHEDULE`
 * que pinta el pie y el indicador "abierto ahora", así que no hay forma de que
 * lo que ve Google y lo que ve el cliente se contradigan.
 */
export function openingHoursSpecification() {
  return SCHEDULE.map((block) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: block.days.map((d) => SCHEMA_DAYS[d]),
    opens: pad(block.open),
    closes: pad(block.close),
  }));
}

/** schema.org quiere HH:MM con dos dígitos; `formatMinutes` da "9:00". */
function pad(minutes: number): string {
  const [h, m] = formatMinutes(minutes).split(":");
  return `${h.padStart(2, "0")}:${m}`;
}
