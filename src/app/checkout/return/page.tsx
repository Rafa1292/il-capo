"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { saveLastOrder, getLastOrder, lastOrderUrl } from "@/lib/last-order";

// Fases:
//  - verifying/creating: en curso.
//  - declined: el pago NO se aprobó → es seguro volver al checkout y pagar.
//  - retryable: el pago SÍ se aprobó pero el registro falló → NUNCA ofrecer
//    volver a pagar (doble cobro); solo reintentar el registro (idempotente:
//    mismo orderNumber, nico dedupea y el server re-verifica el pago).
//  - fatal: no hay referencia de pago o no hay carrito que registrar.
type Phase = "verifying" | "creating" | "declined" | "retryable" | "fatal";

interface PaymentInfo {
  orderNumber: string;
  auth: string;
  amount: number;
  currency: string;
  tilopayId?: number;
}

function ReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderNumber = params.get("order");

  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState<string>("");
  const [authRef, setAuthRef] = useState<string>("");
  const payment = useRef<PaymentInfo | null>(null);
  const ran = useRef(false);
  const busy = useRef(false);

  // Paso 2: crear el pedido en nico. Reintentable: mismo orderNumber → el server
  // re-verifica el pago contra Tilopay y nico dedupea si ya existía.
  const createOrder = useCallback(
    async (pay: PaymentInfo) => {
      setPhase("creating");
      const s = useCartStore.getState();

      if (s.items.length === 0) {
        // Carrito vacío: casi seguro el pedido ya se creó y esto es un refresh.
        // Si tenemos el último pedido guardado, llevamos al cliente a su estado.
        const last = getLastOrder();
        if (last) {
          router.replace(lastOrderUrl(last));
          return;
        }
        setPhase("fatal");
        setMessage(
          "No encontramos tu carrito en este dispositivo. Si ya pagaste, contáctanos con tu número de autorización."
        );
        return;
      }

      // El servidor recalcula precios, verifica el pago contra Tilopay y exige que
      // el monto pagado coincida con el total. No mandamos precios ni el pago.
      const payload = {
        orderNumber: pay.orderNumber,
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        deliveryMethod: s.deliveryMethod,
        deliveryAddress: s.deliveryMethod === "DELIVERY" ? s.deliveryAddress : undefined,
        notes: s.notes || undefined,
        items: s.items.map((item) => ({
          saleItemId: item.saleItemId,
          description: item.description,
          quantity: item.quantity,
          modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
          pizzaBuilder: item.pizzaBuilder,
        })),
      };

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.data?.id) {
          setPhase("retryable");
          setMessage(json.error ?? "No se pudo registrar el pedido.");
          return;
        }
        const token = json.data.accessToken as string | undefined;
        if (token) saveLastOrder(json.data.id, token);
        s.clearCart();
        const q = token ? `?t=${encodeURIComponent(token)}` : "";
        router.replace(`/pedido/${json.data.id}${q}`);
      } catch {
        setPhase("retryable");
        setMessage("Error de conexión al registrar el pedido.");
      }
    },
    [router]
  );

  // Paso 1: verificación server-side (autoritativa) contra Tilopay.
  const verifyAndCreate = useCallback(async () => {
    if (!orderNumber) {
      setPhase("fatal");
      setMessage("No se recibió la referencia del pago.");
      return;
    }
    setPhase("verifying");
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const json = await res.json();
      if (!res.ok) {
        // No sabemos si el pago pasó o no: reintentable, jamás mandar a pagar de nuevo.
        setPhase("retryable");
        setMessage(json.error ?? "No se pudo verificar el pago.");
        return;
      }
      if (!json.approved) {
        setPhase("declined");
        setMessage(json.reason ?? "El pago fue rechazado.");
        return;
      }
      payment.current = json.payment as PaymentInfo;
      setAuthRef(payment.current.auth ?? "");
      await createOrder(payment.current);
    } catch {
      setPhase("retryable");
      setMessage("Error de conexión al verificar el pago.");
    }
  }, [orderNumber, createOrder]);

  // Reintento manual: si ya verificamos el pago, solo re-registra; si no, re-verifica.
  const retry = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (payment.current) await createOrder(payment.current);
      else await verifyAndCreate();
    } finally {
      busy.current = false;
    }
  }, [createOrder, verifyAndCreate]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    verifyAndCreate();
  }, [verifyAndCreate]);

  if (phase === "verifying" || phase === "creating") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Loader2 className="h-14 w-14 text-primary animate-spin" />
        <p className="font-medium">
          {phase === "verifying" ? "Verificando tu pago..." : "Registrando tu pedido..."}
        </p>
        <p className="text-sm text-muted-foreground">No cierres esta ventana.</p>
      </div>
    );
  }

  if (phase === "declined") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <XCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-bold">Pago rechazado</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          No se realizó ningún cobro. Puedes intentar con otra tarjeta.
        </p>
        <Link href="/checkout">
          <Button className="mt-2 bg-primary hover:bg-primary/90">Intentar de nuevo</Button>
        </Link>
      </div>
    );
  }

  if (phase === "retryable") {
    // ⚠️ Aquí puede haber un pago APROBADO sin pedido registrado: el único camino
    // seguro es reintentar el registro. Nunca ofrecer volver al checkout.
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <RotateCcw className="h-16 w-16 text-amber-500" />
        <h2 className="text-xl font-bold">Falta un paso</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Si tu pago fue aprobado <strong>no se perdió</strong>: reintenta para
          completar el registro del pedido. No pagues de nuevo.
        </p>
        {authRef && (
          <p className="text-xs text-muted-foreground">
            Referencia de autorización: <span className="font-mono font-medium">{authRef}</span>
          </p>
        )}
        <Button onClick={retry} className="mt-2 bg-primary hover:bg-primary/90">
          Reintentar
        </Button>
      </div>
    );
  }

  // fatal
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <XCircle className="h-16 w-16 text-amber-500" />
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {authRef && (
        <p className="text-xs text-muted-foreground">
          Referencia de autorización: <span className="font-mono font-medium">{authRef}</span>
        </p>
      )}
      <Link href="/">
        <Button className="mt-2 bg-primary hover:bg-primary/90">Ir al inicio</Button>
      </Link>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <Loader2 className="h-14 w-14 text-primary animate-spin" />
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
