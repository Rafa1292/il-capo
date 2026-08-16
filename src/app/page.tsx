import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MenuView } from "@/components/menu/menu-view";
import { LocationPickerScreen } from "@/components/menu/location-picker-screen";
import { OrganizationJsonLd, RestaurantJsonLd } from "@/components/seo/json-ld";
import { defaultLocation, publicLocations } from "@/lib/locations";
import { currentLocation } from "@/lib/current-location";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * La portada.
 *
 * Con una sola sede es la carta, igual que siempre —los QR y links viejos que
 * apuntan a la raíz siguen funcionando—. Con varias, manda a la que el cliente
 * ya eligió, o le pregunta.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cambiar?: string }>;
}) {
  const only = defaultLocation();
  if (only) {
    return (
      <>
        <RestaurantJsonLd location={only} />
        <MenuView location={only} />
      </>
    );
  }

  // `?cambiar=1` fuerza el selector aunque ya haya una sede recordada: si no,
  // quien quisiera cambiarse quedaría rebotando a la que eligió la primera vez.
  const { cambiar } = await searchParams;
  if (!cambiar) {
    const chosen = await currentLocation();
    if (chosen) redirect(`/${chosen.slug}`);
  }

  // Un rastreador no trae cookie, así que esto es lo que ve siempre: la marca y
  // los enlaces a cada sede, que son las páginas que queremos que indexe.
  return (
    <>
      <OrganizationJsonLd />
      <LocationPickerScreen locations={publicLocations()} />
    </>
  );
}
