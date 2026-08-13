"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Pizza, User, Factory } from "lucide-react";
import { CartSheet } from "@/components/cart/cart-sheet";
import { WHATSAPP_URL } from "@/lib/contact";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/checkout") || pathname.startsWith("/pedido")) return null;

  // La portada ES la carta, así que el logo central y la pestaña "Menú" llevan
  // al mismo sitio y se marcan juntos.
  const isHome = pathname === "/";
  const isMenu = isHome;
  const isFactory = pathname.startsWith("/factory");
  const isLogin = pathname.startsWith("/cuenta");

  return (
    <>
      {/* WhatsApp — solo en home */}
      {isHome && <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-50 h-12 w-12 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full flex items-center justify-center shadow-lg transition-colors"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>}

      {/* Bottom nav */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border">
        <div className="relative max-w-2xl mx-auto h-16 px-2">

          {/* Logo bump — sale por encima del navbar */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
            <Link
              href="/"
              aria-label="Inicio"
              className="group block transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-105 active:scale-95"
            >
              <Image
                src="/logo-home.png"
                alt="il Capo"
                width={104}
                height={88}
                className="object-contain drop-shadow-md transition-[filter,drop-shadow] duration-200 group-hover:drop-shadow-xl group-hover:brightness-105"
                priority
              />
            </Link>
          </div>

          {/* Items left + right con espacio reservado en el centro para el logo */}
          <div className="flex h-full items-center">

            {/* Izquierda — Menú + Factory */}
            <div className="flex flex-1 items-center justify-start gap-1">
              <Link
                href="/"
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-2 transition-colors text-xs",
                  isMenu ? "text-primary" : "text-foreground/50 hover:text-foreground"
                )}
              >
                <Pizza className="h-5 w-5" />
                Menú
              </Link>
              <Link
                href="/factory"
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-2 transition-colors text-xs",
                  isFactory ? "text-primary" : "text-foreground/50 hover:text-foreground"
                )}
              >
                <Factory className="h-5 w-5" />
                Factory
              </Link>
            </div>

            {/* Espacio reservado para el logo central */}
            <div className="w-28 shrink-0" aria-hidden />

            {/* Derecha — Carrito + Cuenta */}
            <div className="flex flex-1 items-center justify-end gap-1">
              <CartSheet />
              <Link
                href="/cuenta"
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-2 transition-colors text-xs",
                  isLogin ? "text-primary" : "text-foreground/50 hover:text-foreground"
                )}
              >
                <User className="h-5 w-5" />
                Cuenta
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
