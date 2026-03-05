"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UtensilsCrossed, Bike, ShoppingCart } from "lucide-react";
import { useCartStore, itemTotal } from "@/store/cart";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
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
    clearCart,
  } = useCartStore();

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [address, setAddress] = useState(deliveryAddress);
  const [orderNotes, setOrderNotes] = useState(notes);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (deliveryMethod === "DELIVERY" && !address.trim()) {
      toast.error("La dirección es requerida para entregas a domicilio");
      return;
    }

    setIsSubmitting(true);

    try {
      setCustomerInfo({ name: name.trim(), phone: phone.trim() });
      setDeliveryAddress(address.trim());
      setNotes(orderNotes.trim());

      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        deliveryMethod,
        deliveryAddress: deliveryMethod === "DELIVERY" ? address.trim() : undefined,
        notes: orderNotes.trim() || undefined,
        items: items.map((item) => ({
          saleItemId: item.saleItemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
        })),
        estimatedTotal: cartTotal,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Error al enviar el pedido");
        return;
      }

      clearCart();
      router.push(`/pedido/${json.data.id}`);
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
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
          {deliveryMethod === "DELIVERY" && (
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección de entrega *</Label>
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
        {isSubmitting ? "Enviando pedido..." : "Confirmar pedido"}
      </Button>
    </form>
  );
}
