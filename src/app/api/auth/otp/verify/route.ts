import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge, OTP_COOKIE } from "@/lib/otp";
import { setSessionCookie } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Verifica el código OTP y abre sesión. La fuerza bruta (6 dígitos = 1M
// combinaciones) se frena con rate limit por IP + expiración de 10 min.
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`otp-verify:${clientIp(req)}`, 10, 10 * 60_000).ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Pedí un código nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const { email, code } = (await req.json()) as { email?: string; code?: string };
    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Correo y código son requeridos" }, { status: 400 });
    }

    const challenge = req.cookies.get(OTP_COOKIE)?.value;
    const verifiedEmail = verifyChallenge(challenge, email, code);
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: "Código incorrecto o vencido. Pedí uno nuevo." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      session: { email: verifiedEmail, provider: "email" },
    });
    setSessionCookie(res, { email: verifiedEmail, provider: "email" });
    res.cookies.set(OTP_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("[auth/otp/verify]", err);
    return NextResponse.json({ error: "No se pudo verificar el código" }, { status: 500 });
  }
}
