# App store privacy forms: draft answers

These answers match `privacy-policy.md` and the app as built. Re-check them if anything about data collection changes, because a mismatch can get the app rejected or pulled.

## Apple: App Privacy ("nutrition label")

**Do you or your third-party partners collect data from this app?** Yes.

| Data type | Collected? | Linked to the user? | Used for tracking? | Purpose |
|---|---|---|---|---|
| Contact info → Email address | Yes | Yes | No | App functionality |
| User content → Other user content (wish lists) | Yes | Yes | No | App functionality |
| Identifiers → User ID | Yes | Yes | No | App functionality |
| Diagnostics → Crash data | Yes | No | No | App functionality |
| Location, contacts, browsing history, health, financial info, audio data | No | n/a | n/a | n/a |

- **Tracking:** No. There's no App Tracking Transparency prompt, because we don't track.
- **Category:** Shopping or Lifestyle, *not* the Kids Category. The main user is the parent (brief §12).
- **Age rating questionnaire:** no objectionable content. "Unrestricted web access": No, because shop links open in an in-app browser and only outside Kid Mode.
- **Privacy policy URL:** the hosted `privacy-policy` page on the landing site.

## Google Play: Data safety

- **Does your app collect or share any of the required user data types?** Yes, it collects data. It shares none.
- **Is all of the user data collected by your app encrypted in transit?** Yes (HTTPS only).
- **Do you provide a way for users to request that their data is deleted?** Yes: in-app, plus email.

| Data type | Collected | Shared | Optional? | Purpose |
|---|---|---|---|---|
| Personal info → Email address | Yes | No | Required | Account management, app functionality |
| Personal info → Name (child's first name / giver display name) | Yes | No | Required | App functionality |
| App activity → Other user-generated content | Yes | No | Required | App functionality |
| App info and performance → Crash logs | Yes | No | Required | Analytics (crash fixing only) |
| Device or other IDs | Yes | No | Required | App functionality (sign-in ID) |

- **Target audience and content:** choose "18 and over" as the target age, and say that the app is "not designed for children but may attract them". Then explain Kid Mode: a parental gate, no ads and no data collected from the child. If Google pushes back, the fallback is the Families policy route, which needs a stricter review. Read the current Play "Families" guidance when you submit, because it changes often.
