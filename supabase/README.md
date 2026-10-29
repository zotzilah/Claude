# Biro backend (Supabase)

The database behind shared lists, live claims and the waitlist. Issue #13.

## What's here

- `migrations/`: the schema, its security rules and the Giver functions
- `tests/`: 45 checks that sign in as the parent, Nan, Dave, a stranger and a signed-out visitor, and prove each can only do what they should. That includes **surprise mode**: the list owner can never read claims, givers or pledges.

## How it fits together

| Who | How they sign in | What they can do |
|---|---|---|
| **Parent** (list owner) | Email sign-in | Everything on their own lists. Can never read claims, givers or pledges. `covered_products()` tells them at most that an item is "taken care of", and nothing if they chose "hide everything". |
| **Giver** (Nan, Dave…) | Anonymous: no account, just the share link and a name | Read the wishes. Claim, buy, release and pledge, but only through the checked functions (`claim_item`, `mark_bought`, `release_claim`, `start_group_gift`, `pledge`). |
| **Website visitor** | Not signed in | Add themselves to the waitlist. Nothing else. |

The rules mirror the app's own tested logic in `mobile/src/domain/claims.ts`: 48-hour holds, one claim per wish, one pledge per person, and expired holds freed automatically.

## Setting it up (about 15 minutes, free)

1. Create a free project at [supabase.com](https://supabase.com). Pick the region closest to most families (for example London).
2. In the dashboard, under **SQL Editor**, paste the contents of `migrations/20261029120000_init.sql` and run it.
3. Under **Authentication → Sign In / Providers**, turn on **Anonymous sign-ins** (for Givers) and **Email** (for parents).
4. Under **Database → Publications**, check that `supabase_realtime` exists. The migration adds the live-update tables to it if it does.
5. Under **Settings → API**, copy the **Project URL** and the **anon public** key into:
   - `mobile/.env` (copy `mobile/.env.example`), for the app
   - the `WAITLIST` settings at the top of the script in `site/index.html`, for the landing page

The anon key is designed to be public. Everything is protected by the row-level security in the migration. Never put the **service role** key in the app or the website.

## Running the rule tests

The tests need a local PostgreSQL 15 or newer (no Supabase account required):

```bash
PGHOST=localhost PGUSER=postgres supabase/tests/run.sh
```

They create a throwaway database, load a small stand-in for Supabase's login system (`tests/supabase-shim.sql`), apply the migrations and run every check. The run ends with `ALL RULE TESTS PASSED`, or stops at the first failure with an explanation.

## Still to do once the project exists

- Parent sign-in screens (email one-time code) in the app.
- Switch the app's list store to sync through `mobile/src/state/remote.ts`. Today it saves on the device only.
- Serve the Giver link from the web build, using `fetchGiverView` and `watchList` for live updates.
