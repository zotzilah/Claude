/**
 * Placeholder catalogue for development and the Christmas 2026 beta build-up.
 * Products, prices and shops are made-up examples, not real listings.
 * Real products will come from the curated beta catalogue and, later, affiliate feeds.
 */
import { formatCatalogueNumber } from '@/domain/catalogue-number';
import type { Category, Product } from '@/domain/types';

export const categories: Category[] = [
  { key: 'bricks', title: 'Building & Bricks', kidLabel: 'Bricks', icon: '🧱', familyCode: 214 },
  { key: 'art', title: 'Arts & Crafts', kidLabel: 'Art', icon: '🎨', familyCode: 318 },
  { key: 'outdoor', title: 'Outdoor Fun', kidLabel: 'Outside', icon: '🚲', familyCode: 482 },
  { key: 'games', title: 'Games & Gadgets', kidLabel: 'Games', icon: '🎮', familyCode: 527 },
];

/** The page for products a family added themselves (pasted links). Only shown once there are some. */
export const yourFinds: Category = { key: 'yours', title: 'Your Finds', kidLabel: 'Yours', icon: '⭐', familyCode: 900 };

type Row = [id: string, category: string, sequence: number, title: string, priceMinor: number, emoji: string, retailer: string];

const rows: Row[] = [
  ['p1', 'bricks', 31, 'Space Station Brick Set, 780 pcs', 4499, '🚀', 'ToyTown'],
  ['p2', 'bricks', 47, 'Dino Dig Excavation Kit', 1299, '🦕', 'BigBox'],
  ['p3', 'bricks', 52, 'Mega Marble Run, 120 pcs', 3499, '🎢', 'ToyTown'],
  ['p4', 'bricks', 68, 'Build-a-Bot Robot Kit', 2999, '🤖', 'GadgetHut'],
  ['p5', 'bricks', 71, 'Knights Castle Playset', 3999, '🏰', 'BigBox'],
  ['p6', 'bricks', 93, 'Wooden Train Set, 60 pcs', 5499, '🚂', 'ToyTown'],
  ['p7', 'art', 102, 'Big Paint Set & Easel', 1499, '🎨', 'CraftCo'],
  ['p8', 'art', 115, 'Craft Treasure Box', 999, '✂️', 'CraftCo'],
  ['p9', 'art', 120, 'Learn-to-Knit Kit', 1199, '🧶', 'CraftCo'],
  ['p10', 'art', 134, 'Mega Crayon Tub, 200', 699, '🖍️', 'BigBox'],
  ['p11', 'art', 141, 'Sketch & Doodle Book', 499, '📓', 'BookNook'],
  ['p12', 'art', 157, 'Junior Bake Set', 1999, '🧁', 'HomeStore'],
  ['p13', 'outdoor', 1102, '16" Kids Bike, Blue', 14999, '🚲', 'CycleWorld'],
  ['p14', 'outdoor', 1190, 'Light-Up Scooter', 3999, '🛴', 'BigBox'],
  ['p15', 'outdoor', 1204, 'Pop-Up Football Goal', 2499, '⚽', 'SportZone'],
  ['p16', 'outdoor', 1218, 'Rainbow Stunt Kite', 899, '🪁', 'ToyTown'],
  ['p17', 'outdoor', 1223, 'Garden Play Tent', 2999, '🏕️', 'HomeStore'],
  ['p18', 'outdoor', 1239, 'Dino Paddling Pool', 2499, '🦖', 'BigBox'],
  ['p19', 'games', 301, 'Handheld Games Console', 19999, '🕹️', 'GadgetHut'],
  ['p20', 'games', 318, 'Kids Instant Camera', 5999, '📷', 'GadgetHut'],
  ['p21', 'games', 322, 'Volume-Safe Headphones', 1999, '🎧', 'GadgetHut'],
  ['p22', 'games', 337, 'Dinosaur Roar Torch', 799, '🔦', 'ToyTown'],
  ['p23', 'games', 345, 'Family Board Game Night', 1799, '🎲', 'BigBox'],
  ['p24', 'games', 359, 'Under-the-Sea Jigsaw, 500', 1299, '🧩', 'BookNook'],
];

const familyCode = Object.fromEntries(categories.map((c) => [c.key, c.familyCode]));

export const products: Product[] = rows.map(([id, categoryKey, sequence, title, priceMinor, emoji, retailer]) => ({
  id,
  catalogueNo: formatCatalogueNumber(familyCode[categoryKey], sequence),
  title,
  categoryKey,
  priceMinor,
  currency: 'GBP',
  retailer,
  url: 'https://example.com/product/' + id,
  emoji,
}));

export const productsById: Record<string, Product> = Object.fromEntries(products.map((p) => [p.id, p]));

export const productsIn = (categoryKey: string) => products.filter((p) => p.categoryKey === categoryKey);
