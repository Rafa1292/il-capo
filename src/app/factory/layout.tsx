import type { Metadata } from "next";

/**
 * El armador es una herramienta, no contenido: lo que muestra depende de la
 * sede elegida en la cookie, así que un rastreador (que no trae ninguna) vería
 * algo distinto de lo que ve el cliente.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
