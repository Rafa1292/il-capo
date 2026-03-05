"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pizza, User } from "lucide-react";
import { CartSheet } from "@/components/cart/cart-sheet";
import { cn } from "@/lib/utils";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5">
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
      <CartSheet />
    </nav>
  );
}
