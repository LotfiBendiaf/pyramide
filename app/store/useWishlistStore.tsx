"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  items: ListingItem[];
  addItem: (item: ListingItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const exists = get().items.some((i) => i.id === item.id);
        if (!exists) {
          set((state) => ({ items: [...state.items, item] }));
        }
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (id) => get().items.some((i) => i.id === id),
    }),
    {
      name: "wishlist-storage",
    }
  )
);
