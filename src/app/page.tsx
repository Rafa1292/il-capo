import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Bike, Clock, Flame, Leaf, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-10 py-4">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center gap-5 pt-4 text-center">
        <Image
          src="/logo.png"
          alt="il Capo Pizzería"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Pizzería artesanal
        </p>
        {/* Decorative rule */}
        <div className="flex items-center gap-3 w-44">
          <span className="flex-1 border-t border-border" />
          <span className="text-primary/60 text-[10px]">✦</span>
          <span className="flex-1 border-t border-border" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
          Masa de fermentación lenta, horno de leña
          y los mejores ingredientes
        </p>
        <Link href="/menu">
          <Button className="h-11 px-8 text-sm bg-primary hover:bg-primary/90 gap-2 rounded-full font-semibold tracking-wide">
            <UtensilsCrossed className="h-4 w-4" />
            Ver el menú
          </Button>
        </Link>
      </section>

      {/* ── Modos de entrega ── */}
      <section className="flex items-start justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-foreground/50" />
          </div>
          <p className="text-xs font-semibold">Para recoger</p>
          <p className="text-xs text-muted-foreground">~25 min</p>
        </div>
        <div className="w-px self-stretch bg-border mt-2" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Bike className="h-5 w-5 text-foreground/50" />
          </div>
          <p className="text-xs font-semibold">A domicilio</p>
          <p className="text-xs text-muted-foreground">~50 min</p>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── Nuestra cocina ── */}
      <section className="space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Nuestra cocina
        </p>
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <Flame className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Horno de leña</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                Cocción a alta temperatura para una corteza perfectamente crujiente
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Leaf className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Ingredientes frescos</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                Selección diaria de productos de temporada y máxima calidad
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Tradición napolitana</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                Masa de 48 h de fermentación con recetas auténticas
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── Horario ── */}
      <section className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Horario
        </p>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lunes – Viernes</span>
            <span className="font-medium tabular-nums">12:00 – 23:00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sábado</span>
            <span className="font-medium tabular-nums">12:00 – 00:00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Domingo</span>
            <span className="font-medium tabular-nums">13:00 – 22:00</span>
          </div>
        </div>
      </section>

    </div>
  );
}
