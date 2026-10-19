"use client";

import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";

type GamesEntry = { enabled: false } | { enabled: true; url: string; direct: boolean; tokens: number };

/**
 * "Mientras esperás, jugá": invitación a los juegos de nico en la página del
 * pedido, con las fichas que le da este pedido. Se consulta una sola vez; si la
 * sede no tiene juegos o algo falla, no se muestra nada.
 */
export function GamesInvite({ orderId, token }: { orderId: string; token: string | null }) {
  const [entry, setEntry] = useState<GamesEntry | null>(null);

  useEffect(() => {
    const q = token ? `?t=${encodeURIComponent(token)}` : "";
    fetch(`/api/orders/${orderId}/games${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setEntry((json?.data as GamesEntry) ?? { enabled: false }))
      .catch(() => setEntry({ enabled: false }));
  }, [orderId, token]);

  if (!entry?.enabled) return null;

  return (
    <div className="w-full max-w-sm rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <Gamepad2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-semibold">Mientras esperás, jugá 🎮</p>
          <p className="text-sm text-muted-foreground">
            {entry.tokens > 0
              ? `Este pedido te da ${entry.tokens} ficha${entry.tokens === 1 ? "" : "s"} para jugar y ganar premios.`
              : "Jugá con tus fichas y ganá premios."}
            {!entry.direct && " Entrás verificando tu WhatsApp."}
          </p>
        </div>
      </div>
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Jugar ahora
      </a>
    </div>
  );
}
