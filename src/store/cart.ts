import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartModifierGroup, DeliveryMethod } from "@/types";

// Contador para garantizar cartId únicos aunque se agreguen varias líneas en el mismo ms
let cartSeq = 0;

function itemTotal(item: CartItem): number {
  const modifierSum = item.modifiers.reduce(
    (sum, g) => sum + g.elements.reduce((s, e) => s + e.price * e.quantity, 0),
    0
  );
  return (item.unitPrice + modifierSum) * item.quantity;
}

interface CartStore {
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  /**
   * Sede a la que pertenecen estos productos. Cada sede es un tenant distinto
   * en nico, con su propio catálogo: mezclar dos sedes en un carrito da
   * identificadores que no existen y el cobro falla artículo por artículo.
   */
  locationSlug: string | null;
  /** Punto exacto de entrega. Define la zona y con ella el costo del envío. */
  deliveryPin: { latitude: number; longitude: number } | null;
  notes: string;
  cartOpen: boolean;

  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, qty: number) => void;
  clearCart: () => void;
  setDeliveryMethod: (m: DeliveryMethod) => void;
  setCustomerInfo: (data: { name: string; phone: string }) => void;
  setDeliveryAddress: (address: string) => void;
  setDeliveryPin: (pin: { latitude: number; longitude: number } | null) => void;
  /** Cambia de sede. Si es otra, se lleva el carrito: es de otro catálogo. */
  setLocation: (slug: string) => void;
  setNotes: (notes: string) => void;
  setCartOpen: (open: boolean) => void;

  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryMethod: "TAKEOUT",
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      locationSlug: null,
      deliveryPin: null,
      notes: "",
      cartOpen: false,

      addItem: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            { ...item, cartId: `${item.saleItemId}-${Date.now()}-${cartSeq++}` },
          ],
        })),

      removeItem: (cartId) =>
        set((s) => ({ items: s.items.filter((i) => i.cartId !== cartId) })),

      updateQuantity: (cartId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.cartId !== cartId)
              : s.items.map((i) => (i.cartId === cartId ? { ...i, quantity: qty } : i)),
        })),

      clearCart: () =>
        set({
          items: [],
          customerName: "",
          customerPhone: "",
          deliveryAddress: "",
          deliveryPin: null,
          notes: "",
          deliveryMethod: "TAKEOUT",
        }),

      setDeliveryMethod: (deliveryMethod) => set({ deliveryMethod }),
      setCustomerInfo: ({ name, phone }) =>
        set({ customerName: name, customerPhone: phone }),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      setDeliveryPin: (deliveryPin) => set({ deliveryPin }),

      setLocation: (locationSlug) =>
        set((s) =>
          // Primera vez (o la misma sede): solo se anota, sin tocar el carrito.
          s.locationSlug === null || s.locationSlug === locationSlug
            ? { locationSlug }
            : {
                locationSlug,
                items: [],
                // La dirección y el pin también se van: las zonas de entrega
                // son por sede, y el envío se cotiza desde otro local.
                deliveryAddress: "",
                deliveryPin: null,
              }
        ),
      setNotes: (notes) => set({ notes }),
      setCartOpen: (cartOpen) => set({ cartOpen }),

      total: () => get().items.reduce((sum, i) => sum + itemTotal(i), 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "il-capo-cart",
      partialize: (state) => ({
        items: state.items,
        deliveryMethod: state.deliveryMethod,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        deliveryAddress: state.deliveryAddress,
        locationSlug: state.locationSlug,
        // Persistido a propósito: el cliente se va a Tilopay y vuelve, y el pin
        // tiene que seguir ahí para registrar el pedido con el mismo envío.
        deliveryPin: state.deliveryPin,
        notes: state.notes,
      }),
    }
  )
);

export { itemTotal };
export type { CartModifierGroup };
