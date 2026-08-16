import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, P, Section } from "@/components/legal/legal-page";
import { LEGAL_UPDATED, CONTACT_LINE } from "@/lib/legal";
import { SCHEDULE, formatMinutes } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Cómo funcionan los pedidos en línea de il Capo: aceptación, precios, envíos, pagos con tarjeta y cancelaciones.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updated={LEGAL_UPDATED}>
      <P>
        Estas condiciones aplican a los pedidos hechos por este sitio a{" "}
        <strong>il Capo Pizzería</strong> (Grecia y San Ramón, Alajuela, Costa
        Rica). Al confirmar un pedido las estás aceptando.
      </P>

      <Section title="Cómo funciona un pedido">
        <P>
          Confirmar el pedido en el sitio no es todavía una venta cerrada: es una
          solicitud. El local la revisa y la acepta o la rechaza según si tiene
          los productos y si puede llegar a tu dirección.
        </P>
        <List
          items={[
            <>
              <strong>Si se acepta</strong>, entra a cocina y podés seguir su
              estado desde el enlace de tu pedido.
            </>,
            <>
              <strong>Si se rechaza</strong>, te avisamos y no se te cobra nada.
              Si ya habías pagado con tarjeta, el monto retenido se libera.
            </>,
          ]}
        />
      </Section>

      <Section title="Pagos con tarjeta">
        <P>
          Los pagos con tarjeta los procesa <strong>Tilopay</strong>. Nosotros no
          recibimos ni guardamos los datos de tu tarjeta.
        </P>
        <P>
          El cobro tiene dos momentos: al pagar se <strong>autoriza</strong> el
          monto —tu banco lo retiene, pero todavía no te lo cobra— y solo se{" "}
          <strong>cobra de verdad</strong> cuando el local acepta el pedido. Si
          lo rechaza, la retención se libera. El plazo en que el dinero vuelve a
          quedar disponible lo define tu banco, no nosotros: suele tardar unos
          días.
        </P>
        <P>
          Nunca se cobra un monto distinto al que viste al confirmar: el total se
          vuelve a calcular en el servidor y, si no coincide, el pedido se
          rechaza en vez de cobrarse.
        </P>
      </Section>

      <Section title="Precios y disponibilidad">
        <P>
          Los precios que ves son los del menú de la sede que elegiste, en
          colones e impuestos incluidos. Pueden cambiar sin aviso, y lo que vale
          es el precio mostrado al momento de confirmar. Un producto puede
          agotarse entre que armás el pedido y que el local lo revisa; en ese caso
          te contactamos o se rechaza el pedido.
        </P>
        <P>
          Las fotos son ilustrativas: la presentación real puede variar.
        </P>
      </Section>

      <Section title="Sedes y zona de entrega">
        <P>
          Cada sede tiene su propia carta, sus propios precios y su propia zona de
          entrega. El pedido se prepara y se entrega desde la sede que elegiste al
          entrar.
        </P>
        <P>
          El costo del envío depende de la distancia entre el local y el punto que
          marcaste. Si la dirección queda fuera de la zona de cobertura, no
          podemos llevarlo, pero sí podés pedirlo para recoger.
        </P>
      </Section>

      <Section title="Horario">
        <P>
          Se reciben pedidos dentro del horario de atención. Fuera de él el sitio
          te deja ver la carta, pero no procesa pedidos.
        </P>
        <List
          items={SCHEDULE.map((b) => (
            <>
              <strong>{b.label}:</strong> {formatMinutes(b.open)} a{" "}
              {formatMinutes(b.close)}
            </>
          ))}
        />
        <P>
          Los tiempos de entrega que mostramos son estimados y dependen de la
          carga de la cocina y del tránsito.
        </P>
      </Section>

      <Section title="Cancelaciones y reclamos">
        <P>
          Un pedido ya aceptado entra a cocina de inmediato, así que no se puede
          cancelar desde el sitio. Si necesitás cancelarlo o cambiarlo,
          llamanos cuanto antes: si todavía no empezó a prepararse, lo
          resolvemos.
        </P>
        <P>
          Si algo llegó mal, incompleto o en mal estado, avisanos el mismo día y
          lo reponemos o te devolvemos el dinero. {CONTACT_LINE}
        </P>
      </Section>

      <Section title="Alergias e ingredientes">
        <P>
          Preparamos todo en una cocina donde se manipulan gluten, lácteos,
          huevo, pescado y frutos secos, así que no podemos garantizar la ausencia
          total de trazas. Si tenés una alergia, escribilo en las notas del pedido
          y consultanos antes de ordenar.
        </P>
      </Section>

      <Section title="Tu cuenta">
        <P>
          La cuenta sirve para no volver a escribir tus datos en cada pedido. Sos
          responsable de lo que se pida desde tu sesión, así que no la dejés
          abierta en un dispositivo compartido. Podés cerrar sesión cuando querás
          desde tu cuenta.
        </P>
        <P>
          El enlace para seguir un pedido incluye un código de acceso: quien tenga
          ese enlace puede ver el pedido. No lo compartas con quien no deba verlo.
        </P>
      </Section>

      <Section title="Uso del sitio">
        <P>
          El contenido del sitio —marca, logo, fotos y textos— es de il Capo
          Pizzería. No se puede usar sin permiso. Tampoco está permitido hacer
          pedidos falsos, automatizar peticiones ni intentar interferir con el
          funcionamiento del servicio.
        </P>
      </Section>

      <Section title="Ley aplicable">
        <P>
          Estas condiciones se rigen por las leyes de Costa Rica, incluida la Ley
          N.º 7472 de Promoción de la Competencia y Defensa Efectiva del
          Consumidor.
        </P>
      </Section>

      <Section title="Privacidad">
        <P>
          El tratamiento de tus datos se explica en la{" "}
          <Link
            href="/privacidad"
            className="underline underline-offset-2 hover:text-foreground"
          >
            política de privacidad
          </Link>
          .
        </P>
      </Section>
    </LegalPage>
  );
}
