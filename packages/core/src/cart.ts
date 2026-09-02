import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
  category: "gemstone" | "rudraksha" | "vasthu" | "consultation";
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalAmount: () => number;
}

// Only real browsers have `localStorage`. Fall back to a no-op so this store
// can be safely imported (and merely unused) in SSR (Next.js) and React
// Native (Expo) contexts without throwing.
function getSafeStorage(): StateStorage {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.id === newItem.id);
          const qtyToAdd = newItem.quantity ?? 1;

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const existing = updatedItems[existingIndex];
            if (existing) {
              updatedItems[existingIndex] = {
                ...existing,
                quantity: existing.quantity + qtyToAdd
              };
            }
            return { items: updatedItems };
          }

          return {
            items: [...state.items, { ...newItem, quantity: qtyToAdd }]
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item))
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      }
    }),
    {
      name: "astrokraft-cart",
      storage: createJSONStorage(getSafeStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true
    }
  )
);
