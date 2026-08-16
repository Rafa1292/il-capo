import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LayoutShell } from "@/components/layout/layout-shell";
import { SwManager } from "@/components/layout/sw-manager";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "Pizza artesanal en Grecia y San Ramón. Pedí en línea a domicilio o para recoger: masa amasada a mano cada día y armá tu pizza como querás.";

export const metadata: Metadata = {
  // Sin esto Next no puede volver absolutas las URLs de og:image ni de los
  // canonical, y la vista previa al compartir sale sin imagen.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Pizza artesanal en Grecia y San Ramón`,
    // Las páginas ponen solo lo suyo ("Grecia") y la marca se agrega sola.
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "il Capo",
  },
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Pizza artesanal en Grecia y San Ramón`,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Pizza artesanal en Grecia y San Ramón`,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Sin esto Google recorta la descripción y no muestra la foto del
      // producto en resultados.
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: true, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#CC0000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LayoutShell>
          {children}
        </LayoutShell>
        <SwManager />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
