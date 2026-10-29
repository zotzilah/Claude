# Biro landing page

A single static page (`index.html`) with the Christmas beta waitlist.

## Hosting it (free)

The page is plain HTML. Any static host serves it:

- **Netlify** or **Cloudflare Pages:** connect this GitHub repo and set the publish directory to `site`.
- **GitHub Pages:** in the repo settings, under Pages, publish from the `site` folder. Free for public repos.

A custom domain (e.g. `getbiro.com`) can be added on any of these later.

## Turning on the waitlist

Sign-ups are saved in the Supabase `waitlist` table (see `../supabase/`). Once the Supabase project exists, fill in the two values at the top of the script in `index.html`:

```js
const WAITLIST = {
  url: 'https://<your-project>.supabase.co',
  anonKey: '<the anon public key>',
};
```

The anon key is safe to publish: the table's security rules let visitors add a row, never read the list. Until these are filled in, the form thanks people and says sign-ups open soon.
