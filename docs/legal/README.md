# Legal drafts

**These are drafts written to help, not legal advice.** Before anything goes to the app stores, or to people outside the friends-and-family beta, a qualified solicitor should check them. That matters most for the children's sections.

| File | What it is | Where it's used |
|---|---|---|
| `privacy-policy.md` | What Biro collects, why, who sees it and how long it's kept | App store listings (both stores require a link), the landing page, the app's Settings |
| `terms.md` | The rules for using Biro during the beta | The landing page and the app's Settings |
| `store-privacy-answers.md` | Ready answers for Apple's "App Privacy" form and Google's "Data safety" form | Pasting into App Store Connect and the Play Console |

## Placeholders to fill in

Search for `[[` in each file. You'll need:

- `[[OPERATOR]]`: the legal name of whoever runs Biro (you as a sole trader, or a company if you set one up)
- `[[ADDRESS]]`: a postal address for privacy requests (a virtual office address is fine)
- `[[CONTACT_EMAIL]]`: a mailbox for privacy and support, e.g. `hello@` on your domain
- `[[EFFECTIVE_DATE]]`: the day you publish it

## Decisions these drafts make for you

Change them if you disagree. Each one is marked **(proposed)** in the text.

1. **Retention:** a list is deleted 12 months after its event date, or 12 months after the last time it was opened, whichever is later. Waitlist emails are deleted when the waitlist closes. This answers the brief's open question on data retention.
2. **No ads and no analytics SDKs** during the beta. Crash reports only, with no personal details.
3. **Voice search** runs through the phone's own speech recognition. Biro never records or stores the audio.
4. **Giver names** are whatever the giver types ("Nan"). No account or email is needed.
5. **Minimum age** for an account holder: 18.

## Promises the app must keep before launch

The policy describes these features. Some don't exist yet, so they're on the to-do list:

- [ ] **Settings → Delete my account.** Needs the backend. Deletes the account and every list.
- [ ] **Make a new share link.** Replaces `share_token` so the old link stops working.
- [ ] **Export my lists.** The local snapshot format (`mobile/src/domain/snapshot.ts`) already covers the content.
- [ ] Shop links open only outside Kid Mode. ✅ Done.
- [ ] The PIN is stored hashed, on the device only. ✅ Done.
- [ ] The retention clean-up job: a scheduled database function that deletes old lists.
