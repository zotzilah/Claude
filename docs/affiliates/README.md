# Getting official product feeds (affiliate networks)

**Why:** most big UK toy shops block robots from reading their websites. The proper way to get their products into Biro, with names, prices, photos, stock and links, is the **product feeds** they publish through affiliate networks. Using those is allowed, and every purchase through a Biro link can then earn a small commission. That's the brief's "option B".

**Checked 29 Oct 2026. Details change, so trust the sign-up forms over this page.**

## Before you apply

1. **The website must be live.** Both networks review your site. Ours is the landing page, published by GitHub Pages (see `site/README.md`).
2. **The privacy policy must be live** on the site. It's filled in for the beta. Some networks may also ask for a postal address (see `docs/legal/README.md`).
3. **Have ready:** your name and address, your bank details for payouts, and a two-line description.

> **What to say Biro is:** "Biro is a family wish-list app styled like a 2000s gift catalogue. Children circle what they'd like, and family members buy the items from the retailer through our links. We'll show retailer products on catalogue pages, with links to the retailer's own product pages. No ads, no coupons, no cashback."

## Awin (John Lewis, and many toy and gift shops)

1. Go to **awin.com**, choose **Publishers**, then **Sign up**.
2. **Promotion type:** choose *Content* (or *Comparison/Review* if that's offered). Our model is closest to a gift guide.
3. **Deposit:** Awin asks for a small refundable deposit (it's been £1 to £5 depending on region and time). You get it back with your first commission payment. ([Awin's page on the joining fee](https://www.awin.com/gb/compliance-and-regulations/application-process-and-joining-fee))
4. **Approval:** a person reviews each application and checks your identity, so allow a few days.
5. Once approved, find each shop under **Advertisers**, then **Join programmes**. Each shop approves you separately. Start with: John Lewis, The Entertainer, Hamleys, Bigjigs Toys, Hobbycraft, Smyths (check which of these are on Awin when you search).
6. Under **Toolbox**, then **Create-a-Feed**, choose the joined shops, the **CSV** format and the **Toys** categories. Copy the feed URL it gives you and send it to me. It contains your publisher API key, so treat it like a password: paste it into the environment's secrets, not into chat. I'll show you how when we get there.

## CJ (Argos)

Argos appears to run its programme mainly on **CJ Affiliate** (cj.com). Sign up as a publisher there too: it's free, and the process is similar. After approval, apply to **Argos**. Once accepted, CJ's product feed or product search API gives us Argos products.

## What I'll build once a feed arrives

- A nightly import that turns each feed into catalogue pages: price changes, stock, new products and discontinued ones
- The automatic checks from `mobile/src/domain/moderation.ts`, run on every feed item, so nothing grown-up reaches a child's catalogue
- Real product photos, served from the shop's image links as their feed terms allow
- The affiliate notice in the Giver view: "We may earn a commission" (privacy policy and brief §12)

## Don't

- Don't put affiliate links in Kid Mode. Children never see shop links at all.
- Don't promise discounts or cashback. We don't offer either.
- Don't paste API keys or feed URLs into GitHub issues or chat.
