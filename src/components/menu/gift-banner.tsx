"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { giftAvailableToday } from "@/lib/gift";

/**
 * Aviso del regalo en la carta. Se decide en el navegador y no en el servidor:
 * la carta se cachea, y una versión armada el jueves a la noche se seguiría
 * mostrando el viernes.
 */
export function GiftBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(giftAvailableToday());
  }, []);

  if (!show) return null;

  return (
    <div className="mb-5 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <Gift className="h-5 w-5 shrink-0 text-primary" />
      <p className="text-sm">
        <span className="font-semibold">Lunes a jueves: pan de ajo gratis</span> en tu pedido por
        la web. Reclamalo desde el carrito.
      </p>
    </div>
  );
}
