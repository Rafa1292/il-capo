"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UtensilsCrossed, Bike, ShoppingCart, MapPin, CreditCard, Banknote } from "lucide-react";
import { useCartStore, itemTotal } from "@/store/cart";
import { useProfileStore } from "@/store/profile";
import { LocationPicker, type PickedLocation } from "@/components/checkout/location-picker";
import { CashVerification } from "@/components/checkout/cash-verification";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveLastOrder } from "@/lib/last-order";
import { track } from "@/lib/track";

type PaymentMethod = "CARD" | "CASH";

/**
 * El efectivo está construido de punta a punta pero apagado: exige verificar el
 * número con un código de WhatsApp, y eso necesita el número real del negocio
 * ligado a la cuenta de Meta (hoy hay uno de prueba, que no permite crear la
 * plantilla del código).
 *
 * Se enciende con NEXT_PUBLIC_CASH_ENABLED=true. Ver docs/pagos-efectivo.md.
 */
const CASH_ENABLED = process.env.NEXT_PUBLIC_CASH_ENABLED === "true";

/** Estado de la cotización del envío mientras el cliente mueve el pin. */
type DeliveryQuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; price: number; zoneName: string | null }
  | { status: "out-of-range" }
  | { status: "error" };

export default function CheckoutPage() {
  const {
    items,
    total,
    deliveryMethod,
    customerName,
    customerPhone,
    deliveryAddress,
    notes,
    setDeliveryMethod,
    setCustomerInfo,
    setDeliveryAddress,
    setNotes,
  } = useCartStore();

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState(deliveryAddress);
  const [orderNotes, setOrderNotes] = useState(notes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedAddresses = useProfileStore((s) => s.addresses);
  const [recognized, setRecognized] = useState(false);

  const deliveryPin = useCartStore((s) => s.deliveryPin);
  const setDeliveryPin = useCartStore((s) => s.setDeliveryPin);
  const [quote, setQuote] = useState<DeliveryQuoteState>({ status: "idle" });
  const [storeLocation, setStoreLocation] = useState<PickedLocation | null>(null);

  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  /** Número ya comprobado en este dispositivo (lo dice la cookie firmada). */
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cash-verification")
      .then((r) => r.json())
      .then((j) => setVerifiedPhone(j?.phone ?? null))
      .catch(() => {});
  }, []);

  // Último paso del embudo antes del pago. Comparado contra los pedidos que
  // sí entraron, es lo que dice cuánta gente se cae en la pantalla de pagar.
  useEffect(() => {
    track("CHECKOUT", { once: true });
  }, []);

  const digitsOnly = (s: string) => s.replace(/\D/g, "");
  const phoneIsVerified = !!verifiedPhone && verifiedPhone === digitsOnly(phone);

  // Centro del mapa: dónde está la pizzería. Se pide una sola vez.
  useEffect(() => {
    if (deliveryMethod !== "DELIVERY" || storeLocation) return;
    fetch("/api/delivery-quote")
      .then((r) => r.json())
      .then((j) => j?.origin && setStoreLocation(j.origin))
      .catch(() => {});
  }, [deliveryMethod, storeLocation]);

  // Cotiza cada vez que se mueve el pin. El precio mostrado no es el que se
  // cobra: ese se recalcula al autorizar y nico lo verifica otra vez.
  useEffect(() => {
    if (deliveryMethod !== "DELIVERY" || !deliveryPin) {
      setQuote({ status: "idle" });
      return;
    }
    let cancelled = false;
    setQuote({ status: "loading" });

    // Pequeña espera: arrastrar el pin dispara muchos cambios seguidos.
    const timer = setTimeout(() => {
      fetch("/api/delivery-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryPin),
      })
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          if (j?.error) return setQuote({ status: "error" });
          if (!j?.covered) return setQuote({ status: "out-of-range" });
          setQuote({ status: "ok", price: j.price, zoneName: j.zoneName ?? null });
        })
        .catch(() => !cancelled && setQuote({ status: "error" }));
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [deliveryMethod, deliveryPin]);

  // Pre-llenar desde el perfil guardado (cuenta local) lo que esté vacío.
  useEffect(() => {
    const p = useProfileStore.getState();
    setName((v) => v || p.name);
    setPhone((v) => v || p.phone);
    setEmail((v) => v || p.email);
    if (p.phone) setRecognized(true);
  }, []);

  /**
   * Si el teléfono que escriben es el de este dispositivo, se rellena el resto.
   * Es el caso del cliente que repite y llegó con el formulario en blanco (borró
   * datos del navegador, otra pestaña). No se borra nada si el número es otro:
   * puede estar corrigiendo un dígito y quedarse sin lo que ya había escrito.
   */
  function onPhoneChange(value: string) {
    setPhone(value);
    const p = useProfileStore.getState();
    const digits = (s: string) => s.replace(/\D/g, "");
    const match = !!p.phone && digits(value) === digits(p.phone);
    setRecognized(match);
    if (match) {
      setName((v) => v || p.name);
      setEmail((v) => v || p.email);
    }
  }

  const foodTotal = total();
  const deliveryFee = quote.status === "ok" ? quote.price : 0;
  const cartTotal = foodTotal + deliveryFee;

  /**
   * Por qué no se puede pedir todavía, o null si se puede.
   *
   * Va en el texto del botón en vez de aparecer como error al tocarlo: el
   * cliente ve qué le falta antes de intentar, no después.
   */
  const blockedReason: string | null = (() => {
    if (paymentMethod === "CASH" && !phoneIsVerified) {
      return "Verificá tu número para continuar";
    }
    if (deliveryMethod === "DELIVERY") {
      if (!deliveryPin) return "Marcá en el mapa dónde entregamos";
      if (quote.status === "loading") return "Calculando el envío...";
      if (quote.status === "out-of-range") return "Fuera de la zona de entrega";
      if (quote.status === "error") return "No pudimos calcular el envío";
    }
    return null;
  })();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <div>
          <p className="font-semibold text-lg">Tu carrito está vacío</p>
          <p className="text-sm text-muted-foreground mt-1">Agrega productos desde el menú</p>
        </div>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">Ver el menú</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error("Nombre y teléfono son requeridos");
      return;
    }
    // El correo es para el comprobante de la tarjeta: en efectivo no hay nada
    // que mandar, así que no se pide.
    if (
      paymentMethod === "CARD" &&
      (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    ) {
      toast.error("Ingresa un correo válido para el comprobante de pago");
      return;
    }
    if (paymentMethod === "CASH" && !phoneIsVerified) {
      toast.error("Verificá tu número para pagar en efectivo");
      return;
    }
    if (deliveryMethod === "DELIVERY" && !address.trim()) {
      toast.error("La dirección es requerida para entregas a domicilio");
      return;
    }
    if (deliveryMethod === "DELIVERY") {
      // Sin envío confirmado no se puede autorizar: el monto de la tarjeta se
      // fija en ese momento y después no se le puede sumar nada.
      if (!deliveryPin) {
        toast.error("Marcá en el mapa dónde entregamos");
        return;
      }
      if (quote.status === "out-of-range") {
        toast.error("Esa dirección está fuera de nuestra zona de entrega");
        return;
      }
      if (quote.status !== "ok") {
        toast.error("Esperá a que calculemos el envío");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Persistimos los datos del cliente en el store: la página de retorno los
      // usa para crear el pedido en nico DESPUÉS de que el pago sea aprobado.
      // El carrito NO se limpia aquí; se limpia al confirmarse el pago.
      setCustomerInfo({ name: name.trim(), phone: phone.trim() });
      setDeliveryAddress(address.trim());
      setNotes(orderNotes.trim());

      // Guardamos también en el perfil del dispositivo: el próximo pedido
      // arranca con todo pre-llenado.
      const profile = useProfileStore.getState();
      profile.setProfile({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      if (deliveryMethod === "DELIVERY") profile.rememberAddress(address);

      // Efectivo: el pedido se registra de una. No hay pasarela de por medio
      // porque el cobro ocurre al entregar.
      if (paymentMethod === "CASH") {
        const cashRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: "CASH",
            customerName: name.trim(),
            customerPhone: phone.trim(),
            deliveryMethod,
            deliveryAddress: deliveryMethod === "DELIVERY" ? address.trim() : undefined,
            deliveryLocationPin: deliveryMethod === "DELIVERY" ? deliveryPin : undefined,
            notes: orderNotes.trim() || undefined,
            items: items.map((i) => ({
              saleItemId: i.saleItemId,
              description: i.description,
              quantity: i.quantity,
              modifiers: i.modifiers.length > 0 ? i.modifiers : undefined,
              pizzaBuilder: i.pizzaBuilder,
            })),
          }),
        });
        const cashJson = await cashRes.json();
        if (!cashRes.ok || !cashJson.data?.id) {
          toast.error(cashJson.error ?? "No se pudo registrar el pedido");
          setIsSubmitting(false);
          return;
        }
        const token = cashJson.data.accessToken as string | undefined;
        if (token) saveLastOrder(cashJson.data.id, token);
        useCartStore.getState().clearCart();
        router.replace(`/pedido/${cashJson.data.id}${token ? `?t=${encodeURIComponent(token)}` : ""}`);
        return;
      }

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // El servidor recalcula el total con precios reales; no mandamos monto.
          items: items.map((i) => ({
            saleItemId: i.saleItemId,
            quantity: i.quantity,
            modifiers: i.modifiers,
            pizzaBuilder: i.pizzaBuilder,
          })),
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim(),
          deliveryMethod,
          deliveryLocation: deliveryMethod === "DELIVERY" ? deliveryPin : null,
          // El servidor compara este total (el que ve el cliente) con el recalculado:
          // si un precio cambió, frena en vez de cobrar un monto distinto al mostrado.
          expectedTotal: cartTotal,
        }),
      });

      const json = await res.json();

      if (res.status === 409 && json.code === "OUT_OF_RANGE") {
        toast.error(json.error, { duration: 8000 });
        setQuote({ status: "out-of-range" });
        setIsSubmitting(false);
        return;
      }
      if (res.status === 409 && json.code === "PRICES_CHANGED") {
        toast.error(json.error, { duration: 8000 });
        setIsSubmitting(false);
        return;
      }
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "No se pudo iniciar el pago");
        setIsSubmitting(false);
        return;
      }

      // Redirigimos al formulario de pago de Tilopay.
      window.location.href = json.url;
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Delivery method */}
      <section className="space-y-3">
        <h2 className="font-semibold">¿Cómo quieres recibirlo?</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryMethod("TAKEOUT")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              deliveryMethod === "TAKEOUT"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <UtensilsCrossed className={`h-6 w-6 ${deliveryMethod === "TAKEOUT" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${deliveryMethod === "TAKEOUT" ? "text-primary" : ""}`}>
              Para recoger
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMethod("DELIVERY")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              deliveryMethod === "DELIVERY"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <Bike className={`h-6 w-6 ${deliveryMethod === "DELIVERY" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${deliveryMethod === "DELIVERY" ? "text-primary" : ""}`}>
              A domicilio
            </span>
          </button>
        </div>
      </section>

      {/* Payment method */}
      <section className="space-y-3">
        <h2 className="font-semibold">¿Cómo pagás?</h2>
        {!CASH_ENABLED ? (
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-primary" />
              Pago con tarjeta
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Por ahora solo aceptamos tarjeta. Estamos habilitando el pago en
              efectivo al recibir.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("CARD")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              paymentMethod === "CARD"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <CreditCard className={`h-6 w-6 ${paymentMethod === "CARD" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${paymentMethod === "CARD" ? "text-primary" : ""}`}>
              Tarjeta
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              paymentMethod === "CASH"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <Banknote className={`h-6 w-6 ${paymentMethod === "CASH" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${paymentMethod === "CASH" ? "text-primary" : ""}`}>
              Efectivo
            </span>
          </button>
        </div>
        )}
        {CASH_ENABLED && paymentMethod === "CASH" && (
          <p className="text-xs text-muted-foreground">
            Pagás todo al recibir, incluido el envío. Tené el monto listo para
            facilitarle el vuelto al mensajero.
          </p>
        )}
      </section>

      {/* Customer info */}
      <section className="space-y-4">
        <h2 className="font-semibold">Tus datos</h2>
        <div className="space-y-3">
          {/* El teléfono va primero: es con lo que el negocio identifica al
              cliente, y si es el mismo de este dispositivo rellena el resto. */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="8888-8888"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              required
            />
            {recognized && (
              <p className="text-xs text-muted-foreground">
                Datos guardados en este dispositivo.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {/* Solo con tarjeta: el correo existe para el comprobante del cobro. */}
          {paymentMethod === "CARD" && (
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Ahí te llega el comprobante del pago con tarjeta y cualquier aviso
                sobre una devolución. Lo pedimos una sola vez: la próxima ya viene
                listo.
              </p>
            </div>
          )}

          {paymentMethod === "CASH" && !phoneIsVerified && (
            <CashVerification
              phone={phone}
              customerName={name}
              onVerified={() => setVerifiedPhone(digitsOnly(phone))}
            />
          )}
          {deliveryMethod === "DELIVERY" && (
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección de entrega *</Label>
              {savedAddresses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAddress(a.address)}
                      className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <MapPin className="h-3 w-3" />
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                id="address"
                placeholder="Calle, número, barrio, referencias..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                required
              />

              {/* El mapa no reemplaza las señas: el mensajero necesita las dos
                  cosas. El punto define el precio; las señas, cómo llegar. */}
              <div className="space-y-1.5 pt-2">
                <Label>¿Dónde te lo dejamos? *</Label>
                {storeLocation ? (
                  <LocationPicker
                    value={deliveryPin}
                    onChange={setDeliveryPin}
                    fallbackCenter={storeLocation}
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-xl border text-sm text-muted-foreground">
                    Cargando el mapa...
                  </div>
                )}

                {quote.status === "loading" && (
                  <p className="text-xs text-muted-foreground">Calculando el envío...</p>
                )}
                {quote.status === "ok" && (
                  <p className="text-xs">
                    Envío{quote.zoneName ? ` (${quote.zoneName})` : ""}:{" "}
                    <span className="font-semibold">₡{quote.price.toLocaleString("es-CR")}</span>
                  </p>
                )}
                {quote.status === "out-of-range" && (
                  <p className="text-xs text-destructive">
                    Ese punto queda fuera de nuestra zona de entrega. Probá con
                    &quot;Para recoger&quot; o escribinos por WhatsApp.
                  </p>
                )}
                {quote.status === "error" && (
                  <p className="text-xs text-destructive">
                    No pudimos calcular el envío. Movés el pin otra vez o probá en un momento.
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Instrucciones especiales, alergias..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Order summary */}
      <section className="space-y-3">
        <h2 className="font-semibold">Resumen</h2>
        <div className="border rounded-xl p-4 space-y-3">
          {items.map((item) => (
            <div key={item.cartId} className="flex justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {item.quantity}× {item.description}
              </span>
              <span className="font-medium shrink-0">
                ₡{itemTotal(item).toLocaleString("es-CR")}
              </span>
            </div>
          ))}
          {deliveryMethod === "DELIVERY" && (
            <>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="font-medium">
                  {quote.status === "ok"
                    ? `₡${quote.price.toLocaleString("es-CR")}`
                    : "—"}
                </span>
              </div>
            </>
          )}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₡{cartTotal.toLocaleString("es-CR")}</span>
          </div>
        </div>
      </section>

      <Button
        type="submit"
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        disabled={isSubmitting || blockedReason !== null}
      >
        {isSubmitting
          ? paymentMethod === "CASH"
            ? "Enviando pedido..."
            : "Redirigiendo al pago..."
          : (blockedReason ??
            (paymentMethod === "CASH"
              ? `Pedir — pago ₡${cartTotal.toLocaleString("es-CR")} al recibir`
              : `Pagar ₡${cartTotal.toLocaleString("es-CR")}`))}
      </Button>
    </form>
  );
}
