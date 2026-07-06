"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  User,
  Mail,
  LogOut,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useProfileStore } from "@/store/profile";
import { getLastOrder, lastOrderUrl } from "@/lib/last-order";

interface SessionInfo {
  email: string;
  name?: string;
  picture?: string;
  provider: "google" | "email";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function CuentaContent() {
  const params = useSearchParams();
  const profile = useProfileStore();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Flujo OTP
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  // Formularios de perfil (borradores locales)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newAddrLabel, setNewAddrLabel] = useState("");
  const [newAddr, setNewAddr] = useState("");

  const [lastOrder] = useState(() =>
    typeof window !== "undefined" ? getLastOrder() : null
  );

  // Prefill del formulario desde el perfil persistido (tras hidratar).
  useEffect(() => {
    setName(useProfileStore.getState().name);
    setPhone(useProfileStore.getState().phone);
  }, []);

  useEffect(() => {
    const err = params.get("error");
    if (err === "google") toast.error("No se pudo iniciar sesión con Google.");
    if (err === "google_no_configurado")
      toast.error("El login con Google no está configurado todavía.");
    if (params.get("login") === "ok") toast.success("¡Sesión iniciada!");
  }, [params]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => {
        setSession(j.session);
        // La identidad complementa el perfil local: copiamos lo que falte.
        if (j.session) {
          const p = useProfileStore.getState();
          p.setProfile({
            email: j.session.email,
            name: p.name || j.session.name || "",
          });
          if (!p.name && j.session.name) setName(j.session.name);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSession(false));
  }, []);

  async function sendOtp() {
    if (otpBusy) return;
    setOtpBusy(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo enviar el código");
        return;
      }
      setOtpSent(true);
      if (json.devCode) {
        // Solo aparece en desarrollo sin mailer configurado.
        toast.info(`Código (modo dev): ${json.devCode}`, { duration: 15000 });
      } else {
        toast.success("Te enviamos un código a tu correo.");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setOtpBusy(false);
    }
  }

  async function verifyOtp() {
    if (otpBusy) return;
    setOtpBusy(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, code: otpCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Código incorrecto");
        return;
      }
      setSession({ email: json.session.email, provider: "email" });
      useProfileStore.getState().setProfile({ email: json.session.email });
      setOtpSent(false);
      setOtpCode("");
      toast.success("¡Sesión iniciada!");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setOtpBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    setSession(null);
    toast.success("Sesión cerrada");
  }

  function saveProfile() {
    profile.setProfile({ name: name.trim(), phone: phone.trim() });
    toast.success("Datos guardados");
  }

  function addAddress() {
    if (!newAddr.trim()) {
      toast.error("Escribí la dirección");
      return;
    }
    profile.addAddress(newAddrLabel || "Casa", newAddr);
    setNewAddr("");
    setNewAddrLabel("");
    toast.success("Dirección guardada");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tus datos se guardan para no re-escribirlos en cada pedido.
        </p>
      </div>

      {/* Sesión */}
      <section className="border rounded-xl p-4 space-y-4">
        {loadingSession ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando sesión...
          </div>
        ) : session ? (
          <div className="flex items-center gap-3">
            {session.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.picture}
                alt=""
                className="h-10 w-10 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{session.name || session.email}</p>
              <p className="text-xs text-muted-foreground truncate">
                {session.email} · {session.provider === "google" ? "Google" : "correo"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Iniciá sesión</p>
            <a href="/api/auth/google" className="block">
              <Button variant="outline" className="w-full gap-2" type="button">
                <GoogleIcon /> Continuar con Google
              </Button>
            </a>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">o con tu correo</span>
              <Separator className="flex-1" />
            </div>
            {!otpSent ? (
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                />
                <Button onClick={sendOtp} disabled={otpBusy} className="shrink-0 bg-primary hover:bg-primary/90">
                  {otpBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Enviar código
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Ingresá el código de 6 dígitos que enviamos a <strong>{otpEmail}</strong>
                </p>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="font-mono tracking-widest"
                  />
                  <Button
                    onClick={verifyOtp}
                    disabled={otpBusy || otpCode.length !== 6}
                    className="shrink-0 bg-primary hover:bg-primary/90"
                  >
                    {otpBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-muted-foreground underline"
                >
                  Cambiar correo o reenviar
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Último pedido */}
      {lastOrder && (
        <Link
          href={lastOrderUrl(lastOrder)}
          className="flex items-center gap-3 border rounded-xl p-4 hover:border-primary/40 transition-colors"
        >
          <ReceiptText className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Mi último pedido</p>
            <p className="text-xs text-muted-foreground">Ver estado</p>
          </div>
        </Link>
      )}

      {/* Datos de pedido */}
      <section className="space-y-3">
        <h2 className="font-semibold">Mis datos</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nombre</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Teléfono</Label>
            <Input id="p-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8888-8888" />
          </div>
          <Button onClick={saveProfile} variant="outline" className="w-full">
            Guardar mis datos
          </Button>
        </div>
      </section>

      {/* Direcciones */}
      <section className="space-y-3">
        <h2 className="font-semibold">Mis direcciones</h2>
        {profile.addresses.length > 0 && (
          <ul className="space-y-2">
            {profile.addresses.map((a) => (
              <li key={a.id} className="flex items-start gap-2 border rounded-lg p-3 text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.label}</p>
                  <p className="text-muted-foreground break-words">{a.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => profile.removeAddress(a.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Eliminar ${a.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2">
          <Input
            placeholder="Etiqueta (Casa, Trabajo...)"
            value={newAddrLabel}
            onChange={(e) => setNewAddrLabel(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Dirección con referencias"
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
            />
            <Button onClick={addAddress} variant="outline" className="shrink-0" aria-label="Agregar dirección">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Tus datos y direcciones se guardan en este dispositivo.
        </p>
      </section>
    </div>
  );
}

export default function CuentaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      }
    >
      <CuentaContent />
    </Suspense>
  );
}
