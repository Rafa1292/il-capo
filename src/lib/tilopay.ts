// Módulo server-only: usa credenciales secretas de Tilopay.
// Solo debe importarse desde route handlers / código de servidor, nunca desde componentes cliente.

// ── Config ──────────────────────────────────────────────────────────────────
const API_URL = (process.env.TILOPAY_API_URL ?? "https://app.tilopay.com").replace(/\/$/, "");
const API_USER = process.env.TILOPAY_API_USER;
const API_PASSWORD = process.env.TILOPAY_API_PASSWORD;
const API_KEY = process.env.TILOPAY_API_KEY;
export const TILOPAY_CURRENCY = process.env.TILOPAY_CURRENCY ?? "CRC";

function assertConfigured() {
  if (!API_USER || !API_PASSWORD || !API_KEY) {
    throw new Error(
      "Tilopay no está configurado. Define TILOPAY_API_USER, TILOPAY_API_PASSWORD y TILOPAY_API_KEY en .env.local"
    );
  }
}

// Timeout por llamada: si Tilopay se cuelga, fallamos rápido en vez de dejar al
// cliente colgado en "Verificando tu pago...".
const TILOPAY_TIMEOUT_MS = 10_000;

function fetchTilopay(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(TILOPAY_TIMEOUT_MS),
  }).catch((err: unknown) => {
    const timeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new Error(timeout ? "Tilopay no respondió a tiempo" : "Tilopay no disponible");
  });
}

// ── Token (login) ─────────────────────────────────────────────────────────────
// El token dura 86400s; lo cacheamos en memoria del proceso con un margen.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  assertConfigured();
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const res = await fetchTilopay("/api/v1/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiuser: API_USER, password: API_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Tilopay login falló (${res.status})`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error("Tilopay login no devolvió access_token");
  }

  const ttlMs = (json.expires_in ?? 86400) * 1000;
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + ttlMs - 60_000, // 60s de margen
  };
  return json.access_token;
}

// POST autenticado con reintento: si Tilopay invalida el token antes del TTL
// (rotación, reinicio de su lado), un 401 con token cacheado invalidaría TODOS
// los pagos hasta por 24h. Ante 401: descartamos el caché, re-login y un reintento.
async function tilopayPost(path: string, body: Record<string, unknown>): Promise<Response> {
  const doPost = async () => {
    const token = await getToken();
    return fetchTilopay(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  const res = await doPost();
  if (res.status !== 401) return res;
  cachedToken = null;
  return doPost();
}

// ── Tipos ───────────────────────────────────────────────────────────────────
export interface TilopayCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Dirección de facturación. Para pedidos de comida usamos valores por defecto de CR. */
  address?: string;
  city?: string;
  /** Estado en formato ISO, ej. "CR-SJ". */
  state?: string;
  zip?: string;
  /** País ISO Alpha-2, ej. "CR". */
  country?: string;
}

export interface CreatePaymentInput {
  orderNumber: string;
  /** Monto en la unidad de la moneda (ej. colones). Se formatea a 2 decimales. */
  amount: number;
  currency?: string;
  redirect: string;
  customer: TilopayCustomer;
  /** Datos propios devueltos tal cual en el retorno (se codifican en base64). */
  returnData?: string;
  /**
   * "0" = solo autoriza (retiene fondos, se captura después); "1" = captura y autoriza.
   * Por defecto "0": capturamos al aceptar el pedido y reversamos si se rechaza.
   */
  capture?: "0" | "1";
}

/** Operaciones de processModification: 1 = captura, 2 = reembolso, 3 = reverso. */
export type ModificationType = "1" | "2" | "3";

export interface TilopayTransaction {
  orderNumber: string;
  amount: string;
  currency: string;
  /** "1" = aprobada. */
  code: string;
  response: string;
  auth: string;
  card?: string;
  last?: string;
  environment?: string;
  date?: string;
  id_tilopay?: number;
  /** Estado de liquidación: "Authorize" (solo autorizada) | "Capture" (ya cobrada). */
  capture?: string;
}

// ── processPayment → url del formulario de pago ───────────────────────────────
export async function createPayment(input: CreatePaymentInput): Promise<{ url: string }> {
  const c = input.customer;

  const body = {
    redirect: input.redirect,
    key: API_KEY,
    amount: input.amount.toFixed(2),
    currency: input.currency ?? TILOPAY_CURRENCY,
    orderNumber: input.orderNumber,
    capture: input.capture ?? "0",
    billToFirstName: c.firstName,
    billToLastName: c.lastName,
    billToAddress: c.address ?? "San Jose",
    billToAddress2: c.address ?? "San Jose",
    billToCity: c.city ?? "San Jose",
    billToState: c.state ?? "CR-SJ",
    billToZipPostCode: c.zip ?? "10101",
    billToCountry: c.country ?? "CR",
    billToTelephone: c.phone,
    billToEmail: c.email,
    subscription: "0",
    platform: "il-capo",
    returnData: input.returnData
      ? Buffer.from(input.returnData, "utf8").toString("base64")
      : undefined,
    hashVersion: "V2",
    token_version: "v2",
  };

  const res = await tilopayPost("/api/v1/processPayment", body);

  const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.message ?? `Tilopay processPayment falló (${res.status})`);
  }
  return { url: json.url };
}

// ── consult → estado autoritativo de la transacción ──────────────────────────
// No confiamos en el `code` de la URL de retorno (es falsificable): re-verificamos.
export async function consultPayment(orderNumber: string): Promise<TilopayTransaction | null> {
  const res = await tilopayPost("/api/v1/consult", { key: API_KEY, orderNumber, merchantId: "" });

  if (!res.ok) {
    throw new Error(`Tilopay consult falló (${res.status})`);
  }
  const json = (await res.json()) as { response?: TilopayTransaction[] };
  const list = json.response ?? [];
  if (list.length === 0) return null;

  // Preferimos una transacción aprobada si existe; si no, la más reciente.
  return list.find((t) => t.code === "1") ?? list[list.length - 1];
}

// ── processModification → captura / reembolso / reverso ──────────────────────
export interface ModifyResult {
  ok: boolean;
  message?: string;
  raw: unknown;
}

export async function modifyPayment(input: {
  orderNumber: string;
  type: ModificationType;
  amount: number;
}): Promise<ModifyResult> {
  const res = await tilopayPost("/api/v1/processModification", {
    orderNumber: input.orderNumber,
    type: input.type,
    amount: input.amount.toFixed(2),
    key: API_KEY,
  });

  const json = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
  // Tilopay usa códigos tipo "100"/"200" para éxito y "4xx"/"5xx" para error.
  const typeStr = String(json.type ?? "");
  const ok = res.ok && !typeStr.startsWith("4") && !typeStr.startsWith("5");

  return { ok, message: json.message, raw: json };
}
