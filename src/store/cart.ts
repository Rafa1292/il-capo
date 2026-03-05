import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartModifierGroup, DeliveryMethod } from "@/types";

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
  notes: string;

  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, qty: number) => void;
  clearCart: () => void;
  setDeliveryMethod: (m: DeliveryMethod) => void;
  setCustomerInfo: (data: { name: string; phone: string }) => void;
  setDeliveryAddress: (address: string) => void;
  setNotes: (notes: string) => void;

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
      notes: "",

      addItem: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            { ...item, cartId: `${item.saleItemId}-${Date.now()}` },
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
          notes: "",
          deliveryMethod: "TAKEOUT",
        }),

      setDeliveryMethod: (deliveryMethod) => set({ deliveryMethod }),
      setCustomerInfo: ({ name, phone }) =>
        set({ customerName: name, customerPhone: phone }),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      setNotes: (notes) => set({ notes }),

      total: () => get().items.reduce((sum, i) => sum + itemTotal(i), 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "il-capo-cart" }
  )
);

export { itemTotal };
export type { CartModifierGroup };
