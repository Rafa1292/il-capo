import { create } from "zustand";
import { persist } from "zustand/middleware";

// Perfil del cliente en el dispositivo. Complementa la identidad de la sesión
// (Google / OTP por correo): el login dice QUIÉN es, este store guarda sus datos
// de pedido (teléfono, direcciones) para pre-llenar el checkout sin re-tipear.

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
}

interface ProfileStore {
  name: string;
  phone: string;
  email: string;
  addresses: SavedAddress[];

  setProfile: (data: Partial<Pick<ProfileStore, "name" | "phone" | "email">>) => void;
  addAddress: (label: string, address: string) => void;
  removeAddress: (id: string) => void;
  /** Guarda/actualiza la dirección usada en un pedido (evita duplicados exactos). */
  rememberAddress: (address: string) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      name: "",
      phone: "",
      email: "",
      addresses: [],

      setProfile: (data) =>
        set((s) => ({
          name: data.name ?? s.name,
          phone: data.phone ?? s.phone,
          email: data.email ?? s.email,
        })),

      addAddress: (label, address) =>
        set((s) => ({
          addresses: [
            ...s.addresses,
            { id: `addr-${Date.now()}`, label: label.trim() || "Dirección", address: address.trim() },
          ],
        })),

      removeAddress: (id) =>
        set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),

      rememberAddress: (address) => {
        const trimmed = address.trim();
        if (!trimmed) return;
        const exists = get().addresses.some(
          (a) => a.address.trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) return;
        set((s) => {
          const next = [
            ...s.addresses,
            { id: `addr-${Date.now()}`, label: "Reciente", address: trimmed },
          ];
          // Cap solo de "Recientes": las direcciones agregadas a mano no se tocan.
          const recents = next.filter((a) => a.label === "Reciente");
          if (recents.length > 3) {
            return { addresses: next.filter((a) => a.id !== recents[0].id) };
          }
          return { addresses: next };
        });
      },

      clearProfile: () => set({ name: "", phone: "", email: "", addresses: [] }),
    }),
    { name: "il-capo-profile" }
  )
);
