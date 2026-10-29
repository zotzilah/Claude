/**
 * Every word the app shows, in British English. This is the master copy:
 * other languages and regions override pieces of it (see `en-US.ts`).
 *
 * Plain strings for fixed text; small functions where a name or number goes in.
 * Product names and catalogue page titles are content, not UI text, so they
 * live with the catalogue data instead.
 */
import { possessive, type SetupProblem } from '../domain/settings';
import type { SignInError } from '../domain/sign-in';
import type { Template } from '../domain/types';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);

export const enGB = {
  common: {
    back: '◀ Back',
    backA11y: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    next: 'Next ▶',
    /** Stands in for a child's name before it's been typed. */
    yourChild: 'your child',
    they: 'they',
    them: 'them',
    theShop: 'the shop',
    stars: (n: number) => plural(n, 'star', 'stars'),
    sendToParents: 'Send to Mum & Dad',
    search: 'Search',
  },

  templates: {
    label: { christmas: 'Christmas', birthday: 'Birthday', custom: 'Something else' } satisfies Record<Template, string>,
    /** The list's title, e.g. "Ellie's Christmas Book 2026". */
    title: (template: Template, name: string, year: number): string => {
      const who = possessive(name);
      if (template === 'christmas') return `${who} Christmas Book ${year}`;
      if (template === 'birthday') return `${who} Birthday Book ${year}`;
      return `${who} Wish Book`;
    },
    /** The order slip's parody queue line. */
    waitFor: { christmas: 'PLEASE WAIT FOR CHRISTMAS', birthday: 'PLEASE WAIT FOR YOUR BIRTHDAY', custom: 'PLEASE WAIT PATIENTLY' } satisfies Record<Template, string>,
  },

  catalogue: {
    hintKid: 'Tap to circle it! Tap again for more stars ★',
    hint: 'Tap to circle · again for ★★ · ★★★ · 4th tap rubs it out · swipe to turn the page',
    pricesAsOf: (date: string) => `Prices checked ${date}. They can change, so check the shop before buying.`,
    kidModeChip: '🔒 KID MODE',
    indexA11y: 'A to Z index',
    soundA11y: 'Sound effects',
    page: (code: number) => `PAGE ${code}`,
    previousPage: 'Previous page',
    nextPage: 'Next page',
    pictures: '◀ Pictures',
    handTo: (name: string) => `Hand to ${name}`,
    giverLink: 'Giver link',
    addFromLink: '＋ Add from a link',
    settings: 'Settings',
  },

  product: {
    takenCareOf: 'TAKEN CARE OF ✓',
    boughtBy: (name: string) => `BOUGHT ✓ ${name.toUpperCase()}`,
    claimedBy: (name: string) => `CLAIMED · ${name.toUpperCase()}`,
    yourFind: 'YOUR FIND',
    a11yLabel: (title: string, price: string, catalogueNo: string) =>
      catalogueNo ? `${title}, ${price}, catalogue number ${catalogueNo}` : `${title}, ${price}`,
    hintUncircled: 'Circles this item',
    hintCircled: (stars: 1 | 2 | 3) =>
      `Circled, ${({ 1: 'would like', 2: 'really want', 3: 'the big one' } as const)[stars]}. Tap to change.`,
  },

  runningTotal: {
    label: (count: number) => `RUNNING TOTAL · ${count} CIRCLED`,
    over: (by: string, budget: string) => `${by} over the ${budget} budget`,
    left: (left: string, budget: string) => `${left} left in the ${budget} budget`,
    otherCurrency: (n: number) => `${plural(n, 'item', 'items')} in another currency not counted`,
  },

  setup: {
    kicker: (step: number, of: number) => `STEP ${step} OF ${of}`,
    kickerEditing: 'LIST SETTINGS',
    headings: ["What's the occasion?", "Who's circling?", "Who's buying?", 'How much to spend?'],
    child: 'A child',
    childNote: 'You hand them the phone in Kid Mode to circle',
    adult: 'A grown-up',
    adultNote: 'For yourself, a partner or a couple',
    childName: "Child's first name",
    listName: 'Name for the list',
    childNameExample: 'e.g. Ellie',
    listNameExample: 'e.g. Sam & Alex',
    howOld: 'How old?',
    ageNote: 'We only use this to pick suitable products. Children never get an account.',
    justMe: 'Just me',
    justMeNote: 'One buyer, so no claiming or sharing needed',
    partner: 'Me and a partner',
    partnerNote: "Share the list and claim items so you don't double up",
    family: 'The whole family',
    familyNote: 'Grandparents, aunties, uncles: claiming, surprise mode and group gifts',
    budget: 'Budget',
    currency: 'Currency',
    runningTotal: 'Show a running total',
    runningTotalNote: 'Adds up everything circled against the budget',
    kidPrices: 'Show prices in Kid Mode',
    kidPricesNote: 'Off for under-8s, so they circle what they love, not what costs least.',
    surprise: 'Surprise mode',
    surpriseOff: "Off: I'll see who's buying what",
    surpriseCovered: 'On: just show "taken care of"',
    surpriseHideAll: 'On: hide everything',
    surpriseOffNote: (childName: string | null) =>
      `You can claim gifts too.${childName ? ` Kid Mode still never shows ${childName} who's buying.` : ''}`,
    surpriseOnNote: "You won't see who bought what, so the surprise stays a surprise.",
    summary: (budget: string, name: string) => `${budget} for ${name || 'this list'}`,
    finish: 'Make my catalogue!',
    problems: {
      'child-name': "Add the child's name",
      'list-name': 'Add a name for the list',
      age: 'Pick an age',
      budget: 'Set a budget above zero',
    } satisfies Record<SetupProblem, string>,
  },

  kid: {
    hello: (name: string) => `Hi ${name}!\nWhat do you want?`,
    grownUps: '🔒 Grown-ups',
    grownUpsA11y: 'Grown-ups: leave Kid Mode',
    find: 'Find something…',
    findA11y: 'Find something',
    sayIt: 'Tap and say it!',
  },

  pin: {
    chooseTitle: 'Choose a grown-ups PIN',
    confirmTitle: 'Type it again',
    chooseSubtitle: (name: string) =>
      `You'll need this to leave Kid Mode, so ${name} can't wander off into settings.`,
    mismatch: "Those didn't match. Let's start again.",
    easy: "That one's easy to guess. Kids are sneaky.",
    pickAnother: 'Pick another',
    useAnyway: 'Use it anyway',
    unlockTitle: 'Grown-ups only',
    unlockSubtitle: 'Type your PIN to leave Kid Mode.',
    wait: (seconds: number) => `Too many tries. Wait ${seconds} seconds.`,
    wrong: 'Not quite. Try again.',
    biometrics: 'Use Face ID or fingerprint',
    biometricsFailed: "That didn't work. Type your PIN instead.",
    backToCircling: '◀ Back to circling',
    forgot: 'Forgot PIN?',
    deleteA11y: 'Delete',
    enteredA11y: (n: number, of: number) => `${n} of ${of} digits entered`,
  },

  search: {
    placeholderKid: 'What do you want?',
    placeholder: 'Search, or type a catalogue number',
    suggestions: ['Dinosaurs', 'Lego', 'Bikes', 'Art', 'Games'],
    tryThese: 'Try one of these!',
    popular: 'Popular searches',
    catalogueNumber: (no: string) => `Catalogue number ${no}`,
    noCatalogueNumber: (no: string) => `Nothing has the catalogue number ${no}. Check the digits?`,
    found: (n: number) => `${plural(n, 'thing', 'things')} found`,
    nothingKid: "Hmm, we couldn't find that. Try another word!",
    nothing: (query: string) => `Nothing matches "${query}".`,
    voice: '🎤',
    voiceA11y: 'Say it instead of typing',
    listening: 'Listening…',
    voiceFailed: "Sorry, we didn't catch that. Try again, or type it.",
    voiceDenied: "Biro can't hear you yet. Allow the microphone in your browser's settings, or type instead.",
    stopListening: 'Stop listening',
  },

  add: {
    kicker: 'ADD FROM ANY SHOP',
    heading: 'Paste a link',
    help: (name: string | null) =>
      `Found something ${name || 'they'} would love? Copy the link from the shop's app or website and paste it here.`,
    linkA11y: 'Shop link',
    find: 'Find it',
    looking: "Looking at the shop's page…",
    notALink: "That doesn't look like a shop link. It should start with https://",
    found: 'Found it! Check the details.',
    foundMissing: (name: boolean, price: boolean) =>
      `Found it, but add the ${[name && 'name', price && 'price'].filter(Boolean).join(' and ')}.`,
    failure: {
      timeout: 'That shop took too long to answer. Fill in the details below.',
      blocked: "We couldn't read that page (some shops block it). Fill in the details below.",
      'not-found': "That page doesn't seem to exist. Check the link, or fill in the details below.",
    },
    photoA11y: 'Product photo',
    name: 'Name',
    price: 'Price',
    shop: 'Shop',
    privateNote: 'Only your list sees this. Givers tap through to the shop to buy it.',
    needName: 'Add a name',
    needPrice: (example: string) => `Add a price, e.g. ${example}`,
    circleIt: 'Circle it! ⭕',
    alreadyOnList: (title: string) => `"${title}" is already on the list.`,
    /** Shown when the automatic checks refuse a link (see domain/moderation.ts). */
    refused: {
      'adult-site': "Sorry, that shop can't be added to a Biro list.",
      'not-a-shop': "That link doesn't look like a shop. Try the product's own page.",
      'bad-words': 'That name has words we can’t show on a family list. Please change it.',
      'silly-price': 'That price looks wrong. Please check it.',
    },
  },

  slip: {
    counter: 'COUNTER 3',
    title: 'ORDER SLIP',
    nothing: 'Nothing circled yet!',
    yours: 'YOURS',
    items: (n: number) => (n === 1 ? '1 ITEM' : `${n} ITEMS`),
    yourNumber: 'YOUR NUMBER IS',
    printAgain: 'Print again',
  },

  index: {
    title: 'Index',
    backA11y: 'Back to the catalogue',
    jumpTo: (letter: string) => `Jump to ${letter === '#' ? 'numbers' : letter}`,
    entryA11y: (label: string, ref: string, stars: number | null) =>
      `${label}, ${ref}${stars ? `, circled with ${plural(stars, 'star', 'stars')}` : ''}`,
  },

  /** Push and email wording (see domain/notifications.ts). Short: phones cut long pushes off. */
  notify: {
    listSent: (child: string, n: number) => ({
      title: `${child}'s list is in! 🧾`,
      body: `${n === 1 ? '1 thing' : `${n} things`} circled. Your order slip is in your email.`,
    }),
    claimed: (title: string, by: string) => ({ title: `${by} is getting the ${title}`, body: 'Held for 48 hours while they buy it.' }),
    bought: (title: string, by: string) => ({ title: `${by} bought the ${title} ✓`, body: 'One less to think about.' }),
    takenCareOf: (title: string) => ({ title: 'Another wish is taken care of ✓', body: `${title}: sorted. We won't say who.` }),
    released: (title: string, by: string) => ({ title: `The ${title} is free again`, body: `${by} let it go, so anyone can claim it.` }),
    pledged: (title: string, by: string, amount: string) => ({ title: `${by} pledged ${amount}`, body: `Towards the ${title}. Collect it from them directly.` }),
    expiring: (title: string, hours: number) => ({
      title: `${hours} hours left on the ${title}`,
      body: "Tap \"I've bought it\" once it's ordered, or release it for someone else.",
    }),
    finalised: (listTitle: string) => ({ title: `${listTitle} is finished`, body: 'No more changes. Happy wrapping!' }),
  },

  account: {
    kicker: 'YOUR ACCOUNT',
    heading: 'Back up and share',
    link: 'Account ▸',
    notSetUp:
      "Accounts aren't switched on yet. Your list is saved on this phone, and nothing leaves it.",
    why: 'Sign in to keep your list safe if you lose your phone, and to share it with family.',
    email: 'Your email',
    emailExample: 'you@example.com',
    sendCode: 'Email me a code',
    sending: 'Sending…',
    badEmail: "That email doesn't look quite right.",
    codeSent: (email: string) => `We've sent a code to ${email}. It can take a minute to arrive.`,
    code: 'Code from the email',
    signIn: 'Sign in',
    checking: 'Checking…',
    resend: 'Send a new code',
    resendIn: (seconds: number) => `New code in ${seconds}s`,
    differentEmail: 'Use a different email',
    signedInAs: (email: string) => `Signed in as ${email}`,
    signOut: 'Sign out',
    delete: 'Delete my account',
    deleteWarning:
      'This deletes your account and every list on it, for everyone you shared it with. It can’t be undone.',
    deleteConfirm: 'Yes, delete everything',
    deleted: 'Your account and lists have been deleted.',
    errors: {
      'rate-limited': 'Too many tries. Wait a minute, then try again.',
      'wrong-code': "That code didn't work. It may have run out, so ask for a new one.",
      offline: "We couldn't reach Biro. Check you're online.",
      'not-set-up': "Accounts aren't switched on yet.",
      unknown: 'Something went wrong. Please try again.',
    } satisfies Record<SignInError, string>,
  },

  giver: {
    /** "Ellie's Christmas Book 2026" reads as a list to the family. */
    listTitle: (bookTitle: string) => bookTitle.replace('Book', 'List'),
    backToCatalogue: '◀ Back to the catalogue',
    circledBy: (name: string) => `Circled by ${name || 'them'} · no app needed`,
    surpriseOn: (name: string) => `🤫 Surprise mode is on. ${name || 'They'} can't see who's buying what.`,
    hello: "Hello! Who's buying?",
    helloHint: "So everyone knows who's claimed what. No account needed.",
    nameExample: 'e.g. Nan',
    nameA11y: 'Your name',
    thatsMe: "That's me",
    buyingAs: (name: string) => `Buying as ${name}`,
    wishes: 'wishes',
    total: 'list total',
    stillToGet: 'still to get',
    empty: 'Nothing circled yet. Check back soon!',
    share: 'Share this list',
    shareOnWhatsApp: 'Send to the family on WhatsApp',
    shareMessage: (title: string, url: string) => `${title}: claim a present here ${url}`,
    you: 'you',
    viewAt: (shop: string) => `View at ${shop} ↗`,
    claimToBuy: 'Claim to buy it',
    claim: 'Claim it',
    makeGroupGift: 'Make it a group gift',
    heldFor48: 'Held for you for 48 hours',
    heldByYou: (left: string) => `Held by you · ${left} left`,
    bought: "I've bought it ✓",
    release: 'Release',
    claimedBy: (name: string, left: string) => `Claimed by ${name} · ${left} left`,
    boughtBy: (name: string) => `Bought ✓ by ${name}`,
    groupGiftBy: (name: string) => `Group gift · organised by ${name}`,
    pledged: (pledged: string, of: string) => `${pledged} of ${of} pledged`,
    other: (symbol: string) => `Other ${symbol}`,
    otherA11y: 'Other pledge amount',
    pledge: 'Pledge',
    removePledge: 'Remove my pledge',
    organiserNote: 'Collect the money directly, then claim it and buy it. Biro never handles money.',
    pledgerNote: (organiser: string) => `Pay ${organiser} directly. Biro just keeps track.`,
  },
};

export type Strings = typeof enGB;
