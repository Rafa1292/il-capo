import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Clock, Leaf, Wheat, Flame } from "lucide-react";

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
        <Link href="/menu">
          <Button className="h-11 px-8 text-sm bg-primary hover:bg-primary/90 gap-2 rounded-full font-semibold tracking-wide">
            <UtensilsCrossed className="h-4 w-4" />
            Ver el menú
          </Button>
        </Link>
      </section>

      {/* ── Nuestra cocina ── */}
      <section className="space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Nuestra cocina
        </p>
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <Wheat className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Masa artesanal</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                Amasada a mano cada día, sin conservantes
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
            <Flame className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Hecho al momento</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                Cada pizza se arma y hornea cuando haces tu pedido
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
            <span className="text-muted-foreground">Lunes – Jueves</span>
            <span className="font-medium tabular-nums">11:00 – 20:30</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Viernes – Domingo</span>
            <span className="font-medium tabular-nums">11:00 – 21:30</span>
          </div>
        </div>
      </section>

    </div>
  );
}
