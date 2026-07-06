import { createHmac, timingSafeEqual } from "crypto";

// Token de acceso a un pedido: capability URL firmada (HMAC) para que solo quien
// creó el pedido (y tiene el link) pueda ver sus datos. Cierra el IDOR/PII de
// GET /api/orders/[id]. Formato: "<exp>.<firma>" — expira para que un link
// filtrado (historial, logs) no dé acceso eterno a los datos del cliente.

const SECRET = process.env.ORDER_TOKEN_SECRET || process.env.NICO_WEBHOOK_SECRET || "";

/** Vigencia del token: de sobra para seguir un pedido, corta para un link filtrado. */
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function sign(id: string, exp: number): string {
  return createHmac("sha256", SECRET).update(`${id}.${exp}`).digest("base64url");
}

export function signOrderId(id: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(id, exp)}`;
}

/** Verifica firma y expiración en tiempo constante. */
export function verifyOrderToken(id: string, token: string | null | undefined): boolean {
  if (!token || !SECRET) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = Buffer.from(sign(id, exp));
  const given = Buffer.from(token.slice(dot + 1));
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/** Igualdad de strings en tiempo constante (para secretos de webhook, etc.). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
