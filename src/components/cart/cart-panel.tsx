"use client";

import Link from "next/link";
import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, itemTotal } from "@/store/cart";

export function CartPanel() {
  const { items, count, total, removeItem, updateQuantity } = useCartStore();
  const cartTotal = total();

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
                    {item.modifiers.flatMap((g) => g.elements.map((e) => e.name)).join(", ")}
                  </p>
                )}
                <p className="text-sm font-semibold text-primary">
                  ₡{itemTotal(item).toLocaleString("es-CR")}
                </p>
              </div>
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
            </div>
          </div>
        ))}
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
