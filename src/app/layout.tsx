import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { CartSheet } from "@/components/cart/cart-sheet";
import Image from "next/image";
import Link from "next/link";

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
        <header className="sticky top-0 z-50 bg-[#CC0000] shadow-md">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="il Capo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/menu"
                className="text-white/90 hover:text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                Menú
              </Link>
              <CartSheet />
            </nav>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 min-h-[calc(100vh-56px)]">
          {children}
        </main>

        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
