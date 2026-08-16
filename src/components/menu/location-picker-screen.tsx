import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { absoluteUrl } from "@/lib/site";

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
        {/* Nombra la app y enumera lo que hace. Google exige que la portada
            "describa completamente la funcionalidad de la app": una frase de
            marca ("pizza artesanal") no cuenta como descripción. */}
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          il Capo Pizzería es la aplicación de pedidos en línea de nuestras
          pizzerías en Grecia y San Ramón, Costa Rica. Acá podés ver la carta,
          armar tu pizza, hacer el pedido y pagarlo con tarjeta, para que te lo
          llevemos a domicilio o lo dejemos listo para recoger.
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

      {/* Para qué sirve la cuenta y QUÉ datos se toman de ella.
          Google no pide solo que digamos que hay login: pide explicar con
          transparencia para qué se solicitan los datos del usuario. Decir
          "podés entrar con Google" no cumple; hay que nombrar el dato y el uso.
          Al cliente le sirve igual, que es quien se pregunta qué le van a ver. */}
      <div className="mx-auto max-w-sm space-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
        <p>
          Para pedir podés entrar con tu cuenta de Google o con tu correo. Solo
          usamos tu <strong>nombre y tu correo electrónico</strong> para
          identificarte, guardar tus datos de entrega y dejarte ver el estado de
          tus pedidos. No accedemos a ninguna otra información de tu cuenta ni
          la compartimos con terceros con fines publicitarios.
        </p>
      </div>

      {/*
        Absolutos y no relativos a propósito. Google compara el enlace de la
        política de privacidad de esta página contra la URL configurada en la
        pantalla de consentimiento, y lo hace como texto: un href="/privacidad"
        no coincide con "https://www.ilcapopixa.com/privacidad" y la
        verificación se rechaza sin decir por qué.
      */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <a
          href={absoluteUrl("/privacidad")}
          className="underline underline-offset-2 hover:text-foreground"
        >
          Política de privacidad
        </a>
        <a
          href={absoluteUrl("/terminos")}
          className="underline underline-offset-2 hover:text-foreground"
        >
          Términos y condiciones
        </a>
      </div>
    </div>
  );
}
