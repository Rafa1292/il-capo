import { NextRequest, NextResponse } from "next/server";
import { nicoPost } from "@/lib/nico";
import { requireLocation } from "@/lib/api-location";
import { readVerifiedPhone, VERIFIED_PHONE_COOKIE } from "@/lib/cash-verification";

/**
 * GET /api/voucher — si el cliente de este aparato (WhatsApp ya comprobado)
 * tiene un vale a favor, para avisarle en el checkout. Sin número comprobado
 * no se pregunta: no hay forma de saber que el número es suyo.
 */
export async function GET(req: NextRequest) {
  try {
    const phone = readVerifiedPhone(req.cookies.get(VERIFIED_PHONE_COOKIE)?.value);
    if (!phone) return NextResponse.json({ voucher: null });
    const { location, response } = await requireLocation();
    if (response) return NextResponse.json({ voucher: null });
    const res = await nicoPost<{ data: { voucher: { amount: number; expiresAt: string | null } | null } }>(
      "/api/public/customers/voucher",
      { phone },
      location
    );
    return NextResponse.json({ voucher: res.data.voucher });
  } catch (err) {
    // Es un aviso: si falla, el vale igual se aplica al aceptar el pedido.
    console.error("[api/voucher]", err);
    return NextResponse.json({ voucher: null });
  }
}
