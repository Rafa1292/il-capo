import type { Metadata } from "next";

/** Paso de pago: no es contenido, y trae datos del cliente en el formulario. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
