import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

// Sesión de usuario: payload JSON firmado con HMAC en una cookie httpOnly.
// Sin base de datos: la identidad (email verificado vía Google u OTP) viaja en la
// cookie; los datos extra del perfil (teléfono, direcciones) viven en el
// dispositivo (store local) y la complementan.

const SECRET =
  process.env.AUTH_SECRET ||
  process.env.ORDER_TOKEN_SECRET ||
  process.env.NICO_WEBHOOK_SECRET ||
  "";

export const SESSION_COOKIE = "ilcapo_session";
export const GOOGLE_STATE_COOKIE = "ilcapo_oauth_state";
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 días

export interface Session {
  email: string;
  name?: string;
  picture?: string;
  provider: "google" | "email";
  exp: number;
}

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function fromB64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}
function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeSession(s: Omit<Session, "exp">): string {
  const payload = b64url(JSON.stringify({ ...s, exp: Date.now() + SESSION_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | null | undefined): Session | null {
  if (!token || !SECRET) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(token.slice(dot + 1));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const session = JSON.parse(fromB64url(payload)) as Session;
    if (!session.email || !session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): Session | null {
  return decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
}

/** Setea la cookie de sesión en la respuesta. */
export function setSessionCookie(res: NextResponse, s: Omit<Session, "exp">): void {
  res.cookies.set(SESSION_COOKIE, encodeSession(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
