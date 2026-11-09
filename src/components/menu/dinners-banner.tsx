"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { dinnerReservationsOpen } from "@/lib/christmas-dinners";

/**
 * Acceso a las cenas navideñas desde la carta. Se decide en el navegador: la
 * carta se cachea y una versión armada el 20 a la noche seguiría mostrándolo.
 */
export function DinnersBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(dinnerReservationsOpen());
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/cenas"
      className="group mb-6 flex items-center gap-4 overflow-hidden rounded-xl border border-[#b8912f]/40 bg-[#3a1410] p-3 text-[#f6ead2] shadow-sm transition-colors hover:bg-[#4a1a14]"
    >
      <Image
        src="/cenas/portada.jpg"
        alt=""
        width={72}
        height={90}
        className="h-[90px] w-[72px] shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2c477]">
          Reservas hasta el 20 de diciembre
        </p>
        <p className="mt-0.5 text-lg font-bold leading-tight">Cenas navideñas</p>
        <p className="mt-0.5 text-xs text-[#f6ead2]/80">
          Lomo relleno, pierna, punta de solomo, pollo y costilla BBQ para retirar el 24 o el 31.
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#e2c477] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
