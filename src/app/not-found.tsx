import Link from "next/link";
import { PizzaIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center px-4">
      <PizzaIcon className="h-16 w-16 text-muted-foreground" />
      <div>
        <h2 className="text-xl font-bold">Página no encontrada</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          El enlace que seguiste no existe o cambió de lugar.
        </p>
      </div>
      <Link href="/">
        <Button className="bg-primary hover:bg-primary/90">Ir al inicio</Button>
      </Link>
    </div>
  );
}
