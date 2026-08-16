import type { Metadata } from "next";

/** Área privada del cliente: direcciones y datos guardados. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
