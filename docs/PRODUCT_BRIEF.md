# Product Brief — the circle-it catalogue app

> **Working codename:** Project Biro (the real name will come later)
> **Status:** Design brief v1, written from the founder interview on 28 Oct 2026
> **First release focus:** Kids' Christmas lists

This is the shared source of truth for the product. Any person, AI tool or agent working on this project should read it first and keep it up to date when decisions change.

---

## 1. The pitch

Remember sitting on the floor with the Argos catalogue in the autumn of 2000, circling everything you wanted with a biro? This app brings that back, but the circles become a real, shareable wishlist.

**A wishlist tool that uses year-2000 catalogue nostalgia as its design language.** The nostalgia is not decoration. It makes a dull job (writing and organising a gift list) feel like fun.

- The **Circler** (a kid, or a couple) flicks through a catalogue built for them, wobbly-circles what they want and stars their favourites.
- The **Givers** (parents, family, wedding guests) get the list. They see prices and a running total, then click through to the real seller to buy.
- One list, two sides. Every list can adapt to who it's for and who's buying.

## 2. Product principles

1. **Feels like 2000, works like 2026.** Modern usability first, catalogue feel second. If a nostalgic detail makes something harder to use, the detail loses.
2. **Simple beats clever.** Categories over filter overload. Big buttons, simple words.
3. **Kids can do it themselves.** A child should be able to find and circle things without asking Mum to type.
4. **Protect the surprise.** Recipients never see who bought what unless the list owner chooses to.
5. **No duplicate gifts, no forgotten claims.** Claiming is fast, and claims expire.
6. **We point people to the seller.** We show the photo, name and price only. Full details, reviews and checkout stay on the seller's site.
7. **The catalogue grows itself.** Every product a user shares in can make the catalogue richer for the next person, once it has been checked.

## 3. People and roles

| Role | Who | Has an account? | Uses |
|---|---|---|---|
| **List Owner** | Parent, or the couple | Yes | App (iOS / Android) |
| **Circler** | The child (in Kid Mode), or the couple themselves | No. Kids never have their own account | The Owner's device, in Kid Mode |
| **Giver** | Other parent, grandparents, family, wedding guests | Optional | **Web link, no app download needed**, or the app |
| **Organiser** | The Giver who leads a group gift | Optional | Web link or app |

