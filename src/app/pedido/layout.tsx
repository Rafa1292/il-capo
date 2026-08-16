import type { Metadata } from "next";

/**
 * El seguimiento del pedido no se indexa nunca.
 *
 * La URL lleva un token firmado y la página muestra nombre, teléfono y
 * dirección de un cliente real. La página es un componente de cliente, así que
 * el `noindex` tiene que salir de un layout: `export const metadata` no existe
 * en un archivo con "use client".
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function PedidoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
