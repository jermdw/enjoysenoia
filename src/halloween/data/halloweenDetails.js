/**
 * Single source of truth for the Senoia Halloween micro-site.
 *
 * Source: the "Senoia Halloween Website" brief from Shauna Mooney
 * (docs.google.com/document/d/1N1ccK2zQT5IKVjAUL62nsvjZiPWrd9LWkPlwvWsSv-g).
 *
 * Comment convention, same as src/masquerade/data/eventDetails.js:
 *   CONFIRM — the brief is ambiguous or self-contradictory; verify before launch.
 *   NEEDED  — waiting on an asset, account, or fact from the organizer.
 *
 * !! READ THIS BEFORE EDITING COPY !!
 * The brief says "use existing copy word-for-word where possible" and points at
 * slides. Those slides are images pasted inside the brief document itself —
 * there is no separate deck in Drive (searched by owner, by title, and across
 * shared presentations). Nothing here is the organizer's wording yet. Every
 * string marked NEEDED is placeholder written to be replaced, not approved copy.
 */

export const event = {
  name: 'Senoia Halloween',
  year: 2026,
  // October 2026 begins on a Thursday and Halloween falls on a Saturday.
  // Cross-checked against the Masquerade's confirmed Saturday, October 24, 2026.
  halloweenISO: '2026-10-31',
  tagline: 'A month of haunts, hayrides, and happy ghosts in downtown Senoia.', // NEEDED
  town: 'Senoia, Georgia',
};

/**
 * Drives the October calendar grid. `date` is ISO; `kind` picks the dot colour
 * and legend grouping. Add a `href` to make the entry clickable.
 *
 * NEEDED: every entry below except the Masquerade is a placeholder standing in
 * for a date on the organizer's slides. Delete what isn't real.
 */
export const CALENDAR_KINDS = {
  masquerade: { label: 'Masquerade Ball', color: 'var(--hallo-purple)' },
  trickOrTreat: { label: 'Trick or Treating', color: 'var(--hallo-orange)' },
  toddler: { label: 'Toddler Trick or Treat', color: 'var(--hallo-lime)' },
  contest: { label: 'Decorating Contest', color: 'var(--hallo-bone)' },
  other: { label: 'Around Town', color: 'var(--hallo-mist)' },
};

export const calendarEvents = [
  // Confirmed — pulled from the Masquerade micro-site's own data module.
  {
    date: '2026-10-24',
    kind: 'masquerade',
    title: 'The 3rd Annual Halloween Masquerade',
    detail: 'Down the Rabbit Hole — The Stone Lodge at Marimac Lake',
    href: 'https://thehalloweenmasquerade.com/',
  },
  // NEEDED — placeholder dates. Confirm all of these against the slides.
  {
    date: '2026-10-01',
    kind: 'contest',
    title: 'Decorating contest sign-ups open',
    detail: 'Homes and businesses within golf-cart distance of Main Street.',
  },
  {
    date: '2026-10-23',
    kind: 'contest',
    title: 'Decorating contest sign-ups close', // CONFIRM: deadline not in the brief
    detail: 'Last day to be added to the map.',
  },
  {
    date: '2026-10-29',
    kind: 'contest',
    title: 'Judging night', // CONFIRM
    detail: 'Judges tour the route after dark.',
  },
  {
    date: '2026-10-31',
    kind: 'toddler',
    title: 'Toddler Trick or Treat',
    detail: 'Downtown merchants, early afternoon.', // CONFIRM: time not in the brief
  },
  {
    date: '2026-10-31',
    kind: 'trickOrTreat',
    title: 'Trick or Treating',
    detail: 'Neighbourhood route — see the map.', // CONFIRM: time not in the brief
  },
];

/**
 * Section 2 — the decorating contest and its sign-up form.
 *
 * The address note is quoted from the brief and should stay close to verbatim:
 * it is the eligibility rule, not decoration.
 */
export const decoratingContest = {
  heading: 'Home & Business Decorating Contest',
  blurb: 'Deck out your porch, your storefront, or your whole front yard — then get yourself on the trick-or-treat map.', // NEEDED
  addressNote: 'Must be within legal golf carting distance from Main Street.',
  // Shown above the submit button. The brief does not include a disclosure, but
  // residential entries are published on a public map, so entrants are told.
  privacyNote:
    'Residential entries appear as a pin on the public trick-or-treat map. Only the street address is shown — never your name or email.',
  categories: [
    { id: 'residential', label: 'Residential', hint: 'Your home. Appears on the trick-or-treat map.' },
    { id: 'business', label: 'Business', hint: 'Your storefront. Judged separately from homes.' },
  ],
  prizes: [], // NEEDED: the brief mentions no prizes or judging criteria.
};

/** Section 3 — teaser only. The Masquerade is its own site; do not restate facts here. */
export const masqueradeTeaser = {
  heading: '3rd Annual Masquerade Ball',
  blurb: 'An 18-and-over evening of dinner, dancing, and a few curious surprises.', // NEEDED
  ctaLabel: 'Visit the Masquerade site',
  url: 'https://thehalloweenmasquerade.com/',
};

/** Section 4 — toddler trick or treat. */
export const toddlerTrickOrTreat = {
  heading: 'Toddler Trick or Treat',
  blurb: 'A daylight lap of downtown for the littlest ghosts, before the big kids come out.', // NEEDED
  detailsNeeded: true, // NEEDED: date, time, route, participating merchants, age range.
  facts: [], // Fill as { label, value } once the slides are transcribed.
};

/**
 * Section 5 — trick or treating.
 *
 * `mapDefaults` centres the map on downtown Senoia. Pins are not stored here:
 * approved residential addresses and admin-placed closures/parking live in the
 * `halloween_map_points` Firestore collection (see src/services/halloweenService.js).
 */
export const trickOrTreating = {
  heading: 'Trick or Treating',
  blurb: 'Every pin is a house that signed up to hand out candy. Tap one for the address.', // NEEDED
  mapDefaults: {
    // Downtown Senoia, GA — the Main Street the eligibility rule is measured from.
    center: [33.302, -84.554],
    zoom: 15,
  },
  emptyState: 'The map fills in as sign-ups come in. Check back closer to Halloween.',
};

export const seo = {
  title: 'Senoia Halloween 2026',
  description:
    'Trick-or-treat map, the decorating contest, the Masquerade Ball, and every October date in downtown Senoia, Georgia.', // NEEDED
  // CONFIRM: domain is being registered at Porkbun; update once it is chosen.
  url: 'https://senoiahalloween.com/',
  ogImage: null, // NEEDED: 1200x630 share image.
};
