export interface ModifierElement {
  modifierElementId: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  modifierGroupId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  showLabel: boolean;
  sortOrder: number;
  elements: ModifierElement[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

// Cart types
export interface CartModifierElement {
  modifierElementId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartModifierGroup {
  modifierGroupId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  showLabel: boolean;
  sortOrder: number;
  elements: CartModifierElement[];
}

export interface CartItem {
  cartId: string; // unique per cart line
  saleItemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  modifiers: CartModifierGroup[];
}

export type DeliveryMethod = "TAKEOUT" | "DELIVERY";

export interface OrderStatus {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  rejectedReason?: string;
  customerName: string;
  deliveryMethod: DeliveryMethod;
  estimatedTotal: number;
  createdAt: string;
}
