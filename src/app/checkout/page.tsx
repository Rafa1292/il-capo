"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UtensilsCrossed, Bike, ShoppingCart, MapPin } from "lucide-react";
import { useCartStore, itemTotal } from "@/store/cart";
import { useProfileStore } from "@/store/profile";
import Link from "next/link";

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

  // Pre-llenar desde el perfil guardado (cuenta local) lo que esté vacío.
  useEffect(() => {
    const p = useProfileStore.getState();
    setName((v) => v || p.name);
    setPhone((v) => v || p.phone);
    setEmail((v) => v || p.email);
  }, []);

  const cartTotal = total();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <div>
          <p className="font-semibold text-lg">Tu carrito está vacío</p>
          <p className="text-sm text-muted-foreground mt-1">Agrega productos desde el menú</p>
        </div>
        <Link href="/menu">
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
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Ingresa un correo válido para el comprobante de pago");
      return;
    }
    if (deliveryMethod === "DELIVERY" && !address.trim()) {
      toast.error("La dirección es requerida para entregas a domicilio");
      return;
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
          // El servidor compara este total (el que ve el cliente) con el recalculado:
          // si un precio cambió, frena en vez de cobrar un monto distinto al mostrado.
          expectedTotal: cartTotal,
        }),
      });

      const json = await res.json();

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
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">Completa tu pedido</p>
      </div>

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

      {/* Customer info */}
      <section className="space-y-4">
        <h2 className="font-semibold">Tus datos</h2>
        <div className="space-y-3">
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
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="8888-8888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
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
              Para enviarte el comprobante de pago.
            </p>
          </div>
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
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Redirigiendo al pago..."
          : `Pagar ₡${cartTotal.toLocaleString("es-CR")}`}
      </Button>
    </form>
  );
}
