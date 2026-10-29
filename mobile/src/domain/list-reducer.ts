/**
 * Every change to a list goes through this reducer. It's pure, so the same actions
 * can later be replayed against the backend, and it's easy to test.
 * Invalid actions (e.g. claiming something already claimed) leave the state unchanged;
 * screens check the rules first so people see why.
 */
import * as rules from './claims';
import { defaultSettings } from './settings';
import type { ListSettings, ListState, Product } from './types';
import { tapProduct } from './wishlist';

export type ListAction =
  | { type: 'tap'; productId: string; now: number }
  | { type: 'setKidMode'; on: boolean }
  | { type: 'updateSettings'; patch: Partial<ListSettings> }
  | { type: 'completeSetup'; settings: ListSettings }
  | { type: 'claim'; productId: string; giverName: string; now: number }
  | { type: 'markBought'; productId: string; giverName: string; now: number }
  | { type: 'release'; productId: string; giverName: string; now: number }
  | { type: 'startGroupGift'; productId: string; organiserName: string }
  | { type: 'pledge'; productId: string; giverName: string; amountMinor: number }
  | { type: 'addCustomProduct'; product: Product; now: number }
  | { type: 'hydrate'; state: ListState };

/** A new, empty list. `currency` is the family's local one (see `currencyForRegion`). */
export function createList(id: string, currency = 'GBP'): ListState {
  return {
    id,
    settings: defaultSettings(currency),
    setupComplete: false,
    kidMode: false,
    marks: {},
    customProducts: {},
    claims: {},
    groupGifts: {},
  };
}

export function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case 'tap':
      return { ...state, marks: tapProduct(state.marks, action.productId, action.now) };

    case 'setKidMode':
      // Kid Mode needs a child to hand the phone to.
      return { ...state, kidMode: action.on && state.settings.circler === 'child' };

    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'completeSetup':
      return { ...state, settings: action.settings, setupComplete: true };

    case 'claim':
    case 'markBought':
    case 'release': {
      const fn = action.type === 'claim' ? rules.claim : action.type === 'markBought' ? rules.markBought : rules.release;
      const claims = fn(state.claims, action.productId, action.giverName.trim(), action.now);
      return typeof claims === 'string' ? state : { ...state, claims };
    }

    case 'startGroupGift':
      return { ...state, groupGifts: rules.startGroupGift(state.groupGifts, action.productId, action.organiserName.trim()) };

    case 'pledge':
      return {
        ...state,
        groupGifts: rules.pledge(state.groupGifts, action.productId, action.giverName.trim(), action.amountMinor),
      };

    case 'addCustomProduct': {
      // Adding a product you found yourself circles it straight away.
      const customProducts = { ...state.customProducts, [action.product.id]: action.product };
      const marks = state.marks[action.product.id]
        ? state.marks
        : tapProduct(state.marks, action.product.id, action.now);
      return { ...state, customProducts, marks };
    }

    case 'hydrate':
      return action.state;
  }
}
