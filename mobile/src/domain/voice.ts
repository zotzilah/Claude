/**
 * Turning what a child says into a search (brief §6: "say DINOSAURS! and get results").
 * Pure: the listening itself happens in `state/voice`.
 */

/** Openers children (and grown-ups) put before the thing they want. Longest first. */
const OPENERS = [
  'can i please have', 'can i have', 'could i have', 'i would like', "i'd like", 'i really want', 'i want',
  'i need', 'please can i have', 'show me', 'find me', 'find', 'search for', 'look for', 'dear santa',
  'for christmas i want', 'for my birthday i want',
];
const CLOSERS = ['please', 'for christmas', 'for my birthday', 'thank you', 'thanks'];
/** Filler that can turn up anywhere: "I really really want um lego". */
const FILLER = new Set(['um', 'umm', 'erm', 'er', 'uh', 'really', 'so', 'very', 'want', 'i', 'and', 'please']);

/**
 * "Can I have a dinosaur please!" → "dinosaur". Keeps the words that matter,
 * so the search box shows what the child actually asked for.
 */
export function cleanSpokenQuery(transcript: string): string {
  let text = transcript.toLowerCase().replace(/[.!?,]+/g, ' ').replace(/\s+/g, ' ').trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const opener of OPENERS) {
      if (text === opener || text.startsWith(`${opener} `)) {
        text = text.slice(opener.length).trim();
        changed = true;
      }
    }
    for (const closer of CLOSERS) {
      if (text === closer || text.endsWith(` ${closer}`)) {
        text = text.slice(0, text.length - closer.length).trim();
        changed = true;
      }
    }
    // A leading "a", "an", "some" or "the".
    const article = /^(a|an|some|the|lots of|loads of)\s+/.exec(text);
    if (article) {
      text = text.slice(article[0].length);
      changed = true;
    }
  }
  return text
    .split(' ')
    .filter((word) => !FILLER.has(word))
    .join(' ');
}

/**
 * Speech recognisers offer a few guesses ("dinosaur", "dino sore"). Pick the one
 * that finds the most in the catalogue; ties go to the recogniser's own favourite.
 */
export function bestGuess(alternatives: string[], resultsFor: (query: string) => number): string {
  let best = '';
  let bestCount = -1;
  for (const alt of alternatives) {
    const query = cleanSpokenQuery(alt);
    if (!query) continue;
    const count = resultsFor(query);
    if (count > bestCount) {
      best = query;
      bestCount = count;
    }
  }
  return best;
}
