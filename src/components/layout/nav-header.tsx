"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pizza, User } from "lucide-react";
import { CartSheet } from "@/components/cart/cart-sheet";
import { cn } from "@/lib/utils";

export function NavHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="grid grid-cols-3 items-center w-full">

      {/* Izquierda — logo, oculto en home */}
      <div className="flex items-center">
        <Link
          href="/"
          className={cn(
            "transition-all duration-300 ease-out",
            isHome
              ? "opacity-0 -translate-x-3 pointer-events-none"
              : "opacity-100 translate-x-0"
          )}
        >
          <Image
            src="/logo.png"
            alt="il Capo"
            width={52}
            height={52}
            className="object-contain"
          />
        </Link>
      </div>

      {/* Centro — link Menú */}
      <div className="flex items-center justify-center">
        <Link
          href="/menu"
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors",
            pathname.startsWith("/menu")
              ? "text-primary bg-primary/8"
              : "text-foreground/60 hover:text-foreground hover:bg-muted"
          )}
        >
          <Pizza className="h-4 w-4" />
          Menú
        </Link>
      </div>

      {/* Derecha — carrito + usuario */}
      <div className="flex items-center justify-end gap-0.5">
        <CartSheet />
        <Link
          href="/login"
          className={cn(
            "p-2 rounded-md transition-colors",
            pathname.startsWith("/login")
              ? "text-primary bg-primary/8"
              : "text-foreground/60 hover:text-foreground hover:bg-muted"
          )}
          aria-label="Iniciar sesión"
        >
          <User className="h-5 w-5" />
        </Link>
      </div>

    </div>
  );
}

