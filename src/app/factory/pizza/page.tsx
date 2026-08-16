import { redirect } from "next/navigation";
import { nicoGet } from "@/lib/nico";
import { currentLocation } from "@/lib/current-location";
import { PizzaBuilder } from "@/components/factory/pizza-builder";
import type { Location } from "@/lib/locations";
import type { PizzaBuilderData } from "@/types";

/**
 * Depende de la cookie de sede: cada sucursal es un tenant distinto en nico y
 * tiene sus propios tamaños, masas, salsas y toppings. Por eso es dinámica,
 * igual que `/api/pizza-builder`.
 *
 * Antes era estática con ISR y pedía los datos SIN indicar la sede. Con una
 * sola configurada `resolveLocation()` la adivinaba y funcionaba; al abrir la
 * segunda dejó de haber una respuesta obvia, la llamada empezó a lanzar
 * `LocationRequiredError` y la página quedó congelada en "no disponible".
 */
export const dynamic = "force-dynamic";

async function getPizzaBuilderData(location: Location): Promise<PizzaBuilderData | null> {
  // Sin atrapar el error a propósito: si nico se cae, que lo muestre
  // `app/error.tsx` con su botón de reintentar, en vez de decirle al cliente
  // que el armador "no existe" y que se vaya.
  const json = await nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder", {
    revalidate: 60,
    location,
  });
  return json.data ?? null;
}

export default async function PizzaBuilderPage() {
  // Sin sede no hay nada que armar: los tamaños y los precios son de un tenant
  // concreto. La portada es la que pregunta cuál.
  const location = await currentLocation();
  if (!location) redirect("/");

  const data = await getPizzaBuilderData(location);

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">El pizza builder no está disponible en este momento.</p>
      </div>
    );
  }

  return <PizzaBuilder data={data} />;
}
