import { contactPhone, CUISINE, locationInfo, PRICE_RANGE } from "@/lib/business";
import { WHATSAPP_URL } from "@/lib/contact";
import { absoluteUrl, openingHoursSpecification, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Location } from "@/lib/locations";
import type { Schedule } from "@/lib/schedule";

/**
 * Datos estructurados (JSON-LD).
 *
 * Es lo que le permite a Google entender que esto no es una página cualquiera
 * sino un restaurante con dirección, horario y teléfono: de ahí salen el panel
 * lateral, el "abierto ahora" y aparecer en "pizza cerca de mí". Sin esto el
 * buscador solo ve texto suelto.
 *
 * El horario es el mismo que pinta el pie de la carta —una sola consulta a
 * nico, compartida— así que lo que declaramos y lo que ve el cliente no pueden
 * divergir.
 */

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Los datos son estáticos y nuestros, pero escapamos `<` igual: un `</script>`
      // dentro de un string cerraría la etiqueta antes de tiempo.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Ficha del local: una por sede. */
export function RestaurantJsonLd({
  location,
  schedule,
}: {
  location: Location;
  schedule: Schedule;
}) {
  const info = locationInfo(location.slug);
  // Una sede sin datos físicos cargados no publica ficha: un `Restaurant` sin
  // dirección no sirve para nada y Google lo marca como incompleto.
  if (!info) return null;

  const url = absoluteUrl(`/${location.slug}`);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "@id": `${url}#restaurant`,
        name: `${SITE_NAME} — ${location.name}`,
        url,
        image: absoluteUrl("/og.png"),
        logo: absoluteUrl("/icon-512.png"),
        telephone: contactPhone(info),
        priceRange: PRICE_RANGE,
        servesCuisine: CUISINE,
        currenciesAccepted: "CRC",
        address: {
          "@type": "PostalAddress",
          streetAddress: info.streetAddress,
          addressLocality: info.locality,
          addressRegion: info.region,
          addressCountry: "CR",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: info.latitude,
          longitude: info.longitude,
        },
        hasMap: `https://www.google.com/maps/search/?api=1&query=${info.latitude},${info.longitude}`,
        openingHoursSpecification: openingHoursSpecification(schedule),
        // Lo que de verdad ofrece la página: pedir. Habilita el botón de pedido
        // en los resultados de Google.
        potentialAction: {
          "@type": "OrderAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: url,
            inLanguage: "es-CR",
            actionPlatform: [
              "https://schema.org/DesktopWebPlatform",
              "https://schema.org/MobileWebPlatform",
            ],
          },
          deliveryMethod: [
            "https://schema.org/OnSitePickup",
            "https://schema.org/ParcelService",
          ],
        },
        acceptsReservations: false,
        sameAs: [WHATSAPP_URL],
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
      }}
    />
  );
}

/** La marca, para la portada. Las sedes cuelgan de acá. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/icon-512.png"),
        image: absoluteUrl("/og.png"),
        sameAs: [WHATSAPP_URL],
      }}
    />
  );
}
