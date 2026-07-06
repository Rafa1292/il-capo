export interface CombinableElement {
  modifierElementId: string;
  name: string;
  price: number;
}

export interface ModifierElement {
  modifierElementId: string;
  name: string;
  price: number;
  // Combinación (mitad y mitad): si el sabor es combinable, trae las opciones de la otra mitad
  combinable?: boolean;
  combinableModifierGroupId?: string | null;
  combinableGroupElements?: CombinableElement[] | null;
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
  imageUrl?: string | null;
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

// Pizza Builder types
export interface PizzaBuilderSize {
  id: string;
  name: string;
  basePrice: number;
  maxToppingsPerHalf: number;
  sortOrder: number;
  imageUrl: string | null;
}

export interface PizzaBuilderDough {
  id: string;
  name: string;
  extraPrice: number;
  sortOrder: number;
  imageUrl: string | null;
}

export interface PizzaBuilderSauce {
  id: string;
  name: string;
  extraPrice: number;
  isDefault: boolean;
  sortOrder: number;
  imageUrl: string | null;
}

export interface PizzaBuilderTopping {
  id: string;
  name: string;
  unitType: "GRAMS" | "UNITS";
  pricePerUnit: number;
  maxPortions: number;
  emoji: string | null;
  imageUrl: string | null;
  sortOrder: number;
  portionsBySize: { sizeId: string; unitsPerPortion: number; unitsPerHalf: number }[];
}

export interface PizzaBuilderToppingGroup {
  id: string;
  name: string;
  maxPerHalf: number | null;
  sortOrder: number;
  toppings: PizzaBuilderTopping[];
}

export interface PizzaBuilderData {
  config: { halvesEnabled: boolean; saleItemId: string | null };
  sizes: PizzaBuilderSize[];
  doughs: PizzaBuilderDough[];
  sauces: PizzaBuilderSauce[];
  toppingGroups: PizzaBuilderToppingGroup[];
}

export interface PizzaBuilderCartSelection {
  sizeId: string;
  doughId: string;
  sauceId: string;
  isHalf: boolean;
  toppings?: { toppingId: string; portions: number }[];
  leftToppings?: { toppingId: string; portions: number }[];
  rightToppings?: { toppingId: string; portions: number }[];
}

// Cart types
export interface CartModifierElement {
  modifierElementId: string;
  name: string;
  price: number;
  quantity: number;
  isCombined?: boolean; // true = es la 2ª mitad de una pizza combinada
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
  pizzaBuilder?: PizzaBuilderCartSelection;
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
