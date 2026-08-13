"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  phone: string;
  customerName: string;
  onVerified: () => void;
}

const REASONS: Record<string, string> = {
  expired: "El código venció. Pedí uno nuevo.",
  used: "Ese código ya se usó. Pedí uno nuevo.",
  "too-many-attempts": "Demasiados intentos. Pedí un código nuevo.",
  mismatch: "El código no es correcto.",
};

/**
 * Comprueba que quien pide es el dueño del número, con un código por WhatsApp.
 *
 * Se pide una sola vez por dispositivo: al verificar, el servidor deja una
 * cookie firmada y los siguientes pedidos en efectivo pasan directo.
 */
export function CashVerification({ phone, customerName, onVerified }: Props) {
  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [code, setCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function sendCode() {
    if (phone.replace(/\D/g, "").length < 8) {
      toast.error("Escribí tu número primero");
      return;
    }
    setIsBusy(true);
    try {
      const res = await fetch("/api/cash-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo enviar el código");
        return;
      }
      setStep("sent");
      toast.success(
        json.cooldown
          ? "Ya te mandamos uno hace poco. Revisá tu WhatsApp."
          : "Te mandamos un código por WhatsApp"
      );
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsBusy(false);
    }
  }

  async function checkCode() {
    setIsBusy(true);
    try {
      const res = await fetch("/api/cash-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: code.trim(), customerName }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo verificar");
        return;
      }
      if (!json.verified) {
        toast.error(REASONS[json.reason] ?? "El código no es correcto.");
        return;
      }
      toast.success("Número verificado");
      onVerified();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Verificá tu número</p>
          <p className="text-xs text-muted-foreground">
            Para pagar en efectivo necesitamos confirmar que este número es tuyo.
            Es una sola vez: en los próximos pedidos ya no te lo pedimos.
          </p>
        </div>
      </div>

      {step === "idle" ? (
        <Button type="button" variant="outline" className="w-full" onClick={sendCode} disabled={isBusy}>
          <MessageCircle className="mr-1.5 h-4 w-4" />
          {isBusy ? "Enviando..." : "Enviame el código por WhatsApp"}
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="otp">Código</Label>
          <div className="flex gap-2">
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="tracking-[0.3em]"
            />
            <Button type="button" onClick={checkCode} disabled={isBusy || code.length < 6}>
              {isBusy ? "..." : "Verificar"}
            </Button>
          </div>
          <button
            type="button"
            onClick={sendCode}
            disabled={isBusy}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            No me llegó, mandalo de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
