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
 *
 * Esta pantalla es además la que ve cualquiera que llegue a la raíz sin cookie:
 * buscadores y el revisor de Google al validar el login. Por eso lleva el
 * nombre del negocio como TEXTO —no solo en el logo—, una frase que explica qué
 * se puede hacer acá y los enlaces legales. Sin eso, la verificación de Google
 * rechaza la app por "no se explica el propósito" y por no coincidir el nombre.
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

      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">il Capo Pizzería</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Pizza artesanal en Grecia y San Ramón. Mirá la carta, armá tu pedido y
          pagá en línea: te lo llevamos a domicilio o lo dejamos listo para
          recoger.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold">¿De cuál sede pedís?</h2>
          <p className="text-xs text-muted-foreground">
            Cada una tiene su propia carta y su zona de entrega.
          </p>
        </div>

        <div className="flex flex-col gap-3">
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

      {/* Para qué sirve la cuenta. Google pide que la página principal diga qué
          hace la app y por qué pide iniciar sesión; además le ahorra la duda al
          cliente, que es quien de verdad se pregunta para qué le piden entrar. */}
      <p className="mx-auto max-w-sm border-t border-border pt-6 text-xs text-muted-foreground">
        Podés entrar con tu cuenta de Google o con tu correo para no volver a
        escribir tus datos en cada pedido y seguir el estado de lo que pediste.
      </p>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link href="/privacidad" className="underline underline-offset-2 hover:text-foreground">
          Privacidad
        </Link>
        <Link href="/terminos" className="underline underline-offset-2 hover:text-foreground">
          Términos y condiciones
        </Link>
      </div>
    </div>
  );
}
