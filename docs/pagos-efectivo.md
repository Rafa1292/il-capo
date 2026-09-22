# Pago en efectivo

El pago contra entrega está construido de punta a punta en las dos apps. Se
enciende con `NEXT_PUBLIC_CASH_ENABLED=true`.

## La verificación va al revés

Aceptar efectivo exige comprobar que quien pide es el dueño del número. Con
tarjeta un pedido falso no cuesta nada porque el cobro ya pasó; en efectivo
cuesta la comida hecha y el viaje del mensajero que nadie paga.

Lo natural sería mandarle un código por WhatsApp, pero Meta no lo permite: las
plantillas de categoría **Authentication** exigen el negocio verificado, y
cualquier plantilla cuyo contenido sea un código se clasifica como
Authentication (crearla como Utilidad se rechaza automático con
`INCORRECT_CATEGORY`). Verificar el negocio en Meta es trámite de documentos y
semanas de espera.

Así que se invierte el sentido: **el cliente manda el código desde su WhatsApp**
al número del negocio. Prueba lo mismo —solo el dueño de la línea escribe desde
ella—, no necesita plantilla ni verificación de Meta, no cuesta por mensaje, y
deja la ventana de 24h abierta para avisarle del pedido por el mismo chat.

## El flujo

```
1. El cliente elige "Efectivo" en el checkout.
2. POST /api/cash-verification  → nico emite el token
   { ref, token: "K7F2P", waLink: "https://wa.me/506…?text=…", expiresAt }
3. Se abre WhatsApp en otra pestaña con el mensaje ya escrito. El cliente solo
   toca enviar. El código también se muestra en pantalla, por si abrió WhatsApp
   en otro aparato.
4. El bot del negocio reconoce el código, habilita el número y le contesta.
5. PUT /api/cash-verification { ref }  ← sondeo cada 3 s (y al volver a la
   pestaña). Cuando responde { verified: true, phone }, se deja la cookie
   firmada y el checkout sigue.
6. El pedido va con paymentMethodHint: "CASH" y el teléfono verificado.
```

El token vive **30 minutos** y es de un solo uso. El permiso del cliente, en
cambio, **no vence**: queda en `Customer.cashOrderingEnabledAt` en nico.

**El número que vale es el que escribió por WhatsApp**, no el que digitó en el
formulario: es el que nico habilitó y contra el que va a comparar cuando llegue
el pedido. Por eso `onVerified` reescribe el campo del teléfono.

## Cuidados

- **Cada sede es un tenant con su propio WhatsApp.** La verificación sale contra
  la API key de la sede elegida, así que esa sede tiene que tener su número
  conectado en nico. Si no lo tiene, nico responde `503
  WHATSAPP_NOT_CONFIGURED`, el checkout vuelve a tarjeta y lo avisa: es
  preferible eso a un link que no lleva a ninguna parte.
- **La cookie no autoriza nada.** Solo evita volver a preguntar en ese
  dispositivo; nico comprueba el permiso en cada pedido y responde `403
  CASH_NOT_ENABLED` si no está.
- **El interruptor está en los dos lados.** La pantalla lo usa para ofrecer o no
  la opción, y `/api/orders` lo vuelve a mirar: esconder un botón no impide que
  alguien llame al endpoint a mano.

## Sin WhatsApp

La caja puede habilitar a un cliente a mano desde nico (`/admin/clientes` → menú
de acciones → **Permitir pago en efectivo**). Es la vía prevista para quien no
tiene WhatsApp, y sirve igual para probar el circuito completo.

## Dónde está cada pieza

| Pieza | Dónde |
|---|---|
| Interruptor | `NEXT_PUBLIC_CASH_ENABLED` (il-capo, pantalla y API de pedidos) |
| Pantalla del código y sondeo | il-capo, `src/components/checkout/cash-verification.tsx` |
| Proxy contra nico + cookie | il-capo, `src/app/api/cash-verification/route.ts` |
| Cookie del dispositivo verificado | il-capo, `src/lib/cash-verification.ts` |
| Token: generar, vencer, reconocer en el texto | nico, `src/domains/cash-verification/rules.ts` |
| Canje y permiso del cliente | nico, `src/domains/cash-verification/service.ts` |
| Canje desde el chat | nico, `src/domains/cash-verification/inbound.ts` |
| Endpoints públicos | nico, `/api/public/cash-verification/link` |
| Rechazo del pedido sin permiso | nico, `src/app/api/public/orders/guards.ts` |

## El camino del código enviado (OTP), listo y apagado

nico conserva `POST`/`PUT /api/public/cash-verification` con el OTP clásico, y
los envs `WHATSAPP_OTP_TEMPLATE`, `WHATSAPP_OTP_TEMPLATE_LANG` y
`WHATSAPP_OTP_TEMPLATE_KIND`. El día que el negocio se verifique en Meta y se
cree la plantilla `codigo_verificacion` (Authentication, botón de copiar código,
vencimiento 10 min), ese camino funciona sin tocar nada más.
