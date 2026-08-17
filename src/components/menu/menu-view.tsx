import Image from "next/image";
import Link from "next/link";
import { nicoGet, isBuildPrerender } from "@/lib/nico";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { CategoryNav } from "@/components/menu/category-nav";
import { OpeningStatus } from "@/components/menu/opening-status";
import { AboutFooter } from "@/components/menu/about-footer";
import { DragScroller } from "@/components/ui/drag-scroller";
import { PausedBanner } from "@/components/menu/paused-banner";
import { RestaurantJsonLd } from "@/components/seo/json-ld";
import { locationInfo } from "@/lib/business";
import { getStoreStatus } from "@/lib/store-status";
import type { Location } from "@/lib/locations";
import type { MenuCategory } from "@/types";

// ⚠️ No atrapar errores en runtime: con ISR, si la revalidación falla Next sigue
// sirviendo la última versión buena del menú. Atrapar y devolver [] cachearía
// "menú no disponible" 60s para todos aunque nico vuelva en segundos.
// La única excepción es el prerender del build: ver isBuildPrerender().
async function getMenu(location: Location): Promise<MenuCategory[]> {
  try {
    const json = await nicoGet<{ data: MenuCategory[] }>("/api/public/menu", {
      revalidate: 60,
      location,
    });
    return json.data ?? [];
  } catch (err) {
    if (isBuildPrerender()) return [];
    throw err;
  }
}

interface Props {
  location: Location;
  /** Nombre de la sede bajo el logo. Solo cuando hay más de una. */
  showLocationName?: boolean;
}

/**
 * La carta. La usan tanto `/` (cuando hay una sola sede) como `/[sede]`.
 *
 * Cada sede es un tenant distinto en nico: catálogo y precios propios, y su
 * propia entrada de caché.
 */
export async function MenuView({ location, showLocationName }: Props) {
  // En paralelo: el estado no depende de la carta y esperarlo en serie le
  // agregaría su latencia a la primera pintura de la página.
  const [categories, status] = await Promise.all([
    getMenu(location),
    getStoreStatus(location),
  ]);

  const info = locationInfo(location.slug);
  const donde = info?.locality ?? location.name;

  return (
    <div>
      {/* La ficha de Google se arma acá, con el mismo horario que se pinta
          abajo: si viviera en la página serían dos consultas y podrían quedar
          diciendo cosas distintas. */}
      <RestaurantJsonLd location={location} schedule={status.schedule} />

      {/*
        La página no tenía encabezado: arrancaba directo en el <h2> de cada
        categoría, así que ni un buscador ni un lector de pantalla sabían de qué
        trataba. Va oculto a la vista porque el diseño de la cabecera es el
        logo; el texto es el mismo que describe la página, no es relleno.
      */}
      <h1 className="sr-only">
        il Capo Pizzería en {donde} — carta y pedidos en línea
      </h1>

      {/* Cabecera — logo y si están abiertos ahora mismo */}
      <div className="flex items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="il Capo Pizzería"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
          {showLocationName && (
            <Link
              href="/?cambiar=1"
              className="group flex flex-col leading-tight"
              aria-label={`Sede ${location.name}. Tocá para cambiar`}
            >
              <span className="text-sm font-semibold tracking-tight group-hover:text-primary">
                {location.name}
              </span>
              <span className="text-[10px] text-muted-foreground underline underline-offset-2">
                cambiar sede
              </span>
            </Link>
          )}
        </div>
        <OpeningStatus schedule={status.schedule} />
      </div>

      <PausedBanner status={status} />

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-muted-foreground">El menú no está disponible en este momento.</p>
          <p className="text-sm text-muted-foreground">Por favor intenta nuevamente más tarde.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 pb-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Nuestra carta
            </p>
            <div className="flex items-center gap-3 w-40">
              <span className="flex-1 border-t border-border" />
              <span className="text-primary/60 text-[10px]">✦</span>
              <span className="flex-1 border-t border-border" />
            </div>
          </div>

          <CategoryNav categories={categories} />

          <div className="space-y-8 mt-5">
            {categories.map((category) => (
              <section key={category.id} id={`cat-${category.id}`}>
                {/* Divisor ornamental centrado — estilo carta italiana */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-[0.15em] text-foreground">
                    <span className="text-[9px] text-primary/70">✦</span>
                    {category.name}
                    <span className="text-[9px] text-primary/70">✦</span>
                  </h2>
                  <span className="h-px flex-1 bg-border" />
                </div>
                {/* Carrusel horizontal — se arrastra con el mouse en escritorio */}
                <DragScroller className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
                  {category.items.map((item) => (
                    <div key={item.id} className="w-72 shrink-0 snap-start">
                      <MenuItemCard item={item} />
                    </div>
                  ))}
                </DragScroller>
              </section>
            ))}
          </div>
        </>
      )}

      <AboutFooter schedule={status.schedule} />
    </div>
  );
}
