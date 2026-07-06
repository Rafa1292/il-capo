const NICO_API_URL = process.env.NICO_API_URL!;
const NICO_API_KEY = process.env.NICO_API_KEY!;

// Timeout de cada llamada a nico: si el backend se cuelga, fallamos rápido con un
// error claro en vez de dejar al cliente esperando indefinidamente.
const NICO_TIMEOUT_MS = 8_000;

function nicoHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": NICO_API_KEY,
  };
}

function isTimeout(err: unknown): boolean {
  return err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
}

export async function nicoGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${NICO_API_URL}${path}`, {
      headers: nicoHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(NICO_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(isTimeout(err) ? "Nico API timeout" : `Nico API no disponible (${path})`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Nico API error ${res.status}`);
  }
  return res.json();
}

export async function nicoPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${NICO_API_URL}${path}`, {
      method: "POST",
      headers: nicoHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(NICO_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(isTimeout(err) ? "Nico API timeout" : `Nico API no disponible (${path})`);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error ?? `Nico API error ${res.status}`);
  }
  return res.json();
}
