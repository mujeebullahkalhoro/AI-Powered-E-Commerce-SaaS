import { create } from "zustand";
import { getCart } from "@/lib/api/cart";
import type { Cart } from "@/lib/api/types";

interface CartState {
  itemCount: number;
  syncCart: (cart: Cart) => void;
  refreshCart: () => Promise<void>;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,

  syncCart: (cart) => {
    set({ itemCount: cart.totals.itemCount });
  },

  refreshCart: async () => {
    try {
      const data = await getCart();
      set({ itemCount: data.cart.totals.itemCount });
    } catch {
      set({ itemCount: 0 });
    }
  },

  resetCart: () => {
    set({ itemCount: 0 });
  },
}));
