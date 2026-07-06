"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary global: cualquier throw no manejado en una página cae aquí
// en vez de en la pantalla genérica de Next (fea y en inglés).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center px-4">
      <CloudOff className="h-16 w-16 text-muted-foreground" />
      <div>
        <h2 className="text-xl font-bold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          No pudimos cargar esta sección. Suele ser algo momentáneo.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} className="bg-primary hover:bg-primary/90">
          Reintentar
        </Button>
        <Link href="/">
          <Button variant="outline">Ir al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
