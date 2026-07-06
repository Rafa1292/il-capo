# Integración nico ↔ il-capo — pedidos web + pagos Tilopay

> Contrato de integración entre **il-capo** (PWA de pedidos del cliente) y **nico**
> (backend/POS, fuente de verdad del menú, precios y pedidos).
> Pagos vía **Tilopay**, modelo **autorizar al pagar → capturar al aceptar → reversar/reembolsar al rechazar**.

**Regla de oro:** il-capo **recalcula** todos los totales con los precios que expone nico y
**exige que el monto pagado coincida** antes de crear el pedido. nico valida lo mismo de su lado.
Si los precios de nico no son los reales, se rechazan pedidos legítimos.

Todos los endpoints de nico van autenticados con header **`X-Api-Key: <api key de nico>`**
(il-capo la tiene solo en el servidor).

---

## 1. Endpoints que **il-capo consume de nico**

### 1.1 `GET /api/public/menu` → `{ data: MenuCategory[] }`
```ts
MenuCategory { id, name, items: MenuItem[] }
MenuItem     { id, name, description?, price, imageUrl?, modifierGroups: ModifierGroup[] }
ModifierGroup{ modifierGroupId, name, minSelect, maxSelect, showLabel, sortOrder, elements: ModifierElement[] }
ModifierElement {
  modifierElementId, name, price,
  combinable?, combinableModifierGroupId?,
  combinableGroupElements?: { modifierElementId, name, price }[]   // mitad y mitad
}
```
`price` de ítems y de cada elemento es **autoritativo**.

### 1.2 `GET /api/public/pizza-builder` → `{ data: PizzaBuilderData }`
```ts
PizzaBuilderData {
  config: { halvesEnabled, saleItemId },
  sizes:  { id, name, basePrice, maxToppingsPerHalf, sortOrder, imageUrl }[],
  doughs: { id, name, extraPrice, sortOrder, imageUrl }[],
  sauces: { id, name, extraPrice, isDefault, sortOrder, imageUrl }[],
  toppingGroups: {
    id, name, maxPerHalf, sortOrder,
    toppings: {
      id, name, unitType:"GRAMS"|"UNITS", pricePerUnit, maxPortions, emoji, imageUrl, sortOrder,
      portionsBySize: { sizeId, unitsPerPortion, unitsPerHalf }[]
    }[]
  }[]
}
```

### 1.3 `POST /api/public/orders` → crea el pedido (ya pagado/autorizado)
il-capo lo llama **solo después** de verificar el pago en Tilopay y recalcular precios. Body:
```json
{
  "customerName": "Rafa",
  "customerPhone": "88888888",
  "deliveryMethod": "TAKEOUT",
  "deliveryAddress": "…",
  "notes": "…",
  "items": [
    {
      "saleItemId": "cmm40f38…",
      "description": "C. Premium",
      "quantity": 1,
      "unitPrice": 4900,
      "modifiers": [
        { "modifierGroupId":"…","name":"…","minSelect":0,"maxSelect":2,"showLabel":true,"sortOrder":0,
          "elements":[{ "modifierElementId":"…","name":"…","price":500,"quantity":1,"isCombined":false }] }
      ],
      "pizzaBuilder": { "sizeId":"…","doughId":"…","sauceId":"…","isHalf":false,"toppings":[{"toppingId":"…","portions":1}] }
    }
  ],
  "estimatedTotal": 8700,
  "payment": {
    "provider": "tilopay",
    "orderNumber": "ILCAPO-1783…-PPNLE7",
    "auth": "123456",
    "amount": 8700,
    "currency": "CRC",
    "tilopayId": 5314044
  }
}
```
Respuesta: `{ "success": true, "data": { "id", "status":"PENDING", "estimatedTotal", "createdAt" } }`

