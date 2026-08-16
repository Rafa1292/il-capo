import { Clock, Leaf, Wheat, Flame } from "lucide-react";
import { SCHEDULE, formatMinutes } from "@/lib/schedule";
import { absoluteUrl } from "@/lib/site";

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

      {/*
        Qué es esto y qué datos se usan de la cuenta.
        Está repetido respecto del selector de sede a propósito: quien ya eligió
        sede queda con una cookie y, a partir de ahí, entrar a la raíz lo trae
        acá. Si esta información viviera solo en el selector, cualquiera con
        cookie —incluido un revisor de Google después de un clic— vería una
        carta de pizzas sin nada que explique la app ni el uso de sus datos.
      */}
      <section className="space-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">il Capo Pizzería</strong> es la
          aplicación de pedidos en línea de nuestras pizzerías en Grecia y San
          Ramón, Costa Rica. Acá podés ver la carta, armar tu pizza, hacer el
          pedido y pagarlo con tarjeta, para que te lo llevemos a domicilio o lo
          dejemos listo para recoger.
        </p>
        <p>
          Para pedir podés entrar con tu cuenta de Google o con tu correo. Solo
          usamos tu <strong>nombre y tu correo electrónico</strong> para
          identificarte, guardar tus datos de entrega y dejarte ver el estado de
          tus pedidos. No accedemos a ninguna otra información de tu cuenta ni la
          compartimos con terceros con fines publicitarios.
        </p>
        {/* Absolutos: Google compara este enlace, como texto, contra la URL
            configurada en la pantalla de consentimiento. Ver el mismo comentario
            en location-picker-screen.tsx. */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          <a
            href={absoluteUrl("/privacidad")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Política de privacidad
          </a>
          <a
            href={absoluteUrl("/terminos")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Términos y condiciones
          </a>
        </div>
      </section>
    </div>
  );
}
