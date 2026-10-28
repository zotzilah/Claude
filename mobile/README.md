# Project Biro: mobile app

The iOS, Android and web app (one codebase, Expo SDK 58, TypeScript, Expo Router).
Product decisions live in [`../docs/PRODUCT_BRIEF.md`](../docs/PRODUCT_BRIEF.md).

## Try it on your phone

You need [Node.js LTS](https://nodejs.org) on your computer and the free **Expo Go** app on your phone.

```bash
git clone <this repo>
cd Claude/mobile
npm install
npx expo start
```

Scan the QR code: on iPhone use the Camera app, on Android use Expo Go. Your phone and computer need to be on the same Wi-Fi network.

## Commands

| Command | What it does |
|---|---|
| `npm start` | Start the dev server |
| `npm test` | Run the unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npx expo export -p web` | Production web build into `dist/` |

## What's where

```
src/
  app/              Screens (every file is a route)
    index.tsx         The catalogue: category pages, circling, running total
    kid.tsx           Kid Mode home: picture tiles
    slip.tsx          The order slip
    l/[listId].tsx    The Giver web link, e.g. /l/ellie-xmas-26
  components/       Product card, biro ring, price sticker, running total, big button
  domain/           Pure logic with unit tests: stars, totals, catalogue numbers, wobbly circles
  data/             Sample catalogue (made-up products for development)
  state/            List state (in memory for now; Supabase in weeks 3–4)
  theme/            Colours, fonts and spacing
```

## Status

Week 1 foundations: done. The catalogue renders, tapping circles and stars items, and the running total, Kid Mode tiles, order slip and Giver list all read the same list state.

Still placeholders: the page-turn animation, circle draw-on animation, sounds, voice search, the Kid Mode PIN, the backend, claims and notifications. See the roadmap in the brief.
