"use client";

import { useState } from "react";
import { DoorOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { OrderArrival } from "@/types";

/**
 * "Estoy aquí": con poco personal la puerta queda cerrada mientras cocinan.
 * El cliente que viene a recoger toca el botón al llegar y a la cocina le
 * suena la alerta; cuando salen, la página lo dice sola (polling del pedido).
 */
export function ArrivalButton({
  orderId,
  token,
  arrival,
  onArrived,
}: {
  orderId: string;
  token: string | null;
  arrival: OrderArrival;
  onArrived: () => void;
}) {
  const [sending, setSending] = useState(false);

  if (arrival.state === "ACKNOWLEDGED") {
    return (
      <div className="w-full max-w-sm rounded-xl border-2 border-green-500 bg-green-50 p-4 text-center">
        <p className="text-lg font-bold text-green-700">¡Ya salimos! 👋</p>
        <p className="text-sm text-muted-foreground">Te entregamos tu pedido en la puerta.</p>
      </div>
    );
  }

  if (arrival.state === "WAITING") {
    return (
      <div className="w-full max-w-sm rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-center">
        <p className="text-lg font-bold text-amber-700">Ya le avisamos a la cocina</p>
        <p className="text-sm text-muted-foreground">Salimos en un momento a entregarte tu pedido 🙌</p>
      </div>
    );
  }

  const announce = async () => {
    setSending(true);
    try {
      const q = token ? `?t=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/orders/${orderId}/arrived${q}`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("¡Listo! Ya le avisamos a la cocina");
      onArrived();
    } catch {
      toast.error("No pudimos avisar. Probá de nuevo o tocá la puerta 🙏");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-3 rounded-xl border-2 border-primary bg-primary/5 p-4 text-center">
      <p className="text-sm text-muted-foreground">
        Hoy estamos con poco personal y mantenemos la puerta cerrada mientras cocinamos. Cuando estés
        afuera, tocá el botón y salimos a entregarte tu pedido.
      </p>
      <Button size="lg" className="h-14 w-full text-lg" onClick={announce} disabled={sending}>
        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <DoorOpen className="h-5 w-5" />}
        Estoy aquí
      </Button>
    </div>
  );
}
