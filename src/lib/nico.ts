const NICO_API_URL = process.env.NICO_API_URL!;
const NICO_API_KEY = process.env.NICO_API_KEY!;

function nicoHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": NICO_API_KEY,
  };
}

export async function nicoGet<T>(path: string): Promise<T> {
  const res = await fetch(`${NICO_API_URL}${path}`, {
    headers: nicoHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Nico API error ${res.status}`);
  }
  return res.json();
}

export async function nicoPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${NICO_API_URL}${path}`, {
    method: "POST",
    headers: nicoHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error ?? `Nico API error ${res.status}`);
  }
  return res.json();
}
