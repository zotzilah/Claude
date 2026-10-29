/**
 * The current list, saved on the device. Every change goes through the pure
 * `listReducer`; this hook adds loading, saving and convenient derived values.
 * In weeks 3–4 the backend syncs the same actions; screens won't need to change.
 */
import { randomUUID } from 'expo-crypto';
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import { categories, productsById as catalogueById, productsIn, yourFinds } from '@/data/catalogue';
import { listSideView, pruneExpired, type ListSideView } from '@/domain/claims';
import { createList, listReducer } from '@/domain/list-reducer';
import { formatMoney, formatMoneyShort, moneyParts } from '@/domain/money';
import { featuresFor, isGrownUpOccasion } from '@/domain/settings';
import type { Category, ListSettings, ListState, Product } from '@/domain/types';
import { budgetStatus, otherCurrencyCount, runningTotalMinor, sortedWishes } from '@/domain/wishlist';

import { deviceLocale } from './locale';
import { useOwnerSync } from './owner-sync';
import { WEB_APP_URL } from './remote';
import { loadList, saveList } from './storage';

const newList = () => createList(randomUUID(), deviceLocale.currency);

function useWishlistValue() {
  const [state, dispatch] = useReducer(listReducer, undefined, newList);
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

  const sync = useOwnerSync(state, ready);

  return useMemo(() => {
    // Weddings and anniversaries have no catalogue: just what the couple add from shops.
    const grownUp = isGrownUpOccasion(state.settings.template);
    const products: Record<string, Product> = grownUp ? { ...state.customProducts } : { ...catalogueById, ...state.customProducts };
    const finds = Object.values(state.customProducts);
    const pages: Category[] = grownUp ? [yourFinds] : finds.length ? [...categories, yourFinds] : categories;
    const currency = state.settings.currency;
    const totalMinor = runningTotalMinor(state.marks, products, currency);
    return {
      ready,
      list: state,
      settings: state.settings,
      features: featuresFor(state.settings.buyers),
      kidMode: state.kidMode,
      /** Kid Mode with prices hidden (younger children, or a parent's choice). */
      hidePrices: state.kidMode && !state.settings.kidPricesShown,
      products,
      /** Catalogue pages, with "Your Finds" at the back once the family has added something. */
      pages,
      productsFor: (categoryKey: string) => (categoryKey === yourFinds.key ? finds : productsIn(categoryKey)),
      budget: budgetStatus(totalMinor, state.settings.budgetMinor),
      /** Circled items priced in another currency, which the total can't include. */
      uncountedItems: otherCurrencyCount(state.marks, products, currency),
      /** Writes an amount in the list's currency (or another), the phone's way: "£39.99", "39,99 €". */
      money: (minor: number, inCurrency = currency) => formatMoney(minor, inCurrency, deviceLocale.tag),
      /** Like `money`, without ".00" on round amounts. */
      moneyShort: (minor: number, inCurrency = currency) => formatMoneyShort(minor, inCurrency, deviceLocale.tag),
      moneyParts: (minor: number, inCurrency = currency) => moneyParts(minor, inCurrency, deviceLocale.tag),
      wishes: sortedWishes(state.marks, products),
      starsFor: (productId: string) => state.marks[productId]?.stars ?? null,
      /**
       * What the catalogue may show about who's buying a wish (see listSideView).
       * With the backend on, this comes from the server, which only ever tells the
       * parent what surprise mode allows.
       */
      listSideFor: (productId: string): ListSideView | null => {
        if (!featuresFor(state.settings.buyers).claiming) return null;
        const remote = sync.buying;
        if (!remote) return listSideView(state.claims[productId], state.settings.surpriseMode, Date.now(), state.kidMode);
        if (remote.mode === 'hidden') return null;
        if (remote.mode === 'covered') return remote.covered.has(productId) ? { kind: 'covered' } : null;
        return listSideView(remote.claims[productId], state.settings.surpriseMode, Date.now(), state.kidMode);
      },
      /** Saving to the backend: 'off' when there's no backend or the list isn't set up yet. */
      syncStatus: sync.status,
      /** The link the family opens to claim gifts (web, no app needed), once the list is saved online. */
      shareUrl: sync.shareToken ? `${WEB_APP_URL}/g/${sync.shareToken}` : null,
      shareToken: sync.shareToken,
      /** Replaces the family link (the old one stops working for anyone new). */
      renewShareLink: sync.renewShareLink,

      tap: (productId: string) => dispatch({ type: 'tap', productId, now: Date.now() }),
      /** Wedding lists: on the list, or off it. */
      toggle: (productId: string) => dispatch({ type: 'toggle', productId, now: Date.now() }),
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
      reset: () => dispatch({ type: 'hydrate', state: newList() }),
      /** Replaces this phone's list with one brought back by a backup code. */
      replaceList: (restored: ListState) => dispatch({ type: 'hydrate', state: restored }),
    };
  }, [state, ready, sync]);
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
