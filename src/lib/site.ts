import { formatMinutes, scheduleBlocks, type Schedule } from "@/lib/schedule";

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
 * El horario en el formato que entiende schema.org. Recibe el mismo horario que
 * pinta el pie y el indicador "abierto ahora" —el que publica el local en
 * nico—, así que lo que ve Google y lo que ve el cliente no pueden divergir.
 *
 * Los días cerrados no se declaran: en schema.org lo que no se declara está
 * cerrado, y publicar un tramo sin horas confunde al validador.
 */
export function openingHoursSpecification(schedule: Schedule) {
  return scheduleBlocks(schedule)
    .filter((block) => block.open !== null && block.close !== null)
    .map((block) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: block.days.map((d) => SCHEMA_DAYS[d]),
      // schema.org quiere HH:MM con dos dígitos, que es lo que da formatMinutes.
      opens: formatMinutes(block.open!),
      closes: formatMinutes(block.close!),
    }));
}
