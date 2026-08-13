import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface Props {
  locations: { slug: string; name: string }[];
}

/**
 * Elegir sede antes de ver la carta.
 *
 * Hace falta preguntar y no adivinar: cada sede tiene su propio catálogo,
 * precios y zonas de entrega. Mostrar la carta equivocada termina en un pedido
 * que la cocina de esa sucursal no puede hacer.
 */
export function LocationPickerScreen({ locations }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 text-center">
      <Image
        src="/logo.png"
        alt="il Capo Pizzería"
        width={110}
        height={110}
        className="object-contain"
        priority
      />

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Pizzería artesanal
        </p>
        <h1 className="text-xl font-bold tracking-tight">¿De cuál sede pedís?</h1>
        <p className="text-sm text-muted-foreground">
          Cada una tiene su propia carta y su zona de entrega.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {locations.map((location) => (
          <Link
            key={location.slug}
            href={`/${location.slug}`}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-border px-5 py-4 font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            <MapPin className="h-4 w-4" />
            {location.name}
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Podés cambiarla después desde el menú.
      </p>
    </div>
  );
}
