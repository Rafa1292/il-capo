import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Recuerda que ESTE dispositivo comprobó ESTE número.
 *
 * Sin esto habría que pedir el código en cada pedido en efectivo. El valor va
 * firmado: la cookie vive en el navegador del cliente y sin firma cualquiera la
 * editaría poniendo el número de otro para heredar su permiso.
 *
 * No reemplaza el permiso, que vive en nico: acá solo se recuerda para no
 * volver a preguntar. nico igual comprueba en cada pedido.
 */

const COOKIE = "il-capo-phone";
const SECRET = process.env.AUTH_SECRET || process.env.ORDER_TOKEN_SECRET || "";
const TTL_MS = 180 * 24 * 60 * 60 * 1000; // 6 meses

const digits = (s: string) => (s ?? "").replace(/\D/g, "");

function sign(phone: string, exp: number): string {
  return createHmac("sha256", SECRET).update(`${phone}.${exp}`).digest("base64url");
}

export function buildCookieValue(phone: string): string {
  const normalized = digits(phone);
  const exp = Date.now() + TTL_MS;
  return `${normalized}.${exp}.${sign(normalized, exp)}`;
}

/** Número comprobado en este dispositivo, o null. */
export function readVerifiedPhone(raw: string | undefined): string | null {
  if (!raw || !SECRET) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  const [phone, expRaw, signature] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;

  const expected = Buffer.from(sign(phone, exp));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return null;
  if (!timingSafeEqual(expected, given)) return null;

  return phone;
}

export const VERIFIED_PHONE_COOKIE = COOKIE;
export const VERIFIED_PHONE_MAX_AGE = Math.floor(TTL_MS / 1000);

/** `true` si este dispositivo ya comprobó ese número. */
export async function isPhoneVerifiedHere(phone: string): Promise<boolean> {
  const jar = await cookies();
  const verified = readVerifiedPhone(jar.get(COOKIE)?.value);
  return !!verified && verified === digits(phone);
}
