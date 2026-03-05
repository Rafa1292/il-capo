import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LayoutShell } from "@/components/layout/layout-shell";
import { SwManager } from "@/components/layout/sw-manager";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "il Capo Pizzería",
  description: "Las mejores pizzas artesanales. Pedidos en línea para recoger o a domicilio.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "il Capo",
  },
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
