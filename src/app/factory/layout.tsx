import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * El armador es una herramienta, no contenido: lo que muestra depende de la
 * sede elegida en la cookie, así que un rastreador (que no trae ninguna) vería
 * algo distinto de lo que ve el cliente.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/**
 * Desactivado (oct-2026): el armador de pizzas no se ofrece; quien llegue por un
 * link viejo va a la carta. Para reactivarlo: ponerlo en `true` y volver a
 * poner el ítem "Factory" en `bottom-nav.tsx`.
 */
const FACTORY_ENABLED = false;

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
  if (!FACTORY_ENABLED) redirect("/");
  return children;
}
