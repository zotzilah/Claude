# Getting Biro onto phones (beta)

For when the Apple and Google developer accounts are ready. Everything runs from a Windows PC: Expo's EAS service builds the iPhone app in the cloud, so no Mac is needed.

**Costs:** Apple Developer Program $99 a year. Google Play Console $25 once. Expo's free plan includes a monthly allowance of cloud builds, which is plenty for a beta.

## Once: set up

1. Install Node.js (LTS) from nodejs.org, if it isn't already installed.
2. In a terminal, in the `mobile` folder:
   ```
   npm install
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
   `init` links the project to your Expo account and writes a project ID into `app.json`. Commit that change.
3. The development build pieces (`expo-dev-client`, voice search, the share sheet and notifications) are already installed and configured. One side effect: `npx expo start` now opens development builds by default. **To keep using Expo Go, press `s` after it starts** (or run `npx expo start --go`).

## Try it on an Android phone first (free, today)

An Android test build needs only the free Expo account: no Google account, no fees.
```
npx eas-cli@latest build --platform android --profile development
```
EAS gives a link (and a QR code) to an `.apk`. Open it on the phone and install it. Then run `npx expo start` on the PC and the new Biro app connects to it, like Expo Go but with voice search, the share sheet and notifications included.

**Notifications on Android** also need a free Firebase project, because Google delivers Android pushes. Follow Expo's guide "Obtain Google Service Account Keys using FCM V1" (docs.expo.dev → Push notifications → FCM credentials), then upload the key with `npx eas-cli@latest credentials`. Voice and the share sheet work without it.

## What the development build adds

| Feature | Issue | Where to try it |
|---|---|---|
| Kid Mode voice search | #14 | The 🎤 button in Kid Mode and in search. The first time, the phone asks for the microphone (and on iPhone, speech recognition) |
| Share to Biro | #15 | In Safari, Chrome, or a shop's app, tap Share → **Biro**. It opens "Add from a link" with the page already read |
| Notifications to the parent | #16 | Settings → Account → **Tell me when someone gets a gift**. Then claim something from the family link on another phone |

Notifications also need the database part: run `supabase/migrations/20261030150000_push.sql` once in the Supabase SQL Editor (like the earlier ones). It switches on Supabase's `pg_net` and `pg_cron`, which send the queued messages every minute.

## Friends-and-family beta

### iPhone (TestFlight)
1. In [App Store Connect](https://appstoreconnect.apple.com), create a new app with the bundle ID `com.projectbiro.app`. Copy its **Apple ID** (a number) into `eas.json` → `submit.production.ios.ascAppId`.
2. Build and upload:
   ```
   npx eas-cli@latest build --platform ios --profile production
   npx eas-cli@latest submit --platform ios --latest
   ```
   EAS asks to sign in to Apple and creates the certificates for you. Say yes.
3. In App Store Connect → TestFlight, add testers by email. They install the TestFlight app and get an invite. Up to 100 people can test before Apple's full review.

### Android (internal testing)
1. In the [Play Console](https://play.google.com/console), create the app with the package `com.projectbiro.app`.
2. The quickest way to start is an installable file, with no store involved:
   ```
   npx eas-cli@latest build --platform android --profile preview
   ```
   EAS gives you a link to an `.apk` file. Send it to testers, and they tap it to install (Android asks them to allow installs from that app once).
3. For the Play internal testing track (up to 100 testers, updates through the store):
   ```
   npx eas-cli@latest build --platform android --profile production
   npx eas-cli@latest submit --platform android --latest
   ```
   The first upload to Google Play has to be done by hand in the Play Console. EAS can do the later ones.

## Before sending to anyone

- [ ] Add a postal address to `docs/legal/` (see its README), rebuild with `node site/build-legal.mjs`, and check the privacy page is live
- [ ] Fill in the store forms using `docs/store/listing.md` and `docs/legal/store-privacy-answers.md`
- [ ] Supabase project set up (`supabase/README.md`), with keys in `mobile/.env`
- [ ] Test on one real iPhone and one real Android phone: circling, sounds, Kid Mode PIN, Face ID or fingerprint, adding from a link, voice search, Share to Biro, and a notification arriving
- [ ] `npm test`, `npx tsc --noEmit` and `npx expo lint` all pass
