# Legal drafts

**These are drafts written to help, not legal advice.** Before anything goes to the app stores, or to people outside the friends-and-family beta, a qualified solicitor should check them. That matters most for the children's sections.

| File | What it is | Where it's used |
|---|---|---|
| `privacy-policy.md` | What Biro collects, why, who sees it and how long it's kept | App store listings (both stores require a link), the landing page, the app's Settings |
| `terms.md` | The rules for using Biro during the beta | The landing page and the app's Settings |
| `store-privacy-answers.md` | Ready answers for Apple's "App Privacy" form and Google's "Data safety" form | Pasting into App Store Connect and the Play Console |

## Placeholders to fill in

Filled in on 29 Oct 2026 for the beta:

- **Operator:** Luke Cartwright (sole trader)
- **Contact email:** zoneflossy@gmail.com. Switch to an address on our own domain once we have one.
- **Effective date:** 29 October 2026
- **Database region:** London, UK (Supabase "West EU (London)")

**Still to do before the public launch and the app stores:**
- [ ] A postal address for privacy requests. A virtual office address is fine, but don't use a home address, because it's published.
- [ ] Name the email provider (and where it stores data) once one is chosen
- [ ] A solicitor's check

After any edit, rebuild the website copies with `node site/build-legal.mjs`.

## Decisions these drafts make for you

Change them if you disagree. Each one is marked **(proposed)** in the text.

1. **Retention:** a list is deleted 12 months after its event date, or 12 months after the last time it was opened, whichever is later. Waitlist emails are deleted when the waitlist closes. This answers the brief's open question on data retention.
2. **No ads and no analytics SDKs** during the beta. Crash reports only, with no personal details.
3. **Voice search** runs through the phone's own speech recognition. Biro never records or stores the audio.
4. **Giver names** are whatever the giver types ("Nan"). No account or email is needed.
5. **Minimum age** for an account holder: 18.

## Promises the app must keep before launch

The policy describes these features. Some don't exist yet, so they're on the to-do list:

- [x] **Settings → Account → Delete my account.** ✅ Built (`mobile/src/app/account.tsx` plus the `delete_my_account` database function). It switches on once Supabase is set up.
- [ ] **Make a new share link.** The database side is done (`new_share_token`). The button comes with the backend wiring (#13).
- [ ] **Export my lists.** The local snapshot format (`mobile/src/domain/snapshot.ts`) already covers the content.
- [x] Shop links open only outside Kid Mode. ✅ Done.
- [x] The PIN is stored hashed, on the device only. ✅ Done.
- [x] The retention clean-up job: `supabase/migrations/20261030120000_retention.sql` runs nightly. ✅ Built and tested. It needs running once in the Supabase SQL Editor.
