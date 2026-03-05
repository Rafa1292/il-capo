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

  const triggerContent = (
    <>
      <ShoppingBag
        className={cn(
          "h-4 w-4 transition-colors",
          !isMobile && cartOpen
            ? "text-foreground"
            : "text-foreground/50 group-hover:text-foreground"
        )}
      />
      {cartCount > 0 && (
        <span className="text-xs font-semibold text-foreground tabular-nums">{cartCount}</span>
      )}
    </>
  );

  // Desktop: button toggles sidebar in store — no modal
  if (mounted && !isMobile) {
    return (
      <button
        onClick={() => setCartOpen(!cartOpen)}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 transition-colors group"
      >
        {triggerContent}
      </button>
    );
  }

  // Mobile: bottom Sheet que queda por encima del bottom nav (bottom-16)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative flex items-center gap-1.5 px-2.5 py-1.5 transition-colors group">
          {triggerContent}
        </button>
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

