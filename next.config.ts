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
    // Permite imágenes remotas de los sale items (ajustar hostname al real cuando se sepa)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default withPWA(nextConfig);
