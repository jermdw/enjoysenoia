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
    detail: '5:30pm – 8:30pm in the historic district and Willow Dell. The trick-or-treat map is on this site.',
    href: '#trick-or-treating',
  },
];

/**
 * Section 2 — the decorating contest. Entries closed Friday October 16th and
 * judging was Saturday the 17th; this is the results copy from Shauna's
 * 10/19 email, verbatim. SignupForm.jsx and the fields it reads (`categories`,
 * `contestCategories`, `addressNote`, `privacyNote`) stay in case the contest
 * runs again next year.
 */
export const decoratingContest = {
  heading: 'Decorating Contest',
  // The sign-up switch. Leave false: the section now shows results, not a form.
  entriesOpen: false,
  closedCta: 'See the contest winner',
  // CONFIRM: the email says "5 Categories" but names four.
  results: [
    'Thank you for all who participated! Our entrants were judged on 5 Categories: Creativity & Theming, Composition & Use of Space, Craftsmanship/DIY Element, and Overall Halloween Joy.',
  ],
  winner: 'And the Winner is… the Pirates at 95 Middle Street!',
  honorableMentions:
    'Honorable mentions to Summerween, the Peanuts gang, the Wicked Witches and all of the Giant Skellys and Cutie Blow-ups around town.',
  mapNote: 'You can visit the entrants (and trick-or-treat spots) for yourself by using the map below.',
  sponsorThanks: 'Special appreciation to Kimberly Peacock, Realtor for sponsoring and assisting in judging efforts!',
  // src/halloween/assets/kimberly-peacock-realtor.png
  logoAlt: 'Kimberly Peacock, REALTOR®',
  addressNote: 'Must be within a 2 mile radius of historic Senoia — anyone within legal golf carting distance from Main Street.',
  privacyNote:
    'Residential entries may appear as a pin on the public trick-or-treat map. Only the street address is shown — never your name or email.',
  categories: [
    { id: 'residential', label: 'Home', hint: 'A residence. Eligible for the trick-or-treat map.' },
    { id: 'business', label: 'Business', hint: 'A brick & mortar business.' },
  ],
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
  // Shown under the date pill: the heading in the route's style, then body copy.
  firstStop: {
    heading: 'First stop: The Peculiar Blooms',
    body: 'Start at our local kid’s boutique… the first 100 visitors receive a complimentary Trick-or-Treat tote! (located inside The Veranda)',
  },
  // "Caycies" is left exactly as written; it may be the business's own styling
  // rather than a missing apostrophe.
  participatingBusinesses: [
    'Senoia Welcome Center',
    'The Classic Market',
    'Caycies Boutique',
    'Zackie Hart',
    'Borgo Italia',
    'The Parlor Salon',
    'The Glass House Society',
    'Greenhouse Mercantile',
    'Senoia Bicycle',
    'Book Love',
    'Madeley Salon',
    'Mess Hall on Main',
    'Lisa’s Creperie',
    'Olivia James Boutique',
    'State Farm: Chase Mewbourn',
    'Edward Jones: Jennifer Camp',
  ],
  // Closes the run of names; kept out of the array because it is not a business.
  moreBusinesses: 'and more!',
};

/**
 * Section 5 — trick or treating.
 *
 * `mapDefaults` centres the map on downtown Senoia. Pins are not stored here:
 * approved residential addresses live in the `halloween_map_points` Firestore
 * collection (see src/services/halloweenService.js).
 */
