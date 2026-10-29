/**
 * American English: only the words that differ from British English.
 * Anything not listed here falls back to `en-GB.ts`.
 */
import type { StringOverrides } from './index';

export const enUS: StringOverrides = {
  common: {
    sendToParents: 'Send to Mom & Dad',
    theShop: 'the store',
  },
  setup: {
    familyNote: 'Grandparents, aunts, uncles: claiming, surprise mode and group gifts',
  },
  add: {
    kicker: 'ADD FROM ANY STORE',
    help: (name) =>
      `Found something ${name || 'they'} would love? Copy the link from the store's app or website and paste it here.`,
    linkA11y: 'Store link',
    looking: "Looking at the store's page…",
    notALink: "That doesn't look like a store link. It should start with https://",
    shop: 'Store',
    privateNote: 'Only your list sees this. Givers tap through to the store to buy it.',
    failure: {
      timeout: 'That store took too long to answer. Fill in the details below.',
      blocked: "We couldn't read that page (some stores block it). Fill in the details below.",
    },
    refused: {
      'adult-site': "Sorry, that store can't be added to a Biro list.",
      'not-a-shop': "That link doesn't look like a store. Try the product's own page.",
    },
  },
  giver: {
    nameExample: 'e.g. Grandma',
  },
};
