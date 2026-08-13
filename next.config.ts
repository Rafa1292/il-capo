import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Solo los hosts reales de imágenes (nico sube a Cloudinary). Un wildcard "**"
    // dejaría usar nuestro optimizador de imágenes como proxy de cualquier host.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nadie debería embeber la app en un iframe (clickjacking sobre el checkout).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Los links de pedido llevan token en la URL: no filtrarlos como referrer ya
          // lo cubre la política anterior (solo origin cross-origin).
          // geolocation=(self): el checkout la usa para colocar el pin de
          // entrega. Sigue bloqueada para terceros embebidos, y el navegador
          // igual le pide permiso al cliente.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
