import { notFound } from "next/navigation";
import { MenuView } from "@/components/menu/menu-view";
import { RememberLocation } from "@/components/menu/remember-location";
import { findLocation, getLocations, hasMultipleLocations } from "@/lib/locations";

export const revalidate = 60;

/**
 * La carta de una sede: /grecia, /san-ramon.
 *
 * Cada una se prerenderiza y cachea aparte, así el QR de cada local lleva
 * directo a su propia carta.
 */
export function generateStaticParams() {
  return getLocations().map((l) => ({ sede: l.slug }));
}

export default async function SedePage({ params }: { params: Promise<{ sede: string }> }) {
  const { sede } = await params;
  const location = findLocation(sede);
  if (!location) notFound();

  return (
    <>
      {/* Entrar por la URL de una sede la deja elegida para el resto del flujo
          (carrito, checkout, pedido), que no lleva la sede en la dirección. */}
      <RememberLocation slug={location.slug} />
      <MenuView location={location} showLocationName={hasMultipleLocations()} />
    </>
  );
}
