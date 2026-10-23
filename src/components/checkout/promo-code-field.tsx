"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";
import type { CartItem } from "@/types";

export interface AppliedPromo {
  code: string;
  discount: number;
  label: string;
}

/**
 * "¿Tenés un código?" del checkout.
 *
 * El código que trajo el link de WhatsApp ya está guardado y se aplica solo.
 * El descuento lo calcula el servidor sobre la comida (no sobre el envío) y se
 * recalcula si cambia el carrito: un 20% depende del subtotal.
 */
export function PromoCodeField({
  items,
  applied,
  onApplied,
}: {
  items: CartItem[];
  applied: AppliedPromo | null;
  onApplied: (promo: AppliedPromo | null) => void;
}) {
  const stored = useCartStore((s) => s.promoCode);
  const setStored = useCartStore((s) => s.setPromoCode);
  const [open, setOpen] = useState(!!stored);
  const [input, setInput] = useState(stored);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/promo-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            items: items.map((i) => ({
              saleItemId: i.saleItemId,
              quantity: i.quantity,
              modifiers: i.modifiers,
              pizzaBuilder: i.pizzaBuilder,
            })),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Ese código no sirve");
          onApplied(null);
          return;
        }
        setStored(json.code);
        setInput(json.code);
        onApplied(json as AppliedPromo);
      } catch {
        setError("No pudimos revisar el código");
        onApplied(null);
      } finally {
        setBusy(false);
      }
    },
    [items, onApplied, setStored]
  );

  // Al entrar (código del link) y cada vez que cambia el carrito.
  useEffect(() => {
    const code = useCartStore.getState().promoCode;
    if (code) void apply(code);
  }, [apply]);

  function remove() {
    onApplied(null);
    setStored("");
    setInput("");
    setError(null);
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-green-600/30 bg-green-50 px-3 py-2 text-sm dark:bg-green-950/30">
        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-700" />
          <span>
            <strong>{applied.code}</strong> · {applied.label}
          </span>
        </span>
        <button type="button" onClick={remove} className="text-muted-foreground hover:text-foreground" aria-label="Quitar código">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-primary hover:underline">
        ¿Tenés un código de descuento?
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            // Enter no tiene que mandar el pedido.
            if (e.key === "Enter") {
              e.preventDefault();
              void apply(input);
            }
          }}
          placeholder="VUELVE-XXXX"
          autoCapitalize="characters"
          className="uppercase"
        />
        <Button type="button" variant="outline" onClick={() => apply(input)} disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
