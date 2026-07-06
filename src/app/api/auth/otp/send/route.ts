import { NextRequest, NextResponse } from "next/server";
import { newOtpCode, encodeChallenge, OTP_COOKIE, OTP_TTL_MS } from "@/lib/otp";
import { sendOtpEmail, mailerConfigured } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Envía un código de 6 dígitos al correo. El desafío (hash del código) viaja en
// una cookie httpOnly firmada; no hay estado en el servidor.
export async function POST(req: NextRequest) {
  try {
    // Anti-abuso: por IP y por correo (evita bombardear un buzón ajeno).
    const ip = clientIp(req);
    if (!rateLimit(`otp-send-ip:${ip}`, 5, 10 * 60_000).ok) {
      return NextResponse.json(
        { error: "Demasiados códigos pedidos. Probá en unos minutos." },
        { status: 429 }
      );
    }

    const { email } = (await req.json()) as { email?: string };
    const normalized = email?.trim().toLowerCase() ?? "";
    if (!EMAIL_RE.test(normalized)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }
    if (!rateLimit(`otp-send-email:${normalized}`, 3, 10 * 60_000).ok) {
      return NextResponse.json(
        { error: "Ya te enviamos varios códigos. Revisá tu correo (y spam)." },
        { status: 429 }
      );
    }

    const code = newOtpCode();
    const sent = await sendOtpEmail(normalized, code);

    const res = NextResponse.json({
      ok: true,
      sent,
      // Solo en desarrollo y sin mailer configurado: el código se devuelve para
      // poder probar el flujo. En producción JAMÁS viaja en la respuesta.
      ...(process.env.NODE_ENV === "development" && !mailerConfigured()
        ? { devCode: code }
        : {}),
    });
    res.cookies.set(OTP_COOKIE, encodeChallenge(normalized, code), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: OTP_TTL_MS / 1000,
    });
    return res;
  } catch (err) {
    console.error("[auth/otp/send]", err);
    return NextResponse.json({ error: "No se pudo enviar el código" }, { status: 500 });
  }
}
