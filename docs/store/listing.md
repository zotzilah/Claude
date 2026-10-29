# Store listing (draft)

Everything the App Store and Google Play ask for, ready to paste. "Biro" is the working name, so swap it everywhere when the real name lands. The character counts are checked by `node docs/store/check-lengths.mjs`.

## Both stores

**App name** (30 max)
> Biro: Circle Your Wish List

**Category:** Shopping (secondary: Lifestyle). Not the Kids category: the parent is the user (see `docs/legal/store-privacy-answers.md`).

**Privacy policy URL:** the hosted `docs/legal/privacy-policy.md` page on the landing site.

**Support email:** [[CONTACT_EMAIL]]

## Apple App Store

**Subtitle** (30 max)
> The gift catalogue, but yours

**Promotional text** (170 max, can change any time without review)
> Remember circling the big Christmas catalogue? Hand your child the phone, let them circle what they love, and share the list with the family. No double-buying.

**Keywords** (100 max, comma-separated, no spaces)
> wishlist,christmas list,gift list,kids,registry,birthday,santa,presents,family,catalogue,circle

**Description** (4000 max)
> Remember the big gift catalogue, and circling everything you wanted in biro? Biro brings it back, for your family.
>
> CIRCLE IT
> Flip through bright catalogue pages and tap to draw a wobbly biro circle around anything you love. Tap again for stars: one for "would like", three for "the big one".
>
> MADE FOR KIDS, RUN BY GROWN-UPS
> Hand the phone over in Kid Mode. Children get big pictures, simple words and search, and nothing else: no shop links, no settings, no ads. Getting out needs your PIN or Face ID. Prices can be hidden for younger children, so they circle what they love, not what costs least.
>
> A RUNNING TOTAL
> See what the list adds up to against your budget as they circle.
>
> ADD ANYTHING FROM ANY SHOP
> Found the perfect thing? Paste the link and Biro reads the name, price and photo.
>
> NO MORE DOUBLE-BUYING
> Share the list with family by WhatsApp or text. They don't need the app: Nan opens the link, claims the dinosaur kit, and everyone else sees it's taken. Big gifts can be split, with one person organising.
>
> SURPRISE MODE, IF YOU WANT IT
> Want to be surprised too? Turn on surprise mode, and you'll only ever see "taken care of".
>
> THE BEST BIT
> When they're done, the till rings and an order slip prints out, just like the old catalogue counter. You get a copy by email.
>
> Biro never handles money and never shows ads to children.

**Review notes for Apple** (helps the reviewer get past the PIN)
> Biro is a wish list for families. To try Kid Mode: finish the 4-step setup, tap "Hand to [name]", choose any 4-digit PIN (e.g. 2580), and you'll be in Kid Mode. Tap "Grown-ups" and enter the same PIN to leave. The "Giver link" in the footer shows the family's view of the list, where you can claim items. No account is needed for any of this.

## Google Play

**Short description** (80 max)
> Kids circle what they want, family claims gifts. The old gift catalogue, reborn.

**Full description:** use the Apple description above. Play allows the same 4000 characters.

## Screenshots

Use the real screens from the tour (`Project Biro Tour` artifact). Each store wants phone screenshots, in this order:

| # | Screen | Caption on the image |
|---|---|---|
| 1 | Catalogue with circles and stars | Circle what you love |
| 2 | Kid Mode home | Made for little hands |
| 3 | Giver view with claims | No more double-buying |
| 4 | Running total over budget | Keep an eye on the total |
| 5 | Order slip | Ka-ching! The list is in |
| 6 | Add from a link | Add anything from any shop |

Sizes: Apple needs 6.9" iPhone shots (1320 × 2868). Google takes 1080 × 1920 or larger. Capture them from a development build on a real phone, or the simulator, once the developer accounts exist.
