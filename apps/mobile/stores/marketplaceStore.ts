import { create } from 'zustand';

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  discount_price?: number;
  image?: string;
  vendor_name: string;
  quantity: number;
  stock: number;
}

interface MarketplaceState {
  products: any[];
  categories: any[];
  vendors: any[];
  selectedProduct: any | null;
  cart: CartItem[];
  filters: {
    category: string | null;
    search: string;
    minPrice: number | null;
    maxPrice: number | null;
    sortBy: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  };
  isLoading: boolean;

  setProducts: (products: any[]) => void;
  setCategories: (categories: any[]) => void;
  setVendors: (vendors: any[]) => void;
  setSelectedProduct: (product: any | null) => void;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;

  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const DEFAULT_FILTERS = {
  category: null,
  search: '',
  minPrice: null,
  maxPrice: null,
  sortBy: 'newest' as const,
};

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  products: [],
  categories: [],
  vendors: [],
  selectedProduct: null,
  cart: [],
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,

  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setVendors: (vendors) => set({ vendors }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
  setLoading: (loading) => set({ isLoading: loading }),

  addToCart: (item, quantity = 1) =>
    set((state) => {
      const existing = state.cart.find((c) => c.product_id === item.product_id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, existing.stock);
        return {
          cart: state.cart.map((c) =>
            c.product_id === item.product_id ? { ...c, quantity: newQty } : c
          ),
        };
      }
      return {
        cart: [...state.cart, { ...item, quantity }],
      };
    }),

  updateCartQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((c) => c.product_id !== productId) };
      }
      return {
        cart: state.cart.map((c) =>
          c.product_id === productId
            ? { ...c, quantity: Math.min(quantity, c.stock) }
            : c
        ),
      };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.product_id !== productId),
    })),

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => {
      const price = item.discount_price || item.price;
      return sum + price * item.quantity;
    }, 0);
  },

  getCartCount: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
