"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLogo() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="il Capo"
        width={52}
        height={52}
        className="object-contain"
        priority
      />
    </Link>
  );
}
