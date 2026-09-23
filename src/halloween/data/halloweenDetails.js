/**
 * Single source of truth for the Senoia Halloween micro-site.
 *
 * Copy is transcribed from the organizer's slides (Shauna Mooney), five of
 * them: title, decorating contest, toddler trick-or-treat, trick or treating,
 * masquerade ball. The brief asked for the slide copy word-for-word, so most
 * strings here are verbatim. The "9/22 Edits" in the brief replaced the slides
 * with a new set, and every string below was re-checked against those.
 *
 * Comment convention, same as src/masquerade/data/eventDetails.js:
 *   CONFIRM — the source is ambiguous, contradictory, or looks like a typo.
 *   NEEDED  — waiting on an asset or fact the slides do not carry.
 */

export const event = {
  // Per the 9/22 edits: the title is "Halloween in Senoia", with no town line
  // and no year on the page. `year` still drives the calendar grid.
  name: 'Halloween in Senoia',
  year: 2026,
  // October 2026 begins on a Thursday and Halloween falls on a Saturday, which
  // matches every weekday the slides state (Fri Oct 16, Sat Oct 17, Sat Oct 24,
  // Fri Oct 30, Sat Oct 31).
  halloweenISO: '2026-10-31',
  // Verbatim from the title slide, one line each.
  tagline: ['Masquerade Ball', 'Home & Business Decorating Contest', 'Trick or Treating'],
};

/**
 * Drives the October calendar grid. `date` is ISO; `kind` picks the fill colour
 * of the day and the legend grouping. `label` is what is printed inside the day
 * itself, so keep it to two or three short words: a phone gives a day about
 * 40px. Add a `href` to make the entry clickable.
 *
 * `color` and `ink` are pairs: `ink` is the text colour that stays readable on
 * that fill. Change them together.
 *
 * Every date below comes from the slides.
 */
export const CALENDAR_KINDS = {
  masquerade: { label: 'Masquerade Ball', color: 'var(--hallo-purple-deep)', ink: 'var(--hallo-cream)' },
  trickOrTreat: { label: 'Trick or Treating', color: 'var(--hallo-orange)', ink: 'var(--hallo-black)' },
  toddler: { label: 'Toddler Trick-or-Treat', color: 'var(--hallo-yellow)', ink: 'var(--hallo-black)' },
  contest: { label: 'Decorating Contest', color: 'var(--hallo-black)', ink: 'var(--hallo-cream)' },
};

export const calendarEvents = [
  {
    date: '2026-10-16',
    kind: 'contest',
    label: 'Contest entries due',
    title: 'Decorating contest entries close',
    detail: 'Last day to submit your address for the home & business decorating contest.',
    href: '#contest',
  },
  {
    date: '2026-10-17',
    kind: 'contest',
    label: 'Contest judging',
    title: 'Decorating contest judged',
    detail: 'Judges tour the entries.',
    href: '#contest',
  },
  {
    date: '2026-10-24',
    kind: 'masquerade',
    // Soft hyphens (\u00AD): invisible unless the word has to break, which it
    // does in a phone-width day. Screen readers get `title`, not this.
    label: 'Mas\u00ADquer\u00ADade Ball',
    title: '3rd Annual Masquerade Ball',
    detail: 'Down the Rabbit Hole — cocktails, magical entertainment, dinner, and dancing.',
    href: 'https://thehalloweenmasquerade.com/',
  },
  {
    date: '2026-10-30',
    kind: 'toddler',
    label: 'Toddler Trick-or-Treat',
    title: 'Toddler Trick-or-Treat',
    detail: '11am – 1pm around Main Street & Barnes Street, for ages 0–5.',
    href: '#toddler',
  },
  {
    date: '2026-10-31',
    kind: 'trickOrTreat',
    label: 'Trick or Treating',
    title: 'Trick or Treating',
    detail: '5:30pm – 8:30pm in the historic district and Willow Dell. Road closures and the detailed map are on this site.',
    href: '#trick-or-treating',
  },
];

/**
 * Section 2 — the decorating contest and its sign-up form.
 *
 * Two independent choices on the form:
 *   category        residential | business — who you are. Drives whether the
 *                   address is eligible for the trick-or-treat map.
 *   contestCategory spooky | pumpkinPals   — which judging lane you enter.
 * They are separate fields precisely because they are separate questions; a
 * business can enter either lane.
 */
