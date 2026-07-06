// Envío de correos vía Resend (REST, sin SDK). Si RESEND_API_KEY no está
// configurada, no se envía nada: en desarrollo el código OTP se devuelve al
// endpoint para poder probar el flujo sin infraestructura de correo.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "il Capo <onboarding@resend.dev>";

export function mailerConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.info(`[mailer] (sin RESEND_API_KEY) código OTP para ${to}: ${code}`);
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: `${code} es tu código de il Capo`,
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
          <h2 style="color:#CC0000;margin-bottom:8px">il Capo Pizzería</h2>
          <p>Tu código de acceso es:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>
          <p style="color:#666;font-size:13px">Vence en 10 minutos. Si no lo pediste, ignora este correo.</p>
        </div>`,
    }),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[mailer] Resend falló (${res.status}): ${body.slice(0, 200)}`);
    return false;
  }
  return true;
}
