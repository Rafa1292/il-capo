import { nicoGet, isBuildPrerender } from "@/lib/nico";
import { PizzaBuilder } from "@/components/factory/pizza-builder";
import type { PizzaBuilderData } from "@/types";

// ⚠️ No atrapar errores en runtime: con ISR, si la revalidación falla Next sirve
// la última versión buena. El error de primera carga lo maneja app/error.tsx.
// La única excepción es el prerender del build: ver isBuildPrerender().
async function getPizzaBuilderData(): Promise<PizzaBuilderData | null> {
  try {
    const json = await nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder", {
      revalidate: 60,
    });
    return json.data ?? null;
  } catch (err) {
    if (isBuildPrerender()) return null;
    throw err;
  }
}

export const revalidate = 60;

export default async function PizzaBuilderPage() {
  const data = await getPizzaBuilderData();

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">El pizza builder no está disponible en este momento.</p>
      </div>
    );
  }

  return <PizzaBuilder data={data} />;
}