export const decoratingContest = {
  heading: 'Decorating Contest',
  blurb: 'Celebrate the spooky season by decorating your home or business!',
  judgedLabel: 'Judged Saturday October 17th',
  deadlineLabel: 'Submit your address by Friday October 16th',
  eligibility: [
    'Any home or brick & mortar business within a 2 mile radius of historic Senoia',
    'In other words - anyone within legal golf carting distance from Main Street',
  ],
  // The short form of the rule, shown under the address field.
  addressNote: 'Must be within a 2 mile radius of historic Senoia — anyone within legal golf carting distance from Main Street.',
  // The slides say "Winners will be featured on Enjoy Senoia and on the official
  // Trick or Treating map!", while the written brief says every *residential*
  // entry goes on the map. CONFIRM which is intended. Either works without a
  // code change: an admin publishes addresses to the map one at a time, so the
  // organizer can publish all residential entries or only the winners.
  winnersNote: 'Winners will be featured on Enjoy Senoia and on the official Trick or Treating map!',
  // Shown under winnersNote. src/halloween/assets/kimberly-peacock-realtor.png
  logoAlt: 'Kimberly Peacock, REALTOR®',
  privacyNote:
    'Residential entries may appear as a pin on the public trick-or-treat map. Only the street address is shown — never your name or email.',
  categories: [
    { id: 'residential', label: 'Home', hint: 'A residence. Eligible for the trick-or-treat map.' },
    { id: 'business', label: 'Business', hint: 'A brick & mortar business.' },
  ],
  // Verbatim from the slide, including the "Category:" framing.
  contestCategories: [
    {
      id: 'spooky',
      label: 'Spooky',
      blurb: 'This one’s for the horror fans - if your home/business is a real “Nightmare on Elm Street” and your decor is a bit more hide-your-eyes creepy zombie and scary stuff, this is your lane!',
    },
    {
      id: 'pumpkinPals',
      label: 'Pumpkin Pals',
      blurb: 'Okay Charlie Brown, do you love all things fall and Great Pumpkin? Are black cats, jack-o-lanterns and bedsheet ghosts your style? Classic Halloween decorators should enter here!',
    },
  ],
};

/** Section 3 — teaser only. The Masquerade is its own site; do not restate facts here. */
export const masqueradeTeaser = {
  heading: '3rd Annual Masquerade Ball',
  blurb: 'Cocktails, magical entertainment, dinner, and dancing! Senoia’s annual 18+ Halloween soiree',
  ctaLabel: 'Visit the Masquerade site',
  url: 'https://thehalloweenmasquerade.com/',
};

/** Section 4 — toddler trick or treat. All verbatim from the slide. */
export const toddlerTrickOrTreat = {
  heading: 'Toddler Trick-or-Treat',
  whenLabel: 'Friday, October 30th 11am - 1pm',
  kicker: 'Calling All Tiny Ghouls & Goblins!',
  blurb: [
    'Join us for Toddler Trick-or-Treating in Senoia, a Halloween celebration for our littlest residents ages 0-5!',
    // CONFIRM: the slide reads "trick-or treating" — hyphenated here.
    'Come dressed in your cutest, silliest, or spookiest Halloween costume for a trick-or-treating around town:',
  ],
  // The slide sets the route on its own line, as a subtitle.
  where: 'Main Street & Barnes Street',
  // "Caycies" is left exactly as written; it may be the business's own styling
  // rather than a missing apostrophe.
  participatingBusinesses: [
    'Classic Market',
    'Caycies Boutique',
    'Zackie Hart',
    'Borgo Italia',
    'The Parlor Salon',
    'Greenhouse Mercantile',
    'Senoia Bicycle',
  ],
  // CONFIRM: the slide reads "recieve" — corrected to "receive" here.
  perk: 'First 100 visitors to The Peculiar Blooms (inside The Veranda) receive a free Trick-or-Treat tote!',
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
  dateLabel: 'October 31st',
  // Per the 9/22 edits. The slide prints the same hours under "Road Closures".
  whenLabel: '5:30pm - 8:30pm',
  blurb: 'Senoia kids & families can collect candy from private homeowners in the historic district and Willow Dell neighborhoods!',
  mapNote: 'For updates and detailed map',
  roadClosures: [
    'Please note: for safety, Willow Dell neighborhood will have traffic mitigation efforts and “No Parking” areas',
  ],
  mapDefaults: {
    // Downtown Senoia, GA — the Main Street the eligibility rule is measured from.
    center: [33.302, -84.554],
    zoom: 15,
  },
  // Pin colours, shared by the map and its legend. `fill` must read against both
  // the OpenStreetMap tiles and the cream page.
  mapKinds: {
    residential: { fill: '#e27925', label: 'Handing out candy' },
    closure: { fill: '#c81e1e', label: 'Road closed' },
    parking: { fill: '#5a4466', label: 'Parking' },
  },
  emptyState: 'The map fills in as entries come in. Check back closer to Halloween.',
};

export const seo = {
  title: 'Halloween in Senoia',
  description:
    'Trick-or-treat map, the home & business decorating contest, Toddler Trick-or-Treat, and the Masquerade Ball — every October date in downtown Senoia, Georgia.',
  url: 'https://senoiahalloween.com/',
  ogImage: null, // NEEDED: 1200x630 share image.
};
