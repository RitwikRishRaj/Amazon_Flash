import { create } from 'zustand';
import type { Product } from '@app-types/index';

const MAX_COMPARE = 4;

interface CompareState {
    items: Product[];
    toggle: (product: Product) => void;
    remove: (productId: string) => void;
    clear: () => void;
    has: (productId: string) => boolean;
    isFull: () => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
    items: [],

    toggle: (product) => {
        const { items } = get();
        const exists = items.some((p) => p.id === product.id);
        if (exists) {
            set({ items: items.filter((p) => p.id !== product.id) });
        } else if (items.length < MAX_COMPARE) {
            set({ items: [...items, product] });
        }
    },

    remove: (productId) =>
        set((state) => ({ items: state.items.filter((p) => p.id !== productId) })),

    clear: () => set({ items: [] }),

    has: (productId) => get().items.some((p) => p.id === productId),

    isFull: () => get().items.length >= MAX_COMPARE,
}));

export { MAX_COMPARE };
