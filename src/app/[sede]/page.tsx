import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuView } from "@/components/menu/menu-view";
import { RememberLocation } from "@/components/menu/remember-location";
import { RestaurantJsonLd } from "@/components/seo/json-ld";
import { locationInfo } from "@/lib/business";
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

/**
 * Título y descripción propios de cada sede.
 *
 * No es cosmético: las dos sedes sirven el MISMO catálogo (se copió de una a la
 * otra), así que con la metadata compartida Google las lee como contenido
 * duplicado, elige una y esconde la otra. El cantón en el título es además por
 * lo que la gente busca de verdad: "pizza en Grecia", no "il Capo".
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ sede: string }>;
}): Promise<Metadata> {
  const { sede } = await params;
  const location = findLocation(sede);
  if (!location) return {};

  const info = locationInfo(location.slug);
  const donde = info ? info.locality : location.name;
  const title = `Pizzería en ${donde}`;
  const description = info
    ? `Pizza artesanal en ${donde}: ${info.streetAddress}. Pedí en línea a domicilio o para recoger y armá tu pizza como querás.`
    : `Carta y pedidos en línea de il Capo ${location.name}. A domicilio o para recoger.`;

  const url = `/${location.slug}`;

  return {
    title,
    description,
    // Con la portada redirigiendo por cookie a una sede, sin canonical las tres
    // URLs compiten entre sí por el mismo contenido.
    alternates: { canonical: url },
    // Ojo: declarar `openGraph` acá REEMPLAZA el del layout, no lo completa.
    // Por eso se repiten type/locale/siteName: sin ellos la vista previa de la
    // página de sede saldría a medias.
    openGraph: {
      type: "website",
      locale: "es_CR",
      siteName: "il Capo Pizzería",
      title: `${title} — il Capo`,
      description,
      url,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — il Capo`,
      description,
      images: ["/og.png"],
    },
  };
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
      <RestaurantJsonLd location={location} />
      <MenuView location={location} showLocationName={hasMultipleLocations()} />
    </>
  );
}