### 1.4 `GET /api/public/orders/{id}` → estado del pedido (il-capo hace polling)
```json
{ "success": true, "data": {
  "id", "status":"PENDING"|"ACCEPTED"|"REJECTED"|"CANCELLED",
  "rejectedReason", "billId", "customerName", "deliveryMethod",
  "estimatedTotal", "createdAt", "updatedAt"
}}
```

---

## 2. Reglas de precios (idénticas en ambos lados) ⚠️

nico **valida estricto** al crear el pedido y responde **`400`** (sin crear ni cobrar) si algo no cuadra.
il-capo replica exactamente esta lógica:

- **`unitPrice` = solo el precio propio del ítem.** Los modificadores NO van dentro de `unitPrice`:
  van en `modifiers[]` con su precio y **se suman aparte**.
  - Ítem normal: `unitPrice = MenuItem.price`.
  - Pizza builder: `unitPrice = size.basePrice + dough.extraPrice + sauce.extraPrice + toppings` (ver abajo).
- **Total de una línea** = `(unitPrice + Σ modificador.price × modificador.quantity) × quantity`.
- **`estimatedTotal`** = Σ de los totales de línea. Obligatorio y exacto (tolerancia ±0.01).
- **`payment.amount`** = `estimatedTotal`. il-capo lo envía y debe coincidir.
- **Precio de pizza** (toppings):
  `Σ topping( pricePerUnit × (isHalf ? unitsPerHalf : unitsPerPortion) × porciones )`.
  En **mitad y mitad**, tanto `leftToppings` como `rightToppings` usan **`unitsPerHalf`**.
- **Ítems de precio 0** (ej. pizzas cuyo tamaño es un grupo requerido): `unitPrice = 0` y el tamaño
  viaja como modificador con su precio (ej. Personal = 3800).
- il-capo **ignora** cualquier precio que venga del cliente: todo se recalcula desde `menu`/`pizza-builder`.

---

## 3. Lo que **nico debe implementar/cambiar**

1. **Persistir el objeto `payment`** en el pedido — sobre todo `payment.orderNumber` (llave para
   webhook + dedupe). Marcar el pedido como pagado con Tilopay.
2. **Dedupe por `payment.orderNumber`:** si llega un `POST /orders` con un `orderNumber` que ya existe,
   **no duplicar** → responder **`200`** con el mismo pedido (`{ id, status, estimatedTotal, createdAt }`).
   il-capo trata `200/201` como "ya creado, todo bien".
3. **Validación estricta** de precios (§2) → `400` si algún `saleItemId`/precio/total no cuadra.
4. **`provider` debe ser exactamente `"tilopay"`** para que se dispare el webhook de captura/reverso.
5. Estados hoy: **ACCEPTED / REJECTED** (CANCELLED soportado, sin flujo de cliente aún).
6. **Seguridad:** `/api/public/*` detrás de `X-Api-Key` y nico **no expuesto a internet** más allá de il-capo.

---

## 4. Webhook que **nico llama a il-capo** (captura / reverso)

Cuando un pedido pagado con Tilopay pasa a estado final:
```http
POST {IL_CAPO_WEBHOOK_URL}        // local: http://localhost:3000/api/payments/webhook
Content-Type: application/json
X-Webhook-Secret: {IL_CAPO_WEBHOOK_SECRET}

{ "orderNumber": "<payment.orderNumber>", "status": "ACCEPTED" }   // o "REJECTED" / "CANCELLED"
```

| status | Efecto |
|---|---|
| `ACCEPTED` | **Captura** (se cobra la retención) |
| `REJECTED` / `CANCELLED` | **Reverso** (libera). Si ya estaba capturado → **reembolso**. |

**Respuestas de il-capo:**

| HTTP | Significado | Acción en nico |
|---|---|---|
| `200 {ok:true}` | Capturado/reversado (o ya estaba: `already:true`) | Marcar `paymentSettled = true`, no reintentar |
| `502 {ok:false,message}` | Tilopay rechazó (ej. `"User in review"`) | Reintentar (cron). Se resuelve cuando activen el comercio |
| `409` | Transacción no autorizada / inexistente | Loguear; no reintentar en loop |
| `401` | `X-Webhook-Secret` incorrecto | Revisar config |