export const trickOrTreating = {
  heading: 'Trick or Treating',
  dateLabel: 'October 31st',
  // Per the 9/22 edits. The slide prints the same hours under "Road Closures".
  whenLabel: '5:30pm - 8:30pm',
  // Verbatim from Shauna's 10/19 email.
  blurb: [
    'Have fun, be safe and respectful, and thank you to our DDA volunteers and neighbors that help make downtown great!',
    'Per Halloween tradition: lights on and decorations usually means a homeowner is handing out candy…on the map below, “Trick-or-Treat Zone” (Bats) are where multiple neighbors will be welcoming costumed kiddos.',
  ],
  mapDefaults: {
    // Downtown Senoia, GA — the Main Street the eligibility rule is measured from.
    center: [33.302, -84.554],
    zoom: 15,
  },
  // Pin colours, shared by the map and its legend. `fill` must read against both
  // the OpenStreetMap tiles and the cream page. Per the 10/19 email the public
  // map shows only contest entrants, zones and the Willow Dell outline, so
  // closure and parking pins are left off it (they stay in the admin).
  mapKinds: {
    residential: { fill: '#e27925', label: 'Decorating Contest Entrant' },
  },
  // The winning entrant, drawn as a star instead of a dot. Matched on the
  // halloween_map_points doc id (95 Middle St.); re-publishing that pin in the
  // admin gives it a new id, so update this if you do.
  winner: {
    pointId: '0sgTfKsWCurhYGn6HMyE',
    label: 'Decorating Contest Winner',
    fill: '#f6b93b',
  },
  // Drawn as black bats rather than dots. Fixed spots from the organisers, so
  // they live here instead of in Firestore (a new pin kind would need a rules
  // change and a hand deploy). Corners are the OSM street crossings; the two
  // stretches use the middle of that stretch of street. [lat, lng].
  trickOrTreatZones: {
    label: 'Trick or Treat Zone',
    spots: [
      { name: 'Morgan St at Lower Creek Trail', at: [33.298421, -84.556453] },
      // Moved up from Pylant at Seavy St (10/19) to take in 9 Johnson St, which
      // asked to join the zones; it sits on this corner.
      { name: 'Pylant St at Johnson St', at: [33.302671, -84.55622] },
      { name: 'Pylant St between Couch St and Johnson St', at: [33.303987, -84.556103] },
      { name: 'Baggarly Way north of Johnson St', at: [33.303241, -84.554607] },
      // The centre of the Willow Dell outline below (its area centroid).
      { name: 'Willow Dell neighborhood', at: [33.305328, -84.561534] },
    ],
  },
  // Shaded areas drawn under the pins, and listed in the legend. OSM has no
  // boundary for Willow Dell, so this outline is Willow Dell Drive (the loop
  // and its entrance from Pylant St), Senoya Ct and Sherrels Ford from OSM,
  // widened about 55 m to take in the lots. Wihuri Pkwy is left out: it runs
  // past the large non-residential buildings south of the loop. Points are
  // [lat, lng].
  mapAreas: [
    {
      id: 'willow-dell',
      label: 'Willow Dell neighborhood',
      fill: '#f6b93b',
      stroke: '#a14d0c',
      polygon: [
        [33.30514, -84.56474],
        [33.30559, -84.56538],
        [33.30607, -84.56560],
        [33.30689, -84.56555],
        [33.30754, -84.56498],
        [33.30773, -84.56423],
        [33.30774, -84.56159],
        [33.30753, -84.56064],
        [33.30700, -84.56002],
        [33.30509, -84.55860],
        [33.30467, -84.55848],
        [33.30412, -84.55857],
        [33.30366, -84.55816],
        [33.30282, -84.55790],
        [33.30173, -84.55772],
        [33.30125, -84.55783],
        [33.30103, -84.55832],
        [33.30125, -84.55881],
        [33.30314, -84.55918],
        [33.30347, -84.55948],
        [33.30376, -84.56191],
      ],
    },
  ],
  emptyState: 'The map fills in as entries come in. Check back closer to Halloween.',
};

export const seo = {
  title: 'Halloween in Senoia',
  description:
    'Trick-or-treat map, the home & business decorating contest, Toddler Trick-or-Treat, and the Masquerade Ball — every October date in downtown Senoia, Georgia.',
  url: 'https://senoiahalloween.com/',
  ogImage: 'https://senoiahalloween.com/halloween/og-image.png', // 1200x630; scripts/build-og-images.mjs
};
