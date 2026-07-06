import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, GOOGLE_STATE_COOKIE } from "@/lib/session";
import { safeEqual } from "@/lib/order-token";

// Callback de Google: valida el state, intercambia el code por un id_token
// (directo contra el endpoint de Google por TLS, por eso el payload es confiable
// sin verificar la firma JWKS) y abre sesión con el email verificado.

function fail(req: NextRequest, reason: string): NextResponse {
  console.error(`[auth/google] ${reason}`);
  const res = NextResponse.redirect(new URL("/cuenta?error=google", req.nextUrl.origin));
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(req, "no configurado");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  if (!code) return fail(req, "sin code");
  if (!state || !cookieState || !safeEqual(state, cookieState)) {
    return fail(req, "state inválido (posible CSRF)");
  }

  try {
    const origin = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, "");
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      return fail(req, `token exchange falló (${tokenRes.status}): ${body.slice(0, 200)}`);
    }

    const { id_token } = (await tokenRes.json()) as { id_token?: string };
    if (!id_token) return fail(req, "sin id_token");

    const payload = JSON.parse(
      Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")
    ) as { email?: string; email_verified?: boolean; name?: string; picture?: string };

    if (!payload.email || payload.email_verified === false) {
      return fail(req, "email no verificado");
    }

    const res = NextResponse.redirect(new URL("/cuenta?login=ok", req.nextUrl.origin));
    setSessionCookie(res, {
      email: payload.email.toLowerCase(),
      name: payload.name,
      picture: payload.picture,
      provider: "google",
    });
    res.cookies.set(GOOGLE_STATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return fail(req, err instanceof Error ? err.message : "error desconocido");
  }
}
