/**
 * The current list, saved on the device. Every change goes through the pure
 * `listReducer`; this hook adds loading, saving and convenient derived values.
 * In weeks 3–4 the backend syncs the same actions; screens won't need to change.
 */
import { randomUUID } from 'expo-crypto';
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import { productsById as catalogueById } from '@/data/sample-catalogue';
import { ownerView, pruneExpired } from '@/domain/claims';
import { createList, listReducer } from '@/domain/list-reducer';
import { featuresFor } from '@/domain/settings';
import type { ListSettings, Product } from '@/domain/types';
import { budgetStatus, runningTotalMinor, sortedWishes } from '@/domain/wishlist';

import { loadList, saveList } from './storage';

function useWishlistValue() {
  const [state, dispatch] = useReducer(listReducer, undefined, () => createList(randomUUID()));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadList().then((saved) => {
      if (cancelled) return;
      if (saved) dispatch({ type: 'hydrate', state: { ...saved, claims: pruneExpired(saved.claims, Date.now()) } });
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save after every change, but never before the saved list has loaded (or we'd overwrite it).
  useEffect(() => {
    if (ready) saveList(state);
  }, [ready, state]);

  return useMemo(() => {
    const products: Record<string, Product> = { ...catalogueById, ...state.customProducts };
    const totalMinor = runningTotalMinor(state.marks, products);
    return {
      ready,
      list: state,
      settings: state.settings,
      features: featuresFor(state.settings.buyers),
      kidMode: state.kidMode,
      products,
      budget: budgetStatus(totalMinor, state.settings.budgetMinor),
      wishes: sortedWishes(state.marks, products),
      starsFor: (productId: string) => state.marks[productId]?.stars ?? null,
      /** Surprise mode: whether the list side may see that someone has this covered (never who). */
      coveredFor: (productId: string) =>
        featuresFor(state.settings.buyers).claiming &&
        ownerView(state.claims[productId], state.settings.surpriseMode, Date.now()) === 'taken-care-of',

      tap: (productId: string) => dispatch({ type: 'tap', productId, now: Date.now() }),
      setKidMode: (on: boolean) => dispatch({ type: 'setKidMode', on }),
      updateSettings: (patch: Partial<ListSettings>) => dispatch({ type: 'updateSettings', patch }),
      completeSetup: (settings: ListSettings) => dispatch({ type: 'completeSetup', settings }),
      claim: (productId: string, giverName: string) => dispatch({ type: 'claim', productId, giverName, now: Date.now() }),
      markBought: (productId: string, giverName: string) =>
        dispatch({ type: 'markBought', productId, giverName, now: Date.now() }),
      release: (productId: string, giverName: string) =>
        dispatch({ type: 'release', productId, giverName, now: Date.now() }),
      startGroupGift: (productId: string, organiserName: string) =>
        dispatch({ type: 'startGroupGift', productId, organiserName }),
      pledge: (productId: string, giverName: string, amountMinor: number) =>
        dispatch({ type: 'pledge', productId, giverName, amountMinor }),
      addCustomProduct: (product: Product) => dispatch({ type: 'addCustomProduct', product, now: Date.now() }),
      /** Starts a brand-new list (the old one is replaced). */
      reset: () => dispatch({ type: 'hydrate', state: createList(randomUUID()) }),
    };
  }, [state, ready]);
}

type Wishlist = ReturnType<typeof useWishlistValue>;

const WishlistContext = createContext<Wishlist | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const value = useWishlistValue();
  // Wait for the saved list (a few milliseconds) so screens never flash an empty list.
  if (!value.ready) return null;
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): Wishlist {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
