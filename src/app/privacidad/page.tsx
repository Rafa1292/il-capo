import type { Metadata } from "next";
import { LegalPage, List, P, Section, Table } from "@/components/legal/legal-page";
import { LEGAL_UPDATED, CONTACT_LINE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos pedimos al hacer un pedido en il Capo, para qué los usamos, con quién se comparten y cómo pedir que se borren.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated={LEGAL_UPDATED}>
      <P>
        Esta página explica qué datos pedimos cuando hacés un pedido en il Capo,
        para qué los usamos y con quién se comparten. Está escrita para que se
        entienda leyéndola una vez.
      </P>
      <P>
        El responsable del tratamiento es <strong>il Capo Pizzería</strong>, con
        locales en Grecia y San Ramón, Alajuela, Costa Rica. {CONTACT_LINE}
      </P>

      <Section title="Qué datos pedimos y para qué">
        <List
          items={[
            <>
              <strong>Para saber quién sos:</strong> tu correo electrónico. Si
              entrás con Google, recibimos de Google tu correo, tu nombre y tu
              foto de perfil. Si entrás con un código, solo tu correo.
            </>,
            <>
              <strong>Para prepararte el pedido:</strong> tu nombre, tu teléfono
              y lo que pediste, incluidas las notas que escribas.
            </>,
            <>
              <strong>Para llevártelo:</strong> tu dirección y, si elegís marcar
              el punto en el mapa, sus coordenadas. Solo aplica a los pedidos a
              domicilio.
            </>,
            <>
              <strong>Para cobrarte:</strong> el monto y una referencia del pago.
              Los datos de tu tarjeta se los das directamente a la pasarela de
              pago; <strong>nosotros nunca los vemos ni los guardamos</strong>.
            </>,
          ]}
        />
      </Section>

      <Section title="Qué queda en tu dispositivo y qué en nuestros servidores">
        <P>
          Esta distinción importa más de lo que parece:{" "}
          <strong>no tenemos una base de datos de clientes</strong>. Tu sesión es
          una cookie firmada en tu navegador, no un registro nuestro.
        </P>
        <List
          items={[
            <>
              <strong>Solo en tu dispositivo:</strong> tu teléfono, las
              direcciones que guardás, el carrito y el enlace a tu último pedido.
              Nunca se envían a ningún lado salvo cuando confirmás un pedido.
              Borrás todo cerrando sesión o limpiando los datos del navegador.
            </>,
            <>
              <strong>En el sistema del restaurante:</strong> los pedidos que
              confirmaste, con el nombre, el teléfono y la dirección de entrega.
              Es la misma información que quedaría anotada si pidieras por
              teléfono, y es la que la cocina necesita para prepararlo.
            </>,
          ]}
        />
      </Section>

      <Section title="Con quién se comparten">
        <P>
          Solo con quienes hacen falta para que el pedido llegue y el pago
          funcione. Ninguno los usa para otra cosa:
        </P>
        <Table
          head={["Servicio", "Para qué", "Qué recibe"]}
          rows={[
            ["Google", "Iniciar sesión", "Tu correo, nombre y foto (nos los da él, no al revés)"],
            ["Resend", "Enviar el código de acceso por correo", "Tu correo y el código"],
            ["Tilopay", "Cobrar con tarjeta", "Los datos de tu tarjeta y el monto"],
            ["OpenStreetMap", "Dibujar el mapa del checkout", "La zona del mapa que estás viendo"],
            ["WhatsApp (Meta)", "Verificar tu número al pagar en efectivo", "Tu número de teléfono"],
            ["Vercel", "Hospedar el sitio", "Datos técnicos de la conexión"],
          ]}
        />
      </Section>

      <Section title="Lo que no hacemos">
        <List
          items={[
            "No usamos analítica ni píxeles de seguimiento. El sitio no tiene ninguno instalado.",
            "No vendemos ni cedemos tus datos a terceros con fines comerciales.",
            "No armamos perfiles de consumo ni publicidad dirigida.",
            "No te mandamos correos promocionales por haber hecho un pedido.",
          ]}
        />
      </Section>

      <Section title="Cookies">
        <P>
          Todas son necesarias para que el sitio funcione. No hay cookies de
          publicidad ni de medición.
        </P>
        <Table
          head={["Cookie", "Para qué", "Cuánto dura"]}
          rows={[
            ["ilcapo_session", "Mantenerte con la sesión abierta", "90 días"],
            ["ilcapo_oauth_state", "Proteger el login con Google de un ataque CSRF", "10 minutos"],
            ["ilcapo_otp", "Validar el código que te llega por correo", "10 minutos"],
            ["il-capo-sede", "Recordar de cuál sede pedís", "6 meses"],
          ]}
        />
      </Section>

      <Section title="Tu ubicación">
        <P>
          El mapa del checkout puede pedirte permiso para usar tu ubicación. Es
          opcional: sirve para colocar el pin de entrega sin que tengas que
          buscarlo a mano, y podés arrastrarlo o escribir la dirección en su
          lugar. Las coordenadas se usan para calcular la distancia al local y el
          costo del envío. Si no das el permiso, el pedido funciona igual.
        </P>
      </Section>

      <Section title="Cuánto tiempo se conserva">
        <P>
          Las cookies, lo que dice la tabla de arriba. Los pedidos los conserva
          el restaurante mientras los necesite para su contabilidad y para
          atender un reclamo posterior, como cualquier factura.
        </P>
      </Section>

      <Section title="Tus derechos">
        <P>
          Podés pedirnos que te digamos qué información tuya tenemos, que la
          corrijamos o que la borremos. Escribinos por WhatsApp al{" "}
          <strong>7051 9920</strong> y te respondemos.
        </P>
        <P>
          Tratamos tus datos conforme a la Ley N.º 8968 de Protección de la
          Persona frente al Tratamiento de sus Datos Personales de Costa Rica. Si
          considerás que no atendimos bien tu solicitud, podés acudir a la
          Agencia de Protección de Datos de los Habitantes (PRODHAB).
        </P>
      </Section>

      <Section title="Menores de edad">
        <P>
          El sitio no está dirigido a menores de 13 años y no les pedimos datos a
          sabiendas. Si sos madre, padre o encargado y creés que un menor a tu
          cargo nos dio información, escribinos y la eliminamos.
        </P>
      </Section>

      <Section title="Cambios">
        <P>
          Si cambiamos algo de esto, actualizamos la fecha del encabezado. Los
          cambios rigen desde que se publican en esta página.
        </P>
      </Section>
    </LegalPage>
  );
}
