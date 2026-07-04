"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartPanel } from "./cart-panel";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

export function CartSheet() {
  const { count, cartOpen, setCartOpen } = useCartStore();
  const cartCount = count();

  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active = !isMobile && cartOpen;

  const triggerClass = cn(
    "flex flex-col items-center gap-0.5 px-2.5 py-2 transition-colors text-xs",
    active ? "text-primary" : "text-foreground/50 hover:text-foreground"
  );

  const triggerContent = (
    <>
      <span className="relative">
        <ShoppingBag className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-white">
            {cartCount}
          </span>
        )}
      </span>
      Carrito
    </>
  );

  // Desktop: button toggles sidebar in store — no modal
  if (mounted && !isMobile) {
    return (
      <button onClick={() => setCartOpen(!cartOpen)} className={triggerClass}>
        {triggerContent}
      </button>
    );
  }

  // Mobile: bottom Sheet que queda por encima del bottom nav (bottom-16)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className={triggerClass}>{triggerContent}</button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl max-h-[88vh] flex flex-col p-0"
      >
        <SheetTitle className="sr-only">Tu pedido</SheetTitle>
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
          <h2 className="font-semibold text-base">Tu pedido</h2>
        </div>
        <CartPanel />
      </SheetContent>
    </Sheet>
  );
}

