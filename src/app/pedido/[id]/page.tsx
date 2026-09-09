"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Bike,
  UtensilsCrossed,
  PackageCheck,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { OrderStatus } from "@/types";

/**
 * Pedido ya aceptado por el restaurante. Lo que ve el cliente a partir de acá
 * lo manda `kitchenStatus` (avance real en cocina): `status` se queda en
 * ACCEPTED para siempre, así que antes la pantalla decía "estará lista pronto"
 * incluso con el pedido ya entregado.
 */
function AcceptedDisplay({ order }: { order: OrderStatus }) {
  const isDelivery = order.deliveryMethod === "DELIVERY";
  const method = (
    <div className="flex items-center gap-2 text-sm font-medium mt-2">
      {isDelivery ? (
        <Bike className="h-4 w-4 text-primary" />
      ) : (
        <UtensilsCrossed className="h-4 w-4 text-primary" />
      )}
      <span>{isDelivery ? "Entrega a domicilio" : "Para recoger"}</span>
    </div>
  );

  if (order.kitchenStatus === "DELIVERED") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <PartyPopper className="h-20 w-20 text-primary" />
        <h2 className="text-xl font-bold">Pedido entregado</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          ¡Buen provecho! Gracias por pedir con nosotros.
        </p>
      </div>
    );
  }

  if (order.kitchenStatus === "READY") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <PackageCheck className="h-20 w-20 text-green-500" />
        <h2 className="text-xl font-bold text-green-700">¡Tu pedido está listo!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          {isDelivery
            ? "Ya salió de cocina y va camino a tu dirección."
            : "Podés pasar a recogerlo cuando querás."}
        </p>
        {method}
      </div>
    );
  }

  // PENDING, IN_PREPARATION o todavía sin dato: el pedido está en cocina.
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CheckCircle2 className="h-20 w-20 text-green-500" />
      <h2 className="text-xl font-bold text-green-700">¡Pedido aceptado!</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        {order.kitchenStatus === "IN_PREPARATION"
          ? "Ya lo están preparando. Te avisamos apenas esté listo."
          : "Lo estamos preparando. Te avisamos apenas esté listo."}
      </p>
      {method}
      <p className="text-xs text-muted-foreground animate-pulse">
        Actualizando automáticamente...
      </p>
    </div>
  );
}

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

  if (order.status === "ACCEPTED" && order.kitchenStatus !== "CANCELLED") {
    return <AcceptedDisplay order={order} />;
  }

  if (
    order.status === "REJECTED" ||
    order.status === "CANCELLED" ||
    order.kitchenStatus === "CANCELLED"
  ) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-20 w-20 text-destructive" />
        <h2 className="text-xl font-bold text-destructive">Pedido no procesado</h2>
        {order.rejectedReason ? (
          <p className="text-muted-foreground text-sm max-w-xs">
            {order.rejectedReason}
          </p>
        ) : order.kitchenStatus === "CANCELLED" ? (
          <p className="text-muted-foreground text-sm max-w-xs">
            El pedido se anuló en el restaurante. Si ya pagaste, comunicate con
            nosotros para resolverlo.
          </p>
        ) : null}
        <Link href="/">
          <Button className="mt-2 bg-primary hover:bg-primary/90">
            Intentar nuevamente
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}

function OrderStatusContent() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState(false);
  // Token de acceso al pedido (viene en la URL: /pedido/[id]?t=...).
  // Usamos useSearchParams (reactivo) en vez de window.location.search: tras un
  // router.replace (soft-nav), window.location puede no reflejar aún el query
  // string en el primer render y el token saldría null → fetch sin ?t= → 403.
  const searchParams = useSearchParams();
  const token = searchParams.get("t");

  const fetchStatus = useCallback(async () => {
    try {
      const q = token ? `?t=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/orders/${id}${q}`);
      if (!res.ok) { setError(true); return; }
      const json = await res.json();
      setOrder(json.data);
      // Un error transitorio (red móvil, nico reiniciando) no debe dejar la
      // pantalla clavada en error: al primer fetch exitoso nos recuperamos.
      setError(false);
    } catch {
      setError(true);
    }
  }, [id, token]);

  const orderStatus = order?.status ?? null;

  // El pedido ya no se va a mover: entregado, anulado o rechazado. Antes se
  // dejaba de consultar apenas salía de PENDING, así que el cliente se quedaba
  // en "pedido aceptado" para siempre aunque cocina ya lo hubiera despachado.
  const isFinal =
    order !== null &&
    (order.status === "REJECTED" ||
      order.status === "CANCELLED" ||
      order.kitchenStatus === "DELIVERED" ||
      order.kitchenStatus === "CANCELLED");

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (isFinal) return;
    // Esperando confirmación se consulta rápido (el cliente está mirando la
    // pantalla); ya aceptado, cocina no cambia cada 5 s y el polling de todos
    // los clientes de la sede pasa por la misma API key de nico.
    const everyMs = !orderStatus || orderStatus === "PENDING" ? 5000 : 15000;
    const interval = setInterval(fetchStatus, everyMs);
    return () => clearInterval(interval);
  }, [fetchStatus, isFinal, orderStatus]);

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

export default function OrderStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Clock className="h-16 w-16 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Cargando estado...</p>
        </div>
      }
    >
      <OrderStatusContent />
    </Suspense>
  );
}
