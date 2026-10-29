# Biro landing page

A single static page (`index.html`) with the Christmas beta waitlist.

## Hosting it (free, on GitHub Pages)

`.github/workflows/pages.yml` publishes this folder whenever `main` changes. It needs one setting, once:

1. On GitHub, open the repo's **Settings**, then **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Go to the **Actions** tab, choose **Publish website**, then **Run workflow**. This is only needed the first time; after that it runs by itself.

The site appears at **https://zotzilah.github.io/Claude/** a minute later. A custom domain (e.g. `getbiro.com`) can be added later under the same Pages settings.

## Privacy and terms pages

`privacy.html` and `terms.html` are generated from `docs/legal/`. After editing those Markdown files, run `node site/build-legal.mjs`.

## The waitlist

Sign-ups go into the Supabase `waitlist` table (see `../supabase/`). The project's URL and publishable key are at the top of the script in `index.html`. The key is safe to publish: the table's security rules let visitors add a row, never read the list. To see sign-ups, open the Supabase dashboard → **Table Editor** → `waitlist`.

## The app on the website

The publishing workflow also builds the app for the web and puts it at **/app**. That's where the family's share links (`/app/g/<token>`) open, with no app download needed.
