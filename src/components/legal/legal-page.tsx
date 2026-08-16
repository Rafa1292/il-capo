import Link from "next/link";

/**
 * Envoltorio de las páginas legales (privacidad, términos).
 *
 * Existe para que las dos se vean igual y para no repetir la tipografía en cada
 * una: son textos largos, y sin un ritmo de títulos y párrafos definido en un
 * solo lugar terminan divergiendo a la primera corrección.
 */

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="pb-10">
      <header className="border-b border-border pb-5 mb-7">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground mt-2">
          Última actualización: {updated}
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed">{children}</div>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        <Link href="/" className="underline underline-offset-2 hover:text-foreground">
          Volver a la carta
        </Link>
      </footer>
    </article>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 text-muted-foreground">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="text-primary/60 shrink-0 mt-0.5">✦</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Tabla simple; en móvil scrollea sola en vez de romper el ancho de la página. */
export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[30rem] text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="text-left font-semibold py-2 pr-4 align-bottom">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 align-top">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
