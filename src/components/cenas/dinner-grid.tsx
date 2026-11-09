"use client";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { MessageCircle, X } from "lucide-react";
import {
  DINNERS,
  DINNER_SIDE_LIST,
  PICKUP_TEXT,
  dinnerWhatsAppUrl,
  type ChristmasDinner,
} from "@/lib/christmas-dinners";

const HISTORY_KEY = "dinnerDetail";

/**
 * Cambia el estado dentro de una View Transition: la foto de la tarjeta crece
 * hasta la vista completa y al cerrar se encoge de vuelta a su lugar. Sin
 * soporte del navegador, cambia sin animación.
 */
function withTransition(update: () => void): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

const transitionName = (slug: string) => `cena-${slug}`;

export function DinnerGrid({ reservationsOpen }: { reservationsOpen: boolean }) {
  const [selected, setSelected] = useState<ChristmasDinner | null>(null);

  // Abrir agrega una entrada al historial: "atrás" (o la X, que hace back)
  // la saca y la vista vuelve a la tarjeta.
  const openDinner = (dinner: ChristmasDinner) => {
    window.history.pushState({ ...(window.history.state ?? {}), [HISTORY_KEY]: true }, "");
    withTransition(() => setSelected(dinner));
  };
  const close = useCallback(() => {
    const ours = Boolean((window.history.state as Record<string, unknown> | null)?.[HISTORY_KEY]);
    if (ours) window.history.back();
    else withTransition(() => setSelected(null));
  }, []);

  useEffect(() => {
    const onPop = () => withTransition(() => setSelected(null));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected, close]);

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {DINNERS.map((dinner) => (
          <article key={dinner.slug} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => openDinner(dinner)}
              className="block w-full cursor-zoom-in"
              aria-label={`Ver detalles de ${dinner.name}`}
            >
              <Image
                src={dinner.image}
                alt={`${dinner.name}, cena navideña de il Capo`}
                width={1122}
                height={1402}
                sizes="(min-width: 640px) 320px, 100vw"
                className="h-auto w-full"
                // Mientras está abierta, el nombre lo lleva la foto grande.
                style={{ viewTransitionName: selected?.slug === dinner.slug ? undefined : transitionName(dinner.slug) }}
              />
            </button>
            <div className="p-4">
              <h2 className="text-lg font-bold">{dinner.name}</h2>
              <p className="text-sm text-muted-foreground">{dinner.serves}</p>
              <p className="mt-2">
                <span className="text-xl font-bold">{dinner.price}</span>{" "}
                <span className="text-sm text-muted-foreground">{dinner.priceNote}</span>
              </p>
              <p className="text-sm text-muted-foreground">{dinner.alonePrice}</p>
              {dinner.note && <p className="mt-1 text-sm font-medium">{dinner.note}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openDinner(dinner)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Ver detalles
                </button>
                {reservationsOpen && (
                  <a
                    href={dinnerWhatsAppUrl(dinner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#1f7a3a] px-4 py-2 text-sm font-semibold text-[#1f7a3a] hover:bg-[#1f7a3a]/10"
                  >
                    <MessageCircle className="h-4 w-4" /> Reservar
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <DinnerDetail dinner={selected} reservationsOpen={reservationsOpen} onClose={close} />
      )}
    </>
  );
}

function DinnerDetail({
  dinner,
  reservationsOpen,
  onClose,
}: {
  dinner: ChristmasDinner;
  reservationsOpen: boolean;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dinner.name}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-background"
    >
      <div className="mx-auto w-full max-w-2xl pb-10">
        <div className="relative">
          <Image
            src={dinner.image}
            alt={`${dinner.name}, cena navideña de il Capo`}
            width={1122}
            height={1402}
            sizes="(max-width: 672px) 100vw, 672px"
            className="h-auto w-full"
            style={{ viewTransitionName: transitionName(dinner.slug) }}
            priority
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-2xl font-bold leading-tight">{dinner.name}</h2>
            <p className="text-muted-foreground">{dinner.serves}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p>
              <span className="text-2xl font-bold">{dinner.price}</span>{" "}
              <span className="text-sm text-muted-foreground">{dinner.priceNote}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{dinner.alonePrice}</p>
            {dinner.note && <p className="mt-1 text-sm font-medium">{dinner.note}</p>}
          </div>

          <div className="rounded-xl border border-[#b8912f]/40 bg-[#b8912f]/10 px-4 py-3">
            <p className="text-sm font-semibold">Con acompañamientos incluye:</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
              {DINNER_SIDE_LIST.map((side) => (
                <li key={side}>• {side}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Se retira el {PICKUP_TEXT}. Se confirma con el 40 % de adelanto por SINPE.
          </p>

          {reservationsOpen ? (
            <a
              href={dinnerWhatsAppUrl(dinner)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f7a3a] px-4 py-3 font-semibold text-white hover:bg-[#19652f]"
            >
              <MessageCircle className="h-5 w-5" /> Reservar esta cena
            </a>
          ) : (
            <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
              Las reservas de este año ya cerraron.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
