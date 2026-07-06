import { nicoGet } from "@/lib/nico";
import { PizzaBuilder } from "@/components/factory/pizza-builder";
import type { PizzaBuilderData } from "@/types";

// ⚠️ No atrapar errores: con ISR, si la revalidación falla Next sirve la última
// versión buena. El error de primera carga lo maneja app/error.tsx.
async function getPizzaBuilderData(): Promise<PizzaBuilderData | null> {
  const json = await nicoGet<{ data: PizzaBuilderData }>("/api/public/pizza-builder");
  return json.data ?? null;
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
