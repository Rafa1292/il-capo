import Link from "next/link";
import { Pizza, Beef, ChefHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FOOD_TYPES = [
  {
    id: "pizza",
    label: "Pizza",
    description: "Arma tu pizza desde cero",
    icon: Pizza,
    href: "/factory/pizza",
    available: true,
  },
  {
    id: "hamburguesa",
    label: "Hamburguesa",
    description: "Próximamente",
    icon: Beef,
    href: null,
    available: false,
  },
  {
    id: "pasta",
    label: "Pasta",
    description: "Próximamente",
    icon: ChefHat,
    href: null,
    available: false,
  },
];

export default function FactoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Factory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Construye tu comida a tu gusto
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FOOD_TYPES.map((type) => {
          const Icon = type.icon;
          const card = (
            <div
              className={cn(
                "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all",
                type.available
                  ? "border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 active:scale-95 cursor-pointer"
                  : "border-border bg-muted/30 opacity-60 cursor-not-allowed"
              )}
            >
              {!type.available && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                  Pronto
                </Badge>
              )}
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                type.available ? "bg-primary/10" : "bg-muted"
              )}>
                <Icon className={cn("h-6 w-6", type.available ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </div>
            </div>
          );

          return type.href ? (
            <Link key={type.id} href={type.href}>{card}</Link>
          ) : (
            <div key={type.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