> Naming note: avoid "Recipient" in the UI, because it reads as "the person getting the gift". Use **Circler** and **Giver** (with **Santa's Helpers** as a possible seasonal skin).

## 4. Creating a list

### 4.1 Templates
- **Christmas** (MVP)
- **Birthday**
- **Wedding / Registry**
- **Baby shower**, **Housewarming** (later)
- **Custom**, with optional filters for:
  - **Shops** (include or exclude retailers)
  - **Price range**
  - **Delivery time** ("arrives within 2 days", for the dads who left it late)

### 4.2 The "situation" step
During setup the owner answers two quick questions, and the interface adapts:

1. **Who's circling?** → *A child* (turns on Kid Mode, age band, budget) / *Us* (couple) / *Me*
2. **Who's buying?** → *Just me* / *Me and a partner* / *Family* / *Lots of guests*

| Feature | Just me | Partner / family | Lots of guests (wedding) |
|---|---|---|---|
| Running total | On by default | On by default | Off by default (toggle) |
| Budget cap | Optional | Optional | n/a |
| Claiming | Hidden (only one buyer) | On | On |
| Surprise mode | n/a | Optional (off by default) | Optional (off by default) |
| Group gifts | n/a | On | On |
| Group chat invite | n/a | Optional | Optional |

### 4.3 Running total
- A toggle per list. It's on by default for kids' lists and off for weddings.
- Shows the total of all circled items, with an optional **budget** line.
- Goes **red** when over budget, with a gentle nudge rather than a nag.
- Sort by price, and a **"swap for cheaper"** suggestion on expensive items (same category, lower price).
- The child can see the total or not. This is a parental setting, off by default for under-8s.

## 5. The catalogue

### 5.1 Browsing
- **Swipe to turn pages**, with a page-turn animation and paper rustle sound.
- Each page is a **category spread** (e.g. *Building & Bricks*, *Arts & Crafts*, *Outdoor*), with a dense 2000-style product grid on white.
- An **index** at the back (categories A–Z), just like the real thing.
- **Categories, not filters**, while browsing. Filters belong to list setup (section 4.1).

### 5.2 Product cards
Each card shows only:
- Product photo (on white)
- Product name
- **Price** (in a loud price sticker)
- **Catalogue number** (e.g. `482/1190`)
- Retailer name
- A tap-through to the seller's page (Owner and Giver views only, never in Kid Mode)

### 5.3 Catalogue numbers and the product library
- Every product in the library gets a permanent catalogue number in the format `NNN/NNNN`.
- The first three digits encode the category family, and the last four are sequential within it.
- **Search by catalogue number** works everywhere ("Nan rang and said 482/1190").
- The **Product Library** is the master database behind every catalogue, searchable by name, category or catalogue number.

### 5.4 Circling and stars
- **Wobbly biro circles.** Each circle is procedurally generated, so no two are identical. They overshoot and don't quite close, like real hand-drawn ones.
- Biro **scribble sound** plus a light **haptic** tick.
- **Stars** show how much something is wanted:
  - ⭐ Would like
  - ⭐⭐ Really want
  - ⭐⭐⭐ The big one
- **Interaction:** tap once to circle (⭐), tap again for ⭐⭐, again for ⭐⭐⭐, and a fourth tap rubs it out. Long-press opens a menu (remove, add a note).
- **Margin notes** (later): a short scribble like "the BLUE one".

## 6. Kid Mode

The owner sets up the list, then hands over the device.

- **Locked down.** Search, browse, circle and star only. No seller links, no settings, no prices if the owner hides them.
- **Exit with a parent PIN** (or Face ID / Touch ID), using the OS parental gate pattern.
- **Voice search is essential.** A huge microphone button: say "DINOSAURS!" and get results. On-device speech recognition where available.
- **Picture categories.** Big tiles with one simple word each (Lego, Dolls, Dinosaurs, Art, Outdoor, Games).
- **Big buttons, simple words.** Readable by a 5-year-old, with icons always beside text.
- Kid catalogues **only show moderated, approved products** (see section 8.3).

### 6.1 The "done" moment
1. The child taps a big **"Send to Mum & Dad"** button.
2. An old-school **cash register** sound plays: clunk, ding, then receipt printer chatter.
3. A **printed order slip** slides out showing the child's name, circled items, stars and catalogue numbers, plus a parody queue line: *"Your number is 47. Please wait for Christmas."*
4. The slip is **emailed to the account holder** as a confirmation receipt.

## 7. Givers: the buying side

### 7.1 Web link first
- Every list has a shareable **web link**. Givers can view, claim and confirm **without installing the app**.
- Links can be shared by WhatsApp, text, email or QR code (handy on wedding invites).

### 7.2 Claiming
- A Giver taps **Claim** on an item and it is held for them for **48 hours**.
- Within 48 hours they tap **"I've bought it"** (honour system).
- If they don't, they get reminders at 24h and 6h. After 48h the claim **expires** and the item goes back on the list.
- Nobody else can claim a held item, which prevents duplicates.

### 7.3 Surprise mode (optional)
- **Off by default** (founder decision, 29 Oct 2026). The list owner sees who has claimed and bought what, and can claim gifts too, which suits a parent who is also buying.
- **Owners who want the surprise switch it on**, choosing either:
  - **"Taken care of":** the owner and child see that an item is covered, never who
  - **"Hide everything":** they see nothing at all
- **Kid Mode never shows the child who is buying**, whatever the setting.
- The database enforces this, not just the app. While surprise is on, the owner can't read claims or act as a giver, even if they joined as one earlier.
- Givers always see everything: claimed, bought and by whom (within the family or guest group).

### 7.4 Group gifts
- Any item can be marked as a **group gift** (suggested automatically above a price threshold, e.g. £100).
- One Giver becomes the **Organiser**: they buy the item and collect money from others **directly, outside the app**.
- The app only **tracks pledges** ("Dave: £50, Auntie Sue: £25, £75 of £149.99 pledged"), so it never handles money.
- When the pledges are complete, the Organiser confirms the purchase.

## 8. Products: where they come from

### 8.1 Affiliate product feeds (primary)
- Import products from affiliate networks and retailer feeds (e.g. Awin, CJ, Rakuten, Impact, and Amazon's product API once eligible).
- Every outbound link is an **affiliate link**, which is the future revenue base. Monetisation decisions are deferred for now; see section 13.
- **Real prices and stock**, refreshed on a schedule where the feed allows. Items show "price changed" or "no longer available" rather than silently disappearing.
- **Global from day one**: products are tagged by region and currency, and users only see retailers that ship to them.

### 8.2 Share to add anything
- On any shop website or app on their phone, the user taps **Share → [our app]**.
- We fetch the page's product metadata (Open Graph / schema.org `Product`: image, name, price, currency) and drop the item straight onto the user's list.
- The link is converted to an affiliate link where we have a relationship with that retailer.

### 8.3 The crowd-built catalogue and moderation
User-shared items make the public catalogue grow, but only safely:

1. A shared item goes onto **that user's list straight away**, visible only to that list.
2. It enters the **moderation pipeline**:
   - automatic checks for prohibited or adult categories, unsafe content in images and text, broken or redirecting links, duplicates (merged with existing items by URL, GTIN or EAN, or fuzzy match), and retailer allow and block lists
   - a **human review queue** for anything flagged or borderline
3. Once approved, it joins the **public Product Library** with its own catalogue number.
4. **Kid catalogues show approved items only**, with age-band tagging.

## 9. Notifications and sharing

| Event | Owner (app) | Giver (app) | Giver (web link) |
|---|---|---|---|
| Child sent their list | Push + **email order slip** | n/a | n/a |
| Item added or changed | Optional push | Push | Optional email digest |
| Item claimed / bought | Push (respecting surprise mode) | Push | n/a |
| Claim expiring (24h / 6h) | n/a | Push | Email |
| Group gift pledge | n/a | Push | Email |
| List finalised | **Email confirmation** | Push | Email |

**WhatsApp**
- v1: one-tap **share list to WhatsApp**, with a link preview card.
- v1.5: when Givers accept an invite to a list, offer an **optional group chat** for that list (e.g. "Ellie's Christmas 2026: Givers") to coordinate group gifts. The List Owner and Circler are never in it, to protect the surprise.
- Technical note: creating groups automatically needs the WhatsApp Business Platform through a provider, which has eligibility rules and limits. The fallback is for the Organiser to create the group and the app to share its invite link.

## 10. Visual identity: the year 2000, loud and primary

- **Palette:** catalogue red, royal blue and price-sticker yellow on glossy white page stock, with black body text.
- **Type:** a heavy grotesque for headings and prices, a condensed sans for dense product text, and a handwriting face for biro circles, stars and notes.
- **Motifs:**
  - starburst price stickers ("ONLY £12.99")
  - bold page headers with page numbers
  - index tabs on the page edge
  - dense grids on white
  - catalogue numbers everywhere
  - till receipts and order slips
  - the little blue pen as the cursor and mascot
- **Sound:** page rustle, biro scribble, cash register, receipt printer. All can be muted.
- **Haptics** on circle, star and send.
- **Legal:** this is *inspired by* the 2000s catalogue era. We do not use Argos's name, logo or trade dress, or any other retailer's.

A clickable visual mockup lives in [`prototype/catalogue-mockup.html`](../prototype/catalogue-mockup.html).

## 11. Technical approach

| Area | Choice | Why |
|---|---|---|
| App | **React Native + Expo** (TypeScript) | iOS and Android from one codebase, fast iteration, big ecosystem |
| Giver web link | **Expo Router web** (same codebase) | One set of components and logic for both |
| Backend | **Supabase** (Postgres, Auth, Realtime, Storage, Edge Functions) | Realtime claim updates, row-level security for surprise mode, quick to build on |
| Animations | Reanimated + Skia | Page turns and procedural wobbly circles at 60fps |
| Voice search | On-device speech recognition (iOS Speech / Android SpeechRecognizer) | Fast, private, no audio leaves the device where possible |
| Audio and haptics | expo-audio, expo-haptics | Biro, page and till sounds |
| Share extension | Native share extension (iOS) and share intent (Android), via an Expo config plugin | "Share → our app" from any shop |
| Product ingestion | Scheduled jobs pulling affiliate feeds, plus a metadata scraper for shared URLs | Prices, stock, dedupe |
| Push | Expo Notifications (APNs / FCM) | |
| Email | Transactional provider (e.g. Resend or Postmark) | Order slip receipts, finalised list confirmations |
| WhatsApp | Share links (v1), then the Business Platform via a provider (v1.5) | |

### 11.1 Core data model (sketch)

```
Account        (id, email, region, currency)
List           (id, owner_id, template, situation, title, budget, running_total_on, surprise_mode, status)
CircleMark     (list_id, product_id, stars 1–3, note, circled_at, circle_seed)
Product        (id, catalogue_no, title, image_url, price, currency, retailer_id, url, affiliate_url,
                region[], category_id, age_band, status: pending|approved|rejected, last_checked_at, in_stock)
Retailer       (id, name, regions[], affiliate_network, ships_to[])
Category       (id, name, kid_label, icon, family_code)
Giver          (id, list_id, account_id?, display_name, invite_token)
Claim          (id, list_id, product_id, giver_id, status: held|bought|expired, held_until)
GroupGift      (id, list_id, product_id, organiser_giver_id, target_amount)
Pledge         (group_gift_id, giver_id, amount)
ModerationItem (product_id, submitted_by, flags[], decision, reviewer)
```

`circle_seed` stores the random seed for each wobbly circle, so a child's circle looks the same every time it's shown.

## 12. Safety, privacy and compliance

- **Children never have accounts.** The parent is the account holder, and Kid Mode is a locked session on the parent's device.
- **COPPA (US), UK Age Appropriate Design Code, GDPR / UK GDPR:**
  - collect the minimum data from Kid Mode
  - no behavioural ads or third-party tracking in Kid Mode
  - voice is processed on-device where possible and never stored
- **App Store placement:** list under Shopping or Lifestyle, not the Kids Category, because the main user is the parent. Kid Mode still follows Apple's Kids Category principles: a parental gate before any external link or setting, and no ads.
- **Affiliate disclosure:** a clear "We may earn a commission" notice in the Giver views.
- **Trademark:** our own name and branding only.
- **Moderation:** see section 8.3. Kid catalogues show approved products only.

## 13. Business model (deferred)

**Product first.** Options to revisit after launch:
- affiliate commission on outbound clicks
- a premium tier (wedding features, unlimited lists, printable catalogue, custom themes)
- clearly separated sponsored catalogue pages (never in Kid Mode)

## 14. Scope and roadmap

### MVP: kids' Christmas
- Parent account, a Christmas template and the situation step (*just me* / *family*)
- A catalogue of curated, approved products with swipe pages, categories and catalogue numbers
- Wobbly circles, stars, sounds and haptics
- Kid Mode: picture categories, voice search, PIN exit
- Running total with budget
- The "Send to Mum & Dad" order slip, till sound and email receipt
- A Giver web link with claim (48h), "I've bought it", surprise mode and group gift pledges
- Push for app users, email for web Givers
- Share-to-add, to the user's own list only (public catalogue moderation comes in v1.1)

### v1.1
- The moderation pipeline and crowd-built public catalogue
- Search by catalogue number across the whole library
- Delivery-time and shop filters in the custom template
- WhatsApp share cards

### v1.5: weddings and big groups
- Wedding / Registry and Birthday templates
- A "lots of guests" situation, QR codes for invites
- WhatsApp group chat for Givers

### Later
- Margin notes, an index page, seasonal skins, printable catalogues, monetisation

### Timeline reality check
Today is **28 Oct 2026**, so Christmas 2026 is about 8 weeks away. App store review, affiliate network approvals (which can take weeks, and some networks need existing sales) and a proper safety review make a full public launch this Christmas very risky. Recommended:
- **Christmas 2026:** a friends-and-family **beta** (TestFlight / Android internal testing plus the web link), with a hand-curated catalogue and share-to-add. Real families, real feedback.
- **Spring–summer 2027:** affiliate feeds, moderation pipeline, polish.
- **October 2027:** public launch, ready for the Christmas 2027 list season.

## 15. Open questions
- [ ] Product name and branding
- [ ] Which regions or retailers to onboard first, given "global from day one"
- [ ] Beta now vs. full launch for 2027 (see section 14)
- [ ] Should the child see prices at all in Kid Mode? (Default: hidden for under-8s)
- [ ] Group gift threshold amount per currency
- [ ] Data retention: how long lists and slips are kept after the event

## Appendix: interview decisions log (28 Oct 2026)

| Topic | Decision |
|---|---|
| Core idea | A wishlist tool that uses nostalgia as its design language |
| Audience | Kids' Christmas lists (priority), couples' registries |
| Discovery | Categories plus templates; the custom template adds shop, price and delivery-time filters |
| Products | Affiliate feeds plus share-to-add, so the catalogue grows over time |
| Circles | Wobbly biro circles plus a 1–3 star system |
| Roles | One list, two sides: Circler and Giver |
| Running total | A per-list toggle; on for kid lists, off for weddings |
| Claims | Honour system, with a 48-hour hold |
| Surprise mode | Yes, optional and off by default (updated 29 Oct 2026); Kid Mode never shows who's buying |
| Group gifts | One Organiser buys and collects money outside the app; the app tracks pledges |
| Kid Mode | Search and circle only; voice search essential; pictures and big buttons |
| Moderation | Private-to-list first; auto checks plus human review before going public |
| Done moment | Cash register sound, printed order slip, emailed to the account holder |
| Look | Loud primary 2000 catalogue, modern UX, swipe page turns with sound |
| Platforms | iOS and Android, plus a web link for Givers |
| Stack | React Native / Expo (team: founder plus AI tools) |
| Notifications | Push options, an email when finalised, WhatsApp sharing and Giver group chat |
| Region | Global from day one |
| Money | Deferred: product first |
