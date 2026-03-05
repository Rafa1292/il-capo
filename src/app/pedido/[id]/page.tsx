"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Bike, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { OrderStatus } from "@/types";

function StatusDisplay({ order }: { order: OrderStatus }) {
  if (order.status === "PENDING") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <Clock className="h-20 w-20 text-amber-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold">Esperando confirmación</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Tu pedido está siendo revisado. Te avisaremos en cuanto sea aceptado.
        </p>
        <p className="text-xs text-muted-foreground animate-pulse">Actualizando automáticamente...</p>
      </div>
    );
  }

  if (order.status === "ACCEPTED") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h2 className="text-xl font-bold text-green-700">¡Pedido aceptado!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          {order.deliveryMethod === "DELIVERY"
            ? "Tu pizza está en camino. Prepárate para recibirla."
            : "Tu pizza estará lista pronto para que la recojas."}
        </p>
        <div className="flex items-center gap-2 text-sm font-medium mt-2">
          {order.deliveryMethod === "DELIVERY" ? (
            <Bike className="h-4 w-4 text-primary" />
          ) : (
            <UtensilsCrossed className="h-4 w-4 text-primary" />
          )}
          <span>{order.deliveryMethod === "DELIVERY" ? "Entrega a domicilio" : "Para recoger"}</span>
        </div>
      </div>
    );
  }

  if (order.status === "REJECTED" || order.status === "CANCELLED") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-20 w-20 text-destructive" />
        <h2 className="text-xl font-bold text-destructive">Pedido no procesado</h2>
        {order.rejectedReason && (
          <p className="text-muted-foreground text-sm max-w-xs">
            {order.rejectedReason}
          </p>
        )}
        <Link href="/menu">
          <Button className="mt-2 bg-primary hover:bg-primary/90">
            Intentar nuevamente
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) { setError(true); return; }
      const json = await res.json();
      setOrder(json.data);
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => {
    fetchStatus();
    // Poll every 5s while PENDING
    const interval = setInterval(() => {
      if (order?.status === "PENDING" || order === null) {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, order?.status, order]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <XCircle className="h-16 w-16 text-destructive" />
        <p className="font-semibold">No se pudo cargar el estado del pedido</p>
        <Button variant="outline" onClick={fetchStatus}>Reintentar</Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Clock className="h-16 w-16 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Cargando estado...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      <StatusDisplay order={order} />

      <div className="border rounded-xl p-4 w-full max-w-sm space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cliente</span>
          <span className="font-medium">{order.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total estimado</span>
          <span className="font-medium">₡{order.estimatedTotal.toLocaleString("es-CR")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">N.° de pedido</span>
          <span className="font-mono text-xs">{order.id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {order.status !== "PENDING" && (
        <Link href="/">
          <Button variant="outline">Volver al inicio</Button>
        </Link>
      )}
    </div>
  );
}
