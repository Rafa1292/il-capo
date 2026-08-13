# Pago en efectivo — construido y apagado

El pago contra entrega está implementado de punta a punta en las dos apps, pero
**apagado**. Este documento dice por qué y qué falta para encenderlo.

## Por qué está apagado

Aceptar efectivo exige comprobar que quien pide es el dueño del número. Con
tarjeta un pedido falso no cuesta nada porque el cobro ya pasó; en efectivo
cuesta la comida hecha y el viaje del mensajero que nadie paga.

Esa comprobación se hace con un código que llega por WhatsApp, y ahí está el
bloqueo: **el número conectado a la cuenta de Meta es el de prueba**
(`+1 555 …`), y las cuentas de prueba no permiten crear plantillas de categoría
Authentication. Meta además clasifica como Authentication cualquier plantilla
cuyo contenido sea un código, así que tampoco deja crearla como Utilidad.

## Qué falta

1. **Ligar el número real del negocio** a la cuenta de WhatsApp Business, en
   WhatsApp Manager → Configuración de la API → Agregar número de teléfono.
   - El número no puede tener WhatsApp activo (ni el normal ni Business App);
     darlo de baja borra el historial de ese número.
   - Es un camino de ida: registrado en la Cloud API no vuelve a la app normal.
2. **Actualizar `phoneNumberId` y el token en nico** (configuración del sistema,
   pestaña WhatsApp). nico resuelve el tenant por ese identificador: si no se
   actualiza, los mensajes llegan y no se asocian a ningún negocio.
3. **Crear la plantilla del código**, categoría Authentication, nombre
   `codigo_verificacion`, con botón de copiar código y vencimiento de 10 min
   (el mismo que usa nico).
4. **Encender el interruptor**: `NEXT_PUBLIC_CASH_ENABLED=true` en il-capo.

Si Meta habilitara Authentication pero se prefiere una plantilla de Utilidad
con el código en `{{1}}`, en nico se pone `WHATSAPP_OTP_TEMPLATE_KIND=utility`.

## Qué sí funciona hoy, sin nada de lo anterior

La caja puede habilitar a un cliente a mano desde `/admin/clientes` → menú de
acciones → **Permitir pago en efectivo**. Esa es la vía prevista para el cliente
sin WhatsApp, y sirve igual para probar todo el circuito: el permiso queda en
`Customer.cashOrderingEnabledAt` y el checkout lo respeta.

Con el interruptor apagado, sin embargo, el checkout ni siquiera ofrece la
opción — para probar hay que encenderlo en local.

## Dónde está cada pieza

| Pieza | Dónde |
|---|---|
| Interruptor | `NEXT_PUBLIC_CASH_ENABLED` (il-capo, pantalla y API de pedidos) |
| Código: generar, vencer, contar intentos | nico, `src/domains/cash-verification/rules.ts` |
| Envío del mensaje y permiso del cliente | nico, `src/domains/cash-verification/service.ts` |
| Endpoints públicos | nico, `/api/public/cash-verification` |
| Rechazo del pedido sin permiso | nico, `src/app/api/public/orders/guards.ts` |
| Cookie del dispositivo verificado | il-capo, `src/lib/cash-verification.ts` |
| Pantalla del código | il-capo, `src/components/checkout/cash-verification.tsx` |

El permiso vive en nico y se comprueba en **cada** pedido. La cookie de il-capo
solo evita volver a pedir el código en ese dispositivo: no autoriza nada.
