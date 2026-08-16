import Link from "next/link";
import { Clock, Leaf, Wheat, Flame } from "lucide-react";
import { SCHEDULE, formatMinutes } from "@/lib/schedule";

const KITCHEN = [
  {
    icon: Wheat,
    title: "Masa artesanal",
    detail: "Amasada a mano cada día, sin conservantes",
  },
  {
    icon: Leaf,
    title: "Ingredientes frescos",
    detail: "Selección diaria de productos de temporada y máxima calidad",
  },
  {
    icon: Flame,
    title: "Hecho al momento",
    detail: "Cada pizza se arma y hornea cuando haces tu pedido",
  },
];

/** Cierre de la portada: quiénes somos y el horario completo, debajo de la carta. */
export function AboutFooter() {
  return (
    <div className="mt-14 space-y-10 border-t border-border pt-10">
      <section className="space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Nuestra cocina
        </p>
        <div className="space-y-5">
          {KITCHEN.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-start gap-4">
              <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Horario
        </p>
        <div className="space-y-3 text-sm">
          {SCHEDULE.map((block) => (
            <div key={block.label} className="flex justify-between">
              <span className="text-muted-foreground">{block.label}</span>
              <span className="font-medium tabular-nums">
                {formatMinutes(block.open)} – {formatMinutes(block.close)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Las legales van acá abajo y no en el menú de navegación: casi nadie las
          busca, pero tienen que estar a un clic desde cualquier página —Google
          las pide para publicar el login, y el cliente para saber qué se guarda
          de él. */}
      <section className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-6 text-xs text-muted-foreground">
        <Link href="/privacidad" className="underline underline-offset-2 hover:text-foreground">
          Privacidad
        </Link>
        <Link href="/terminos" className="underline underline-offset-2 hover:text-foreground">
          Términos y condiciones
        </Link>
      </section>
    </div>
  );
}
