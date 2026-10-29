// Checks the store listing against each store's character limits.
// Run: node docs/store/check-lengths.mjs
import { readFileSync } from 'node:fs';

const md = readFileSync(new URL('./listing.md', import.meta.url), 'utf8');
const limits = {
  'App name': 30,
  Subtitle: 30,
  'Promotional text': 170,
  Keywords: 100,
  Description: 4000,
  'Short description': 80,
};

let failed = false;
for (const [field, max] of Object.entries(limits)) {
  const start = md.indexOf(`**${field}**`);
  if (start < 0) throw new Error(`Missing field: ${field}`);
  const block = md.slice(start).split('\n').slice(1);
  const lines = [];
  for (const line of block) {
    if (line.startsWith('>')) lines.push(line.replace(/^> ?/, ''));
    else if (lines.length) break;
  }
  const text = lines.join('\n').trim();
  const ok = text.length <= max;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'LONG'} ${field}: ${text.length}/${max}`);
}
process.exit(failed ? 1 : 0);
