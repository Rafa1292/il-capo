import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import {
  DINNERS,
  DINNER_SIDE_LIST,
  PICKUP_TEXT,
  dinnerReservationsOpen,
  dinnerWhatsAppUrl,
} from "@/lib/christmas-dinners";

// Se revalida cada hora: el 21 de diciembre la página pasa sola a "reservas cerradas".
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cenas navideñas",
  description: `Lomo relleno, pierna de cerdo y costilla BBQ para retirar en Grecia el ${PICKUP_TEXT.split(",")[0]}. Reservá por WhatsApp.`,
  alternates: { canonical: "/cenas" },
  openGraph: { images: ["/cenas/portada.jpg"] },
};

const STEPS = [
  "Escribinos por WhatsApp y elegí tu cena.",
  "Confirmá con el 40 % de adelanto por SINPE.",
  `Retirala el ${PICKUP_TEXT}.`,
];

export default function CenasPage() {
  const open = dinnerReservationsOpen();

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la carta
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Cenas navideñas</h1>
      <p className="mt-2 text-muted-foreground">Para retirar el {PICKUP_TEXT}.</p>

      <div className="mt-4 rounded-xl border border-[#b8912f]/40 bg-[#b8912f]/10 px-4 py-3">
        <p className="text-sm font-semibold">Acompañamientos:</p>
        <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
          {DINNER_SIDE_LIST.map((side) => (
            <li key={side}>• {side}</li>
          ))}
        </ul>
      </div>

      {open ? (
        <a
          href={dinnerWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f7a3a] px-4 py-3 font-semibold text-white hover:bg-[#19652f]"
        >
          <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
        </a>
      ) : (
        <p className="mt-5 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          Las reservas de este año ya cerraron. ¡Gracias por preferirnos!
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {DINNERS.map((dinner) => (
          <article key={dinner.slug} className="overflow-hidden rounded-xl border border-border bg-card">
            <Image
              src={dinner.image}
              alt={`${dinner.name}, cena navideña de il Capo`}
              width={1122}
              height={1402}
              sizes="(min-width: 640px) 320px, 100vw"
              className="h-auto w-full"
            />
            <div className="p-4">
              <h2 className="text-lg font-bold">{dinner.name}</h2>
              <p className="text-sm text-muted-foreground">{dinner.serves}</p>
              <p className="mt-2">
                <span className="text-xl font-bold">{dinner.price}</span>{" "}
                <span className="text-sm text-muted-foreground">{dinner.priceNote}</span>
              </p>
              <p className="text-sm text-muted-foreground">{dinner.alonePrice}</p>
              {open && (
                <a
                  href={dinnerWhatsAppUrl(dinner)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#1f7a3a] px-4 py-2 text-sm font-semibold text-[#1f7a3a] hover:bg-[#1f7a3a]/10"
                >
                  <MessageCircle className="h-4 w-4" /> Reservar esta cena
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-[#b8912f]/60 px-4 py-4 text-center">
        <p className="font-semibold">¿No querés acompañamientos?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No hay problema: te vendemos solo el plato fuerte. La costilla BBQ va siempre con
          acompañamientos.
        </p>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">¿Cómo reservar?</h2>
        <ol className="mt-3 space-y-2">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          Reservamos hasta el 20 de diciembre. ¿Otra fecha? Pedila con una semana de anticipación.
          Solo para retirar, no va por express.
        </p>
      </section>
    </main>
  );
}
