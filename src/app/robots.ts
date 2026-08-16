import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Qué puede rastrear un buscador.
 *
 * Lo que importa acá no es tanto el SEO como la privacidad: `/pedido/:id` lleva
 * un token en la URL y muestra nombre, teléfono y dirección del cliente. Es una
 * "capability URL": cualquiera que la tenga entra. Que un rastreador la siga y
 * la publique sería filtrar datos de un cliente real, así que queda fuera junto
 * con el resto del flujo privado (checkout, cuenta, login).
 *
 * Todas esas rutas además mandan `noindex` en su propio HTML — ver los
 * `layout.tsx` de cada una. Lo de acá evita que las visiten; el `noindex` cubre
 * a quien llegue por un enlace suelto ignorando este archivo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout", "/cuenta", "/login", "/pedido/", "/factory"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
