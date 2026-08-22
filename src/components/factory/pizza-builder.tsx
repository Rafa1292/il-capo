"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { squareImage } from "@/lib/cloudinary-image";
import { useCartStore } from "@/store/cart";
import type {
  PizzaBuilderData,
  PizzaBuilderCartSelection,
  PizzaBuilderTopping,
} from "@/types";

type Step = "size" | "dough" | "sauce" | "toppings";
type HalfSide = "left" | "right";

const STEPS: Step[] = ["size", "dough", "sauce", "toppings"];
const STEP_LABELS: Record<Step, string> = {
  size: "Tamaño",
  dough: "Masa",
  sauce: "Salsa",
  toppings: "Toppings",
};

export function PizzaBuilder({ data }: { data: PizzaBuilderData }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const [step, setStep] = useState<Step>("size");
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [doughId, setDoughId] = useState<string | null>(
    () => data.doughs.length === 1 ? data.doughs[0].id : null
  );
  const [sauceId, setSauceId] = useState<string | null>(
    () => data.sauces.find((s) => s.isDefault)?.id ?? null
  );
  const [isHalf, setIsHalf] = useState(false);
  const [halfSide, setHalfSide] = useState<HalfSide>("left");
  const [toppings, setToppings] = useState<Record<string, number>>({});
  const [leftToppings, setLeftToppings] = useState<Record<string, number>>({});
  const [rightToppings, setRightToppings] = useState<Record<string, number>>({});

  const stepIndex = STEPS.indexOf(step);

  const price = useMemo(() => {
    const size = data.sizes.find((s) => s.id === sizeId);
    const dough = data.doughs.find((d) => d.id === doughId);
    const sauce = data.sauces.find((s) => s.id === sauceId);
    let total = (size?.basePrice ?? 0) + (dough?.extraPrice ?? 0) + (sauce?.extraPrice ?? 0);

    for (const group of data.toppingGroups) {
      for (const t of group.toppings) {
        const row = t.portionsBySize.find((p) => p.sizeId === sizeId);
        if (!row) continue;
        if (!isHalf) {
          const p = toppings[t.id] ?? 0;
          if (p > 0) total += t.pricePerUnit * row.unitsPerPortion * p;
        } else {
          const lp = leftToppings[t.id] ?? 0;
          const rp = rightToppings[t.id] ?? 0;
          if (lp > 0) total += t.pricePerUnit * row.unitsPerHalf * lp;
          if (rp > 0) total += t.pricePerUnit * row.unitsPerHalf * rp;
        }
      }
    }
    return total;
  }, [sizeId, doughId, sauceId, isHalf, toppings, leftToppings, rightToppings, data]);

  function canNext(): boolean {
    if (step === "size") return !!sizeId;
    if (step === "dough") return !!doughId;
    if (step === "sauce") return !!sauceId;
    return true;
  }

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
    else router.push("/factory");
  }

  function setTopping(id: string, delta: number, maxPortions: number) {
    const setter = isHalf
      ? halfSide === "left" ? setLeftToppings : setRightToppings
      : setToppings;
    setter((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, Math.min(maxPortions, current + delta));
      return { ...prev, [id]: next };
    });
  }

  function getToppingCount(id: string): number {
    if (!isHalf) return toppings[id] ?? 0;
    return halfSide === "left" ? (leftToppings[id] ?? 0) : (rightToppings[id] ?? 0);
  }

  function handleAddToCart() {
    if (!sizeId || !doughId || !sauceId) {
      toast.error("Completa todos los pasos antes de agregar al carrito");
      return;
    }
    if (!data.config.saleItemId) {
      toast.error("Pizza builder no configurado. Contacta al restaurante.");
      return;
    }

    const size = data.sizes.find((s) => s.id === sizeId)!;
    const dough = data.doughs.find((d) => d.id === doughId)!;
    const sauce = data.sauces.find((s) => s.id === sauceId)!;
    const halfTag = isHalf ? " (Mitad/Mitad)" : "";

    const selection: PizzaBuilderCartSelection = isHalf
      ? {
          sizeId, doughId, sauceId, isHalf: true,
          leftToppings: Object.entries(leftToppings).filter(([, p]) => p > 0).map(([toppingId, portions]) => ({ toppingId, portions })),
          rightToppings: Object.entries(rightToppings).filter(([, p]) => p > 0).map(([toppingId, portions]) => ({ toppingId, portions })),
        }
      : {
          sizeId, doughId, sauceId, isHalf: false,
          toppings: Object.entries(toppings).filter(([, p]) => p > 0).map(([toppingId, portions]) => ({ toppingId, portions })),
        };

    addItem({
      saleItemId: data.config.saleItemId,
      description: `Pizza ${size.name}${halfTag} — ${dough.name} / ${sauce.name}`,
      quantity: 1,
      unitPrice: price,
      modifiers: [],
      pizzaBuilder: selection,
    });

    toast.success("Pizza agregada al carrito");
    setCartOpen(true);
    router.push("/menu");
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Construye tu pizza</h1>
          <span className="text-lg font-semibold text-primary">
            ₡{price.toLocaleString("es-CR")}
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1">
              <div className={cn(
                "h-1 rounded-full transition-colors",
                i < stepIndex ? "bg-primary" : i === stepIndex ? "bg-primary" : "bg-border"
              )} />
              <span className={cn(
                "text-[10px] text-center",
                i === stepIndex ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {STEP_LABELS[s]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1">
        {step === "size" && (
          <OptionGrid
            label="¿Qué tamaño quieres?"
            options={data.sizes.map((s) => ({
              id: s.id,
              label: s.name,
              detail: `₡${s.basePrice.toLocaleString("es-CR")}`,
              imageUrl: s.imageUrl,
            }))}
            selected={sizeId}
            onSelect={setSizeId}
          />
        )}

        {step === "dough" && (
          <OptionGrid
            label="Elige la masa"
            options={data.doughs.map((d) => ({
              id: d.id,
              label: d.name,
              detail: d.extraPrice > 0 ? `+₡${d.extraPrice.toLocaleString("es-CR")}` : "Incluida",
              imageUrl: d.imageUrl,
            }))}
            selected={doughId}
            onSelect={setDoughId}
          />
        )}

        {step === "sauce" && (
          <OptionGrid
            label="Elige la salsa"
            options={data.sauces.map((s) => ({
              id: s.id,
              label: s.name,
              detail: s.extraPrice > 0 ? `+₡${s.extraPrice.toLocaleString("es-CR")}` : "Incluida",
              imageUrl: s.imageUrl,
            }))}
            selected={sauceId}
            onSelect={setSauceId}
          />
        )}

        {step === "toppings" && (
          <div className="space-y-4">
            {data.config.halvesEnabled && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsHalf((v) => !v)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    isHalf ? "bg-primary" : "bg-border"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform",
                    isHalf && "translate-x-5"
                  )} />
                </button>
                <span className="text-sm font-medium">Mitad y mitad</span>
              </div>
            )}

            {isHalf && (
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHalfSide("left")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    halfSide === "left" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ← Izquierda
                </button>
                <button
                  type="button"
                  onClick={() => setHalfSide("right")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    halfSide === "right" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Derecha →
                </button>
              </div>
            )}

            {data.toppingGroups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay toppings disponibles
              </p>
            )}

            {data.toppingGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.name}
                  {group.maxPerHalf && (
                    <span className="ml-1 text-xs font-normal normal-case">
                      (máx. {group.maxPerHalf} por mitad)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {group.toppings.map((topping) => (
                    <ToppingCard
                      key={topping.id}
                      topping={topping}
                      count={getToppingCount(topping.id)}
                      onAdd={() => setTopping(topping.id, 1, topping.maxPortions)}
                      onRemove={() => setTopping(topping.id, -1, topping.maxPortions)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="sticky bottom-0 pt-4 pb-2 bg-background border-t border-border mt-6 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {stepIndex === 0 ? "Cancelar" : "Atrás"}
        </Button>

        {step !== "toppings" ? (
          <Button
            type="button"
            className="flex-1 bg-primary hover:bg-primary/90 flex items-center justify-center gap-1"
            disabled={!canNext()}
            onClick={goNext}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1 bg-primary hover:bg-primary/90 flex items-center justify-center gap-1"
            onClick={handleAddToCart}
          >
            <Check className="h-4 w-4" />
            Agregar al carrito
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Un topping como tarjeta: foto grande, nombre al pie.
 *
 * La foto entera es el botón de sumar, porque en el celular es el gesto que ya
 * hace todo el mundo y el objetivo es apetecible, no un "+" de 28 píxeles. El
 * menos solo aparece cuando hay algo que bajar: mostrarlo siempre desactivado
 * era ruido en cada tarjeta de la grilla.
 *
 * El menos es hermano del botón, no hijo: un botón dentro de otro no es HTML
 * válido y el navegador decide solo qué hacer con el clic.
 */
function ToppingCard({
  topping,
  count,
  onAdd,
  onRemove,
}: {
  topping: PizzaBuilderTopping;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const atMax = count >= topping.maxPortions;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onAdd}
        disabled={atMax}
        aria-label={`Agregar ${topping.name}`}
        className="w-full text-center transition active:scale-95 disabled:active:scale-100"
      >
        <div className="relative aspect-square">
          {topping.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={squareImage(topping.imageUrl)}
              alt={topping.name}
              className={cn(
                "h-full w-full object-contain transition-transform duration-200",
                count > 0 && "scale-110 drop-shadow-lg",
                // Al tope, tocar ya no hace nada: atenuarlo lo dice sin agregar
                // un cartel ni un botón más.
                atMax && "opacity-50"
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              {topping.emoji ?? "🍕"}
            </div>
          )}

          {count > 0 && (
            <span className="absolute right-0 top-0 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-primary px-1.5 text-sm font-bold text-primary-foreground shadow-md">
              {count}
            </span>
          )}
        </div>

        <p
          className={cn(
            "text-sm font-semibold leading-tight",
            count > 0 ? "text-primary" : "text-foreground"
          )}
        >
          {topping.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {topping.pricePerUnit > 0
            ? `₡${topping.pricePerUnit.toLocaleString("es-CR")} / u.`
            : "Incluido"}
        </p>
      </button>

      {count > 0 && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar una porción de ${topping.name}`}
          className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-md transition active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function OptionGrid({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string; detail: string; imageUrl?: string | null }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center active:scale-95",
              selected === opt.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
          >
            {opt.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={squareImage(opt.imageUrl)}
                alt={opt.label}
                className="w-28 h-28 object-contain"
              />
            ) : (
              <div className="w-28 h-28 rounded-lg bg-muted flex items-center justify-center text-4xl">
                🍕
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{opt.label}</p>
              <p className={cn(
                "text-xs",
                selected === opt.id ? "text-primary" : "text-muted-foreground"
              )}>
                {opt.detail}
              </p>
            </div>
            {selected === opt.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
