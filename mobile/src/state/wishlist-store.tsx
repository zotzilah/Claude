/**
 * In-memory list state for the current list. This becomes a Supabase-backed store
 * (with realtime claims) in weeks 3–4; screens only talk to this hook, so they won't change.
 */
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { productsById } from '@/data/sample-catalogue';
import type { CircleMark } from '@/domain/types';
import { budgetStatus, runningTotalMinor, sortedWishes, tapProduct } from '@/domain/wishlist';

interface WishlistState {
  title: string;
  circlerName: string;
  budgetMinor: number;
  runningTotalOn: boolean;
  kidMode: boolean;
  marks: Record<string, CircleMark>;
}

type Action =
  | { type: 'tap'; productId: string; now: number }
  | { type: 'setKidMode'; on: boolean };

function reducer(state: WishlistState, action: Action): WishlistState {
  switch (action.type) {
    case 'tap':
      return { ...state, marks: tapProduct(state.marks, action.productId, action.now) };
    case 'setKidMode':
      return { ...state, kidMode: action.on };
  }
}

const initialState: WishlistState = {
  title: "Ellie's Christmas Book 2026",
  circlerName: 'Ellie',
  budgetMinor: 15000,
  runningTotalOn: true,
  kidMode: false,
  marks: {},
};

function useWishlistValue() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return useMemo(() => {
    const totalMinor = runningTotalMinor(state.marks, productsById);
    return {
      ...state,
      budget: budgetStatus(totalMinor, state.budgetMinor),
      wishes: sortedWishes(state.marks, productsById),
      starsFor: (productId: string) => state.marks[productId]?.stars ?? null,
      tap: (productId: string) => dispatch({ type: 'tap', productId, now: Date.now() }),
      setKidMode: (on: boolean) => dispatch({ type: 'setKidMode', on }),
    };
  }, [state]);
}

type Wishlist = ReturnType<typeof useWishlistValue>;

const WishlistContext = createContext<Wishlist | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const value = useWishlistValue();
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): Wishlist {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
