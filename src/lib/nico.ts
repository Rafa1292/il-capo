import { resolveLocation, type Location } from "@/lib/locations";

const NICO_API_URL = process.env.NICO_API_URL!;

// Timeout de cada llamada a nico: si el backend se cuelga, fallamos rápido con un
// error claro en vez de dejar al cliente esperando indefinidamente.
const NICO_TIMEOUT_MS = 8_000;

/**
 * Sede con la que hablar. Cada una es un tenant distinto en nico y tiene su
 * propia clave, así que sin sede no hay a quién preguntarle.
 *
 * Se acepta el slug o la sede ya resuelta. Omitirlo solo sirve cuando hay una
 * sola configurada — con varias, no elegir sería servirle a un cliente la carta
 * y los precios de la sede equivocada.
 */
export type LocationRef = Location | string | null | undefined;

export class LocationRequiredError extends Error {
  constructor() {
    super("Falta indicar la sede");
  }
}

/**
 * Un rechazo de nico, con su código.
 *
 * Existe porque nico responde `{ success:false, error:{ message, code } }` —el
 * error es un OBJETO— y acá se hacía `new Error(body.error)`, que produce
 * literalmente "[object Object]". El motivo del rechazo se perdía siempre: ni
 * en los logs ni para decidir qué mostrarle al cliente. Con el código a mano se
 * puede distinguir "fuera de cobertura" de "pedidos pausados" de un fallo real.
 */
export class NicoApiError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
    readonly status: number
  ) {
    super(message);
    this.name = "NicoApiError";
  }
}

async function nicoError(res: Response, path: string): Promise<NicoApiError> {
  const body = await res.json().catch(() => null);
  const err = body?.error;
  // Tolera las dos formas: el envoltorio de nico ({error:{message,code}}) y un
  // error plano en texto, por si algún handler responde distinto.
  const message =
    (typeof err === "string" ? err : err?.message) ?? `Nico API error ${res.status} (${path})`;
  const code = typeof err === "object" && err !== null ? (err.code ?? null) : null;
  return new NicoApiError(message, code, res.status);
}

function keyOf(ref: LocationRef): string {
  const location = typeof ref === "object" && ref !== null ? ref : resolveLocation(ref);
  if (!location) throw new LocationRequiredError();
  return location.apiKey;
}

function nicoHeaders(ref: LocationRef) {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": keyOf(ref),
  };
}

function isTimeout(err: unknown): boolean {
  return err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
}

/**
 * `true` mientras Next prerenderiza las páginas ISR durante `next build`.
 *
 * Ahí nico puede no estar accesible (build local sin el server levantado, caída
 * de un minuto, key todavía sin configurar en el proveedor). Si dejamos que el
 * error se propague, el deploy entero de la web falla por un problema de otro
 * sistema que quizá ya se resolvió. En runtime NO se usa: ahí sí queremos que
 * el error se propague para que ISR siga sirviendo la última versión buena.
 */
export function isBuildPrerender(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

interface GetOptions {
  /**
   * Segundos de caché compartida entre visitantes. Sin esto la llamada es
   * `no-store`: una consulta a nico por cada visita.
   *
   * Solo para lo que se muestra (menú, pizza builder), donde ver la carta unos
   * segundos vieja no tiene consecuencia y el precio real se recalcula al
   * cobrar. NUNCA para tarificar (getCatalog) ni para el estado de un pedido:
   * ahí un dato viejo es plata mal cobrada o un estado equivocado.
   */
  revalidate?: number;
  location?: LocationRef;
}

export async function nicoGet<T>(path: string, opts?: GetOptions): Promise<T> {
  const caching =
    opts?.revalidate === undefined
      ? ({ cache: "no-store" } as const)
      : ({ next: { revalidate: opts.revalidate } } as const);

  let res: Response;
  try {
    res = await fetch(`${NICO_API_URL}${path}`, {
      headers: nicoHeaders(opts?.location),
      ...caching,
      signal: AbortSignal.timeout(NICO_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof LocationRequiredError) throw err;
    throw new Error(isTimeout(err) ? "Nico API timeout" : `Nico API no disponible (${path})`);
  }
  if (!res.ok) throw await nicoError(res, path);
  return res.json();
}

async function nicoWrite<T>(
  method: "POST" | "PUT",
  path: string,
  body: unknown,
  location?: LocationRef
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${NICO_API_URL}${path}`, {
      method,
      headers: nicoHeaders(location),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(NICO_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof LocationRequiredError) throw err;
    throw new Error(isTimeout(err) ? "Nico API timeout" : `Nico API no disponible (${path})`);
  }
  if (!res.ok) throw await nicoError(res, path);
  return res.json();
}

export async function nicoPut<T>(
  path: string,
  body: unknown,
  location?: LocationRef
): Promise<T> {
  return nicoWrite<T>("PUT", path, body, location);
}

export async function nicoPost<T>(
  path: string,
  body: unknown,
  location?: LocationRef
): Promise<T> {
  return nicoWrite<T>("POST", path, body, location);
}
