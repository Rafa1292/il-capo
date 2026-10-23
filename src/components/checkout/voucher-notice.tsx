"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";

/**
 * Aviso de vale a favor en el checkout. El descuento lo aplica el restaurante
 * al aceptar el pedido, y solo en efectivo: con tarjeta el total se cobra al
 * pedir, así que el vale queda para la próxima.
 */
export function VoucherNotice({
  paymentMethod,
  verifiedPhone,
  hasPromo = false,
}: {
  paymentMethod: "CARD" | "CASH";
  verifiedPhone: string | null;
  /** Con código de descuento el vale no se suma: queda para el próximo pedido. */
  hasPromo?: boolean;
}) {
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!verifiedPhone) return setAmount(null);
    fetch("/api/voucher")
      .then((r) => r.json())
      .then((j) => setAmount(j?.voucher?.amount ?? null))
      .catch(() => setAmount(null));
  }, [verifiedPhone]);

  if (!amount) return null;
  const formatted = `₡${amount.toLocaleString("es-CR")}`;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-green-600/30 bg-green-50 p-3 text-sm dark:bg-green-950/30">
      <Gift className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
      <p>
        {hasPromo ? (
          <>
            Tenés un vale de <strong>{formatted}</strong> a favor. Como estás usando un código de descuento, el vale
            queda para tu próximo pedido.
          </>
        ) : paymentMethod === "CASH" ? (
          <>
            Tenés un vale de <strong>{formatted}</strong> a favor: se descuenta del total al aceptar tu pedido.
          </>
        ) : (
          <>
            Tenés un vale de <strong>{formatted}</strong> a favor. Se aplica pagando en <strong>efectivo</strong>; con
            tarjeta queda para tu próximo pedido.
          </>
        )}
      </p>
    </div>
  );
}
