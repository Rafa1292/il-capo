"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, Minus, Plus, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, itemTotal } from "@/store/cart";
import { GIFT, giftAvailableToday, isGift } from "@/lib/gift";

export function CartPanel() {
  const { items, total, removeItem, updateQuantity, addItem } = useCartStore();
  const cartTotal = total();

  // El día se mira en el navegador al abrir el carrito; el servidor lo vuelve
  // a revisar al confirmar el pedido.
  const [giftDay, setGiftDay] = useState(false);
  useEffect(() => {
    setGiftDay(giftAvailableToday());
  }, []);

  const giftLine = items.find((i) => isGift(i.saleItemId));
  const hasOthers = items.some((i) => !isGift(i.saleItemId));

  // Sin otro producto, o fuera de lunes a jueves, el regalo se va solo.
  useEffect(() => {
    if (giftLine && (!hasOthers || !giftDay)) removeItem(giftLine.cartId);
  }, [giftLine, hasOthers, giftDay, removeItem]);

  const claimGift = () =>
    addItem({
      saleItemId: GIFT.saleItemId,
      description: GIFT.description,
      quantity: 1,
      unitPrice: 0,
      modifiers: [],
    });

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12 px-4">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Tu carrito está vacío</p>
        <p className="text-sm text-muted-foreground">Agrega productos desde el menú</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {items.map((item) => (
          <div key={item.cartId} className="space-y-1">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{item.description}</p>
                {item.modifiers.flatMap((g) => g.elements).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {item.modifiers
                      .map((g) => {
                        const normal = g.elements
                          .filter((e) => !e.isCombined)
                          .map((e) => (e.quantity > 1 ? `${e.quantity}× ` : "") + e.name.trim());
                        const combined = g.elements
                          .filter((e) => e.isCombined)
                          .map((e) => e.name.trim());
                        const base = normal.join(", ");
                        return combined.length ? `${base} / ${combined.join(" / ")}` : base;
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                <p className="text-sm font-semibold text-primary">
                  {isGift(item.saleItemId)
                    ? "Gratis"
                    : `₡${itemTotal(item).toLocaleString("es-CR")}`}
                </p>
              </div>
              {isGift(item.saleItemId) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive"
                  onClick={() => removeItem(item.cartId)}
                  aria-label="Quitar el regalo"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              ) : (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeItem(item.cartId)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              )}
            </div>
          </div>
        ))}

        {giftDay && hasOthers && !giftLine && (
          <button
            type="button"
            onClick={claimGift}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2.5 text-left text-sm hover:bg-primary/10"
          >
            <Gift className="h-5 w-5 shrink-0 text-primary" />
            <span>
              <span className="font-semibold">Reclamá tu pan de ajo gratis</span>
              <span className="block text-xs text-muted-foreground">
                De lunes a jueves, en pedidos por la web
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="border-t p-4 space-y-3">
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>₡{cartTotal.toLocaleString("es-CR")}</span>
        </div>
        <Link href="/checkout" className="block">
          <Button className="w-full bg-primary hover:bg-primary/90">
            Ir al checkout
          </Button>
        </Link>
      </div>
    </div>
  );
}
