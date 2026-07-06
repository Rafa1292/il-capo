"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { getLastOrder, lastOrderUrl } from "@/lib/last-order";
import type { OrderStatus } from "@/types";

// Píldora fija sobre el bottom nav que recuerda al cliente que tiene un pedido
// en curso (PENDING o ACCEPTED reciente) y lo lleva de vuelta a su estado.
// Sin esto, al volver al menú después de pedir no hay ningún rastro del pedido.

const MAX_PENDING_AGE_MS = 24 * 60 * 60 * 1000; // 24h: si el negocio nunca respondió, dejar de mostrar
const MAX_ACCEPTED_AGE_MS = 2 * 60 * 60 * 1000; // 2h: un pedido aceptado ya se entregó hace rato
const POLL_MS = 60_000;

interface ActiveOrder {
  url: string;
  status: OrderStatus["status"];
}

export function ActiveOrderBanner() {
  const pathname = usePathname();
  const [active, setActive] = useState<ActiveOrder | null>(null);

  const check = useCallback(async () => {
    const last = getLastOrder();
    if (!last || Date.now() - last.createdAt > MAX_PENDING_AGE_MS) {
      setActive(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/orders/${last.id}?t=${encodeURIComponent(last.accessToken)}`
      );
      if (!res.ok) {
        setActive(null);
        return;
      }
      const json = await res.json();
      const status = json.data?.status as OrderStatus["status"] | undefined;
      const age = Date.now() - last.createdAt;
      if (status === "PENDING" || (status === "ACCEPTED" && age < MAX_ACCEPTED_AGE_MS)) {
        setActive({ url: lastOrderUrl(last), status });
      } else {
        setActive(null);
      }
    } catch {
      // Error de red: no tocar el estado actual; el próximo poll lo corrige.
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_MS);
    return () => clearInterval(interval);
  }, [check, pathname]);

  // En el checkout y en la propia página del pedido no aporta (y estorba).
  if (!active || pathname.startsWith("/pedido") || pathname.startsWith("/checkout")) {
    return null;
  }

  const pending = active.status === "PENDING";

  return (
    <div className="fixed bottom-20 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <Link
        href={active.url}
        className="pointer-events-auto flex items-center gap-2 rounded-full border bg-background/95 backdrop-blur px-4 py-2 shadow-lg text-sm font-medium transition-transform hover:scale-[1.02] active:scale-95"
      >
        {pending ? (
          <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
        <span>{pending ? "Pedido en curso" : "¡Pedido aceptado!"}</span>
        <span className="text-muted-foreground text-xs">ver estado</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
