/**
 * Core domain types. See docs/PRODUCT_BRIEF.md §11.1 for the data model these follow.
 */

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
}

/** A circled product on a list, with its star rating. */
export interface CircleMark {
  productId: string;
  stars: Stars;
  circledAt: number;
}
