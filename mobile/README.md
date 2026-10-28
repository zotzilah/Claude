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
| `npm run sounds` | Regenerate the sound effects in `assets/sounds/` |
| `npm run icons` | Regenerate the app icon and splash (needs Playwright's Chromium) |

## What's where

```
src/
  app/                Screens (every file is a route)
    setup.tsx           List setup wizard (first launch, and Settings)
    index.tsx           The catalogue: category pages, circling, running total
    kid.tsx             Kid Mode home: search bar, picture tiles, Send to Mum & Dad
    pin.tsx             The grown-ups' PIN gate (create, or unlock Kid Mode)
    search.tsx          Search by name or catalogue number
    add.tsx             Paste a shop link to add any product
    slip.tsx            The order slip
    l/[listId].tsx      The Giver link: claims, surprise mode, group gifts
  audio/              Sound effects player and mute setting
  components/         Product card, biro ring, page turner, PIN pad, Giver item…
  domain/             Pure logic with unit tests: list reducer, claims, search,
                      catalogue numbers, product-page parsing, order slip email…
  data/               Sample catalogue (made-up products for development)
  state/              The saved list, PIN storage, page fetching
  theme/              Colours, fonts and spacing
scripts/              Sound and icon generators
```

## Status

Working on one device (no backend yet):
- **List setup:** occasion, who's circling, who's buying, budget and surprise mode
- **Catalogue:** page turns, circling with stars, running total, sounds and haptics. Lists are saved on the device.
- **Kid Mode:** picture tiles and big search, locked behind a parent PIN, Face ID or fingerprint
- **Search:** forgiving name search and catalogue numbers
- **Paste a link** from any shop to add it to "Your Finds"
- **Giver link:** claims with a 48-hour hold, "I've bought it", surprise mode and group gift pledges
- **Order slip:** an animated printout, plus an email template (sent once the backend exists)
- **Icon and splash** in Biro style

**Next, needing free accounts:** the backend (Supabase) so lists are shared between phones, and a development build (Expo account) for voice search and the share-sheet button. See the issues on GitHub.

The sounds are synthesised placeholders from `scripts/generate-sounds.mjs`. To swap in recorded ones later, replace the files in `assets/sounds/` and keep the same names.
