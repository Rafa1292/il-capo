import { createHmac, timingSafeEqual, randomInt } from "crypto";

// Desafío OTP sin base de datos: el hash HMAC del código viaja en una cookie
// httpOnly firmada. El cliente nunca ve el código hasheado y no puede falsificar
// el desafío sin el secreto. La fuerza bruta se frena con rate limit por IP.

const SECRET =
  process.env.AUTH_SECRET ||
  process.env.ORDER_TOKEN_SECRET ||
  process.env.NICO_WEBHOOK_SECRET ||
  "";

export const OTP_COOKIE = "ilcapo_otp";
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutos

interface Challenge {
  email: string;
  codeHash: string;
  exp: number;
}

function hmac(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function newOtpCode(): string {
  return String(randomInt(100000, 1000000)); // 6 dígitos
}

export function encodeChallenge(email: string, code: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase(),
      codeHash: hmac(`otp:${email.toLowerCase()}:${code}`),
      exp: Date.now() + OTP_TTL_MS,
    } satisfies Challenge),
    "utf8"
  ).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

/** Devuelve el email verificado si el código coincide con el desafío; null si no. */
export function verifyChallenge(
  token: string | null | undefined,
  email: string,
  code: string
): string | null {
  if (!token || !SECRET || !email || !code) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const expectedSig = Buffer.from(hmac(payload));
  const givenSig = Buffer.from(token.slice(dot + 1));
  if (expectedSig.length !== givenSig.length || !timingSafeEqual(expectedSig, givenSig)) {
    return null;
  }
  let ch: Challenge;
  try {
    ch = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!ch.email || !ch.codeHash || ch.exp < Date.now()) return null;
  if (ch.email !== email.trim().toLowerCase()) return null;
  const expected = Buffer.from(ch.codeHash);
  const given = Buffer.from(hmac(`otp:${ch.email}:${code.trim()}`));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return ch.email;
}
