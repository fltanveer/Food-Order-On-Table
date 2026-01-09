
export interface Choice {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multi';
  required: boolean;
  max?: number;
  choices: Choice[];
}

export interface MenuItem {
  id: number;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  popular?: boolean;
  options: OptionGroup[];
  isAvailable?: boolean; // New property to track item availability
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface CartItem {
  cartId: string;
  itemId: number;
  name: string;
  image: string;
  quantity: number;
  selectedOptions: Record<string, Choice[]>;
  notes?: string;
  basePrice: number;
  totalPrice: number; // Unit price including options
}

export type Screen = 'welcome' | 'menu' | 'cart' | 'success';
