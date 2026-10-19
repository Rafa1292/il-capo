"use client";

import { useEffect, useState } from "react";
import { Coins, Gamepad2 } from "lucide-react";

type Info = { enabled: false } | { enabled: true; direct: boolean; balance: number | null };

/**
 * "Mis fichas" en la cuenta: saldo de fichas de los juegos y el botón para
 * jugar. El saldo solo se sabe si el WhatsApp ya se comprobó en este aparato
 * (al pagar en efectivo); si no, se invita a entrar y verificar allá.
 */
export function GamesWallet() {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setInfo((json?.data as Info) ?? { enabled: false }))
      .catch(() => setInfo({ enabled: false }));
  }, []);

  if (!info?.enabled) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <Gamepad2 className="h-6 w-6 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">Mis fichas</p>
          <p className="text-sm text-muted-foreground">
            {info.balance !== null
              ? "Ganás 1 ficha por cada ₡500 de tus pedidos."
              : "Entrá con tu WhatsApp para ver tus fichas y jugar."}
          </p>
        </div>
        {info.balance !== null && (
          <span className="flex items-center gap-1 text-2xl font-bold text-primary">
            <Coins className="h-5 w-5" />
            {info.balance}
          </span>
        )}
      </div>
      <a
        href="/juegos"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Jugar
      </a>
    </div>
  );
}
