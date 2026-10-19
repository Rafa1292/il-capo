"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onVerified: (phone: string) => void;
  /** La sede no tiene WhatsApp: no hay forma de verificar, así que no se ofrece. */
  onUnavailable?: () => void;
}

/** Cada cuánto se le pregunta a nico si el mensaje ya llegó. */
const POLL_MS = 3000;

/**
 * El código pendiente se guarda en el aparato: al ir a WhatsApp el navegador
 * del celular suele recargar la pestaña, y sin esto la página volvía a "Verificar"
 * y el cliente mandaba un segundo código (pasó). Al volver, se retoma el mismo.
 */
const PENDING_KEY = "cash-verification-pending";
/** Lo que dura un código en nico (30 min); después no vale la pena retomarlo. */
const PENDING_TTL_MS = 30 * 60 * 1000;

type PendingLink = { ref: string; token: string; waLink: string };

function readPending(): PendingLink | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingLink & { at: number };
    if (Date.now() - p.at > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return { ref: p.ref, token: p.token, waLink: p.waLink };
  } catch {
    return null;
  }
}

function savePending(link: PendingLink | null): void {
  try {
    if (link) localStorage.setItem(PENDING_KEY, JSON.stringify({ ...link, at: Date.now() }));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // Sin storage: solo se pierde poder retomar tras una recarga.
  }
}

/**
 * Comprueba que quien pide es el dueño del número: el cliente manda un código
 * desde SU WhatsApp al número del negocio.
 *
 * Va al revés que un código recibido porque hoy no podemos mandarlo (Meta exige
 * el negocio verificado para las plantillas de Autenticación), pero prueba lo
 * mismo: solo el dueño de la línea escribe desde ella. De paso, el chat queda
 * abierto para avisarle cuando el pedido salga.
 *
 * Se pide una sola vez por dispositivo: al verificar, el servidor deja una
 * cookie firmada y los siguientes pedidos en efectivo pasan directo.
 */
export function CashVerification({ onVerified, onUnavailable }: Props) {
  const [link, setLink] = useState<PendingLink | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const done = useRef(false);

  // Retomar el código que quedó esperando si la página se recargó.
  useEffect(() => {
    const pending = readPending();
    if (pending) setLink(pending);
  }, []);

  async function start() {
    setIsBusy(true);
    setExpired(false);
    try {
      const res = await fetch("/api/cash-verification", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo empezar la verificación");
        // Sin WhatsApp en la sede no hay verificación posible: se vuelve a
        // tarjeta en vez de dejar al cliente reintentando algo que no va a
        // funcionar.
        if (json.code === "WHATSAPP_NOT_CONFIGURED") onUnavailable?.();
        return;
      }
      const next = { ref: json.ref, token: json.token, waLink: json.waLink };
      setLink(next);
      savePending(next);
      // Se abre en otra pestaña para no perder el carrito ni los datos ya
      // escritos: el cliente manda el mensaje y vuelve a esta misma pantalla.
      window.open(json.waLink, "_blank", "noopener");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsBusy(false);
    }
  }

  const check = useCallback(
    async (ref: string) => {
      if (done.current) return;
      try {
        const res = await fetch("/api/cash-verification", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref }),
        });
        const json = await res.json();
        if (json?.verified && json.phone) {
          done.current = true;
          savePending(null);
          toast.success("Número verificado");
          onVerified(json.phone as string);
          return;
        }
        if (json?.expired) {
          setExpired(true);
          savePending(null);
        }
      } catch {
        // Un sondeo perdido no vale molestar al cliente: el siguiente va.
      }
    },
    [onVerified]
  );

  // Mientras el cliente va a WhatsApp y vuelve, se pregunta cada pocos
  // segundos. Al volver a la pestaña se pregunta de una: es justo el momento
  // en que acaba de mandar el mensaje.
  useEffect(() => {
    if (!link || expired) return;
    void check(link.ref);
    const timer = setInterval(() => void check(link.ref), POLL_MS);
    const onFocus = () => void check(link.ref);
    // En el celular, volver desde WhatsApp no siempre dispara "focus".
    const onVisible = () => document.visibilityState === "visible" && void check(link.ref);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [link, expired, check]);

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Verificá tu número</p>
          <p className="text-xs text-muted-foreground">
            Para pagar en efectivo necesitamos confirmar que el número es tuyo:
            mandanos un WhatsApp con el código y listo. Es una sola vez; en los
            próximos pedidos ya no te lo pedimos.
          </p>
        </div>
      </div>

      {!link ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={start}
          disabled={isBusy}
        >
          <MessageCircle className="mr-1.5 h-4 w-4" />
          {isBusy ? "Abriendo WhatsApp..." : "Verificar por WhatsApp"}
        </Button>
      ) : (
        <div className="space-y-3">
          {/* El código a la vista: si abrió WhatsApp en otro aparato, o borró
              sin querer el mensaje ya escrito, lo manda a mano. */}
          <div className="rounded-lg bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Tu código
            </p>
            <p className="text-2xl font-bold tracking-[0.3em]">{link.token}</p>
          </div>

          {expired ? (
            <>
              <p className="text-xs text-muted-foreground">
                El código venció. Pedí uno nuevo y mandalo por WhatsApp.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={start}
                disabled={isBusy}
              >
                Pedir un código nuevo
              </Button>
            </>
          ) : (
            <>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Esperando tu mensaje…
              </p>
              <a
                href={link.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
              >
                Abrir WhatsApp de nuevo
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
