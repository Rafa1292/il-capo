import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Bike } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-10 py-8">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 text-center">
        <Image
          src="/logo.png"
          alt="il Capo Pizzería"
          width={160}
          height={160}
          className="object-contain drop-shadow-lg"
          priority
        />
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">
            <span className="italic text-primary">il</span>
            {" "}Capo
          </h1>
          <p className="text-muted-foreground text-lg">
            Pizzas artesanales hechas con pasión
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/menu">
          <Button className="w-full h-12 text-base bg-primary hover:bg-primary/90 gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Ver el menú
          </Button>
        </Link>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
        <div className="border rounded-xl p-4 text-center space-y-2">
          <UtensilsCrossed className="h-7 w-7 mx-auto text-primary" />
          <p className="text-sm font-semibold">Para recoger</p>
          <p className="text-xs text-muted-foreground">Listo en 20–30 min</p>
        </div>
        <div className="border rounded-xl p-4 text-center space-y-2">
          <Bike className="h-7 w-7 mx-auto text-primary" />
          <p className="text-sm font-semibold">A domicilio</p>
          <p className="text-xs text-muted-foreground">Entrega en 40–60 min</p>
        </div>
      </div>
    </div>
  );
}