**Garantías de il-capo (idempotencia):**
- El webhook es **idempotente por `orderNumber`**: reenviar el mismo `orderNumber+status` es seguro.
- **Nunca** devuelve `200` en `ACCEPTED` si no logró capturar de verdad (no reporta "cobrado" en falso).
- Un `ACCEPTED` sobre un pago ya capturado → `200 {already:true}` (no recobra).
- Un `REJECTED` sobre un pago ya reversado/no vivo → `200 {already:true}`.

**Contrato del cron de nico:** reintenta el mismo `orderNumber+status` cada ~15 min hasta recibir `200`.
Timeout por intento: **8s** (il-capo responde en ~1–2s).

---

## 5. Config / secretos en nico
```
IL_CAPO_WEBHOOK_URL=http://localhost:3000/api/payments/webhook   # prod: https://<dominio-il-capo>/api/payments/webhook
IL_CAPO_WEBHOOK_SECRET=whsec_3d1569c86b90fb1d76c7cd5eb14aa6b25e2d73f84528ed1a
```
Debe ser **idéntico** al `NICO_WEBHOOK_SECRET` de il-capo. `ORDER_TOKEN_SECRET` es solo de il-capo.

---

## 6. Flujo completo
```
Cliente arma carrito (UI)
  → il-capo /api/payments/create : recalcula total con /menu + /pizza-builder de nico
                                    y AUTORIZA en Tilopay ese monto (capture:0)
  → cliente paga en Tilopay       : fondos RETENIDOS (no cobrados)
  → il-capo /api/orders           : verifica pago (consult) + exige pagado===recalculado
                                    → POST /api/public/orders (nico)  [PENDING, pagado]
                                    → (dedupe: si el orderNumber ya existe, nico devuelve el mismo)
Negocio ACEPTA   en nico → nico → webhook il-capo → CAPTURA   (se cobra)
Negocio RECHAZA  en nico → nico → webhook il-capo → REVERSO   (se libera; o REEMBOLSO si ya capturado)
Cliente ve estado → il-capo GET /api/orders/{id}?t=token → nico GET /api/public/orders/{id}
```

> **Nota de seguridad (il-capo):** `GET /api/orders/{id}` de il-capo exige un token firmado
> (capability URL) para evitar IDOR/fuga de PII; nico no participa de eso.

---

## 7. Checklist para el agente de nico
- [ ] `GET /api/public/menu` y `GET /api/public/pizza-builder` con los shapes de §1.1/§1.2 y **precios reales**.
- [ ] `POST /api/public/orders`: **persiste `payment`**, **valida precios** (§2, `400` si no cuadra),
      **dedupe por `orderNumber`** devolviendo **`200`** con el existente.
- [ ] `GET /api/public/orders/{id}` con el shape de §1.4 (incluye `customerName`, `deliveryMethod`).
- [ ] Webhook saliente a il-capo en ACCEPTED/REJECTED/CANCELLED, con cron de reintentos hasta `200`,
      timeout 8s (§4).
- [ ] Vars `IL_CAPO_WEBHOOK_URL` + `IL_CAPO_WEBHOOK_SECRET` (§5).
- [ ] `/api/public/*` protegido por API key y nico no expuesto públicamente.

---

## 8. Estado actual (validado)
- il-capo: pricing autoritativo (ítems + modificadores + pizza builder), gate de pago, `pagado===total`,
  webhook idempotente, rate-limit, tokens de pedido — **implementado y probado por API**.
- Pendiente Tilopay: la cuenta está **"en review"** → las **capturas/reembolsos reales** fallan con
  `"User in review"` hasta que Tilopay active el comercio. Las **autorizaciones** sí funcionan.
- Pendiente de prueba en navegador: una compra real de **pizza/ítem con modificadores** (orderNumber
  nuevo, sin dedupe) para confirmar que nico responde `201` y no `400`.
