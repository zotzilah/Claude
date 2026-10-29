/**
 * Core domain types. See docs/PRODUCT_BRIEF.md §11.1 for the data model these follow.
 */

import type { ReviewFlag } from './moderation';

/** How much the Circler wants an item: ★ would like, ★★ really want, ★★★ the big one. */
export type Stars = 1 | 2 | 3;

/** A catalogue number in the form `NNN/NNNN`, e.g. `482/1190`. */
export type CatalogueNumber = string;

export type CategoryKey = string;

export interface Category {
  key: CategoryKey;
  /** Catalogue page title, e.g. "Building & Bricks". */
  title: string;
  /** One simple word for Kid Mode tiles, e.g. "Bricks". */
  kidLabel: string;
  icon: string;
  /** First three digits of every catalogue number in this category. */
  familyCode: number;
}

export interface Product {
  id: string;
  catalogueNo: CatalogueNumber;
  title: string;
  categoryKey: CategoryKey;
  /** Price in minor units (pence/cents) to avoid floating-point money. */
  priceMinor: number;
  currency: string;
  retailer: string;
  url: string;
  /** Placeholder artwork until real product images arrive from feeds. */
  emoji: string;
  /** Product photo, when we have one (e.g. from a pasted link). */
  imageUrl?: string;
  /** Added by a family: what the automatic checks want a person to look at before it's shared more widely. */
  reviewFlags?: ReviewFlag[];
}

/** A circled product on a list, with its star rating. */
export interface CircleMark {
  productId: string;
  stars: Stars;
  circledAt: number;
}

// ---------- List setup (brief §4) ----------

export type Template = 'christmas' | 'birthday' | 'wedding' | 'anniversary' | 'custom';

/** Who's circling: drives Kid Mode. */
export type Circler = 'child' | 'adult';

export type AgeBand = '3-5' | '6-8' | '9-12';

/** Who's buying: drives which Giver features show. */
export type Buyers = 'just-me' | 'partner' | 'family';

/**
 * How much the list side sees of the buying. Surprise is optional:
 * `off`: the list owner sees who's claimed and bought what, and can claim too.
 * `taken-care-of`: the owner and child see that something is covered, never who.
 * `hide-all`: they see nothing at all.
 * Kid Mode never shows who is buying, whatever this says.
 */
export type SurpriseMode = 'off' | 'taken-care-of' | 'hide-all';

export interface ListSettings {
  title: string;
  template: Template;
  circler: Circler;
  circlerName: string;
  ageBand: AgeBand | null;
  buyers: Buyers;
  budgetMinor: number;
  currency: string;
  runningTotalOn: boolean;
  surpriseMode: SurpriseMode;
  /** Whether prices show in Kid Mode. Off by default for under-8s (brief §4.3). */
  kidPricesShown: boolean;
}

// ---------- Givers (brief §7) ----------

export type ClaimStatus = 'held' | 'bought';

export interface Claim {
  productId: string;
  giverName: string;
  status: ClaimStatus;
  claimedAt: number;
  /** When a `held` claim expires. Irrelevant once bought. */
  heldUntil: number;
}

export interface Pledge {
  giverName: string;
  amountMinor: number;
}

export interface GroupGift {
  productId: string;
  organiserName: string;
  pledges: Pledge[];
}

// ---------- The whole list ----------

export interface ListState {
  id: string;
  settings: ListSettings;
  /** False until the parent has finished list setup. */
  setupComplete: boolean;
  kidMode: boolean;
  marks: Record<string, CircleMark>;
  /** Products added by pasting a link: private to this list. */
  customProducts: Record<string, Product>;
  claims: Record<string, Claim>;
  groupGifts: Record<string, GroupGift>;
}
