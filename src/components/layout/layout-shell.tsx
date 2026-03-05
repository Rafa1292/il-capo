"use client";

import { X } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CartPanel } from "@/components/cart/cart-panel";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { cartOpen, setCartOpen } = useCartStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Contenido principal — scroll independiente */}
      <div data-scroll-container className="flex-1 min-w-0 overflow-y-auto">
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-24 min-h-full">
          {children}
        </main>
        <BottomNav />
      </div>

      {/* Sidebar del carrito — solo desktop, scroll independiente */}
      <div
        className={cn(
          "hidden md:flex flex-col border-l border-border bg-background overflow-hidden transition-[width] duration-300 ease-in-out shrink-0",
          cartOpen ? "w-80" : "w-0"
        )}
      >
        <div className="w-80 flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between px-4 py-4 border-b shrink-0">
            <h2 className="font-semibold text-base">Tu pedido</h2>
            <button
              onClick={() => setCartOpen(false)}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Cerrar carrito"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <CartPanel />
        </div>
      </div>
    </div>
  );
}
