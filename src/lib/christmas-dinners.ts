import { WHATSAPP_URL } from "@/lib/contact";

/**
 * Cenas navideñas: se reservan por WhatsApp, no por el carrito. El pedido web
 * no cobra el 40 % de adelanto ni maneja las fechas de retiro, así que acá
 * solo se informa y se manda a la conversación con el mensaje ya escrito.
 *
 * Los precios son los mismos de las artes y de la respuesta rápida /cenas del
 * WhatsApp: si cambian, cambian en los tres lados.
 */

export interface ChristmasDinner {
  slug: string;
  name: string;
  serves: string;
  image: string;
  /** Precio principal, con acompañamientos. */
  price: string;
  priceNote: string;
  /** Precio sin acompañamientos. */
  alonePrice: string;
}

export const DINNERS: ChristmasDinner[] = [
  {
    slug: "lomo",
    name: "Lomo relleno",
    serves: "Para 10 personas",
    image: "/cenas/lomo.jpg",
    price: "₡115.000",
    priceNote: "con acompañamientos",
    alonePrice: "Solo el lomo: ₡95.000",
  },
  {
    slug: "pierna",
    name: "Pierna de cerdo",
    serves: "Para 10 personas",
    image: "/cenas/pierna.jpg",
    price: "₡115.000",
    priceNote: "con acompañamientos",
    alonePrice: "Sola: ₡90.000",
  },
  {
    slug: "pierna-kilo",
    name: "Pierna sin hueso por kilo",
    serves: "Desde 1 kg",
    image: "/cenas/pierna-kilo.jpg",
    price: "₡34.000",
    priceNote: "el kilo, con acompañamientos",
    alonePrice: "Sola: ₡28.000 el kilo",
  },
  {
    slug: "costilla",
    name: "Costilla BBQ",
    serves: "Mínimo 4 personas",
    image: "/cenas/costilla.jpg",
    price: "₡11.000",
    priceNote: "por persona, con acompañamientos",
    alonePrice: "Solo con acompañamientos",
  },
];

export const DINNER_SIDE_LIST = [
  "Papas al romero",
  "Ensalada verde",
  "Arroz navideño",
  "Salsa de mora o guayaba",
];
export const PICKUP_TEXT = "24 o 31 de diciembre, de 11 a.m. a 5 p.m., en el local";

/** Link a WhatsApp con el mensaje ya escrito; sin plato, la consulta general. */
export function dinnerWhatsAppUrl(dinner?: ChristmasDinner): string {
  const text = dinner
    ? `Hola, quiero reservar la cena navideña de ${dinner.name.toLowerCase()}`
    : "Hola, quiero información de las cenas navideñas";
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

/**
 * Se anuncian desde noviembre hasta el 20 de diciembre, que es el cierre de
 * reservas. Mes y día en hora de Costa Rica: el servidor corre en UTC.
 */
export function dinnerReservationsOpen(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Costa_Rica",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return month === 11 || (month === 12 && day <= 20);
}
