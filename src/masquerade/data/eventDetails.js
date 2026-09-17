/**
 * Single source of truth for The 3rd Annual Masquerade: Down the Rabbit Hole.
 *
 * Content comes from the organizer intake questionnaire completed by Shauna Mooney.
 * Anything marked CONFIRM is unresolved in the intake doc — verify before launch.
 * Anything marked NEEDED is waiting on an asset or account from the organizer.
 */

export const event = {
  name: 'The 3rd Annual Halloween Masquerade',
  theme: 'Down the Rabbit Hole',
  edition: '3rd Annual',
  // Confirmed against the organizer's title card, which reads
  // "SATURDAY, OCTOBER 24, 2026" — the intake doc's "2006" was a typo.
  dateISO: '2026-10-24',
  dateLabel: 'Saturday, October 24, 2026',
  dateShort: 'Oct 24, 2026',
  timeLabel: '5:30 PM – 11:30 PM',
  ageLabel: '18 and over',
  weatherLabel: 'Rain or shine',
  capacityLabel: 'Limited to roughly 200 guests',
  venue: {
    // CONFIRM: the intake doc gives one string mixing two locations —
    // "Stone Lodge at Marimac Lake, Senoia Library: 148 Pylant Street".
    // 148 Pylant Street is treated here as parking (see FAQ), not the venue address.
    name: 'The Stone Lodge at Marimac Lake',
    cityState: 'Senoia, Georgia',
    // How the venue is written on the page. `name` stays clean because the
    // JSON-LD in MasqueradeSEO pairs it with a structured address.
    label: 'The Stone Lodge at Marimac Lake, Senoia GA',
    addressLine: null, // NEEDED: street address for the Stone Lodge
    // Not rendered — the organizer cut it from the page; the FAQ carries the fact.
    setting: 'An outdoor evening under tent, with the Stone Lodge open indoors for VIP guests.',
  },
  host: 'Presented in support of the Senoia Downtown Development Authority',
  hashtag: '#DowntheRabbitHole',
};

/** Hero copy, as written by the organizer. Paragraphs render in order. */
export const heroBlurb = [
  'This Halloween, follow the white rabbit through the keyhole in the door for an evening inspired by the strange, elegant, and wonderfully curious world of Wonderland.',
  'Spend the evening enjoying dinner, drinks, music, dancing, and a few curious surprises along the way.',
];

/** Ticketing. NEEDED: the live Ticket Tailor box office URL / widget id. */
export const ticketing = {
  // Not rendered — the organizer cut the "handled through Ticket Tailor" line
  // from the sales note. Kept because the box office still has to be built here.
  platform: 'Ticket Tailor',
  url: null, // NEEDED: e.g. https://buytickets.at/thehalloweenmasquerade
  salesNote: 'Dinner and VIP ticket sales close October 20. After Party tickets will also be sold at the door.',
  // CONFIRM: intake answer was written as a question — "No refunds no transfers?"
  refundPolicy: 'All sales are final. Tickets are non-refundable and non-transferable.',
};

/**
 * Ticket tiers. `status` drives the button state per tier:
 * 'onSale' | 'waitlist' | 'closed' | 'atDoor'
 */
export const tiers = [
  {
    id: 'vip',
    name: 'VIP',
    subtitle: 'The Tasting Room',
    price: 150,
    doors: 'Entry at 5:30 PM',
    status: 'onSale',
    featured: true,
    blurb:
      'The full evening, from the first pour to the last dance — early entry, the Stone Lodge tasting room, and a seat at dinner.',
    includes: [
      'Early admission beginning at 5:30 PM',
      'Commemorative photo keepsake',
      'Access to the Stone Lodge tasting room (planned: bourbon & wine)',
      'Passed hors d’oeuvres',
      'Two acts of ambient entertainment throughout (cirque acrobatics, tableside magic)',
      'Seated dinner',
      'Cash bar',
      'After-dark fire experience',
      'Interactive games',
      'Artisan boutique until 9:30 PM',
      'Admission to the Wonderland After Party — DJ and dancing',
    ],
  },
  {
    id: 'dinner',
    name: 'Seated Dinner',
    subtitle: 'The Mad Tea Party',
    price: 100,
    doors: 'Entry at 6:30 PM, dinner at 7:00 PM',
    status: 'onSale',
    featured: false,
    blurb:
      'An elegant seated dinner beneath the tent, followed by the doors of Wonderland swinging open.',
    includes: [
      'Admission beginning at 6:30 PM',
      'One act of ambient entertainment throughout (cirque acrobatics, tableside magic)',
      'Seated dinner',
      'Cash bar',
      'After-dark fire experience',
      'Interactive games',
      'Artisan boutique until 9:30 PM',
      'Admission to the Wonderland After Party — DJ and dancing',
    ],
  },
  {
    id: 'after-party',
    name: 'General Admission',
    subtitle: 'The Wonderland After Party',
    price: 25,
    // CONFIRM: intake doc says "Entry at 8:30 PM" in the tier heading but
    // "Admission beginning at 8:00 PM" in the inclusions, and the run of show
    // has after-party doors at 8:00. Showing 8:00 PM.
    doors: 'Entry at 8:00 PM',
    status: 'atDoor',
    featured: false,
    blurb:
      'Join us after dinner as Wonderland opens its doors for the final chapter of the evening.',
    includes: [
      'Admission beginning at 8:00 PM',
      'Cash bar',
      'After-dark fire experience',
      'Interactive games',
      'Artisan boutique until 9:30 PM',
      'The Wonderland After Party — DJ and dancing',
    ],
  },
];

/** Run of show. */
export const schedule = [
  {
    time: '5:30 PM',
    title: 'VIP doors open',
    detail:
      'The tasting room opens, passed appetizers begin, and ambient cirque and magic move through the crowd. Cash bar and artisan boutique open.',
    tier: 'VIP',
  },
  { time: '6:30 PM', title: 'Dinner doors open', detail: 'Seated dinner guests arrive.', tier: 'VIP + Dinner' },
  {
    time: '7:00 PM',
    title: 'Seating for dinner',
    detail: 'Ambient entertainment ends and the VIP tasting lounge closes.',
    tier: 'VIP + Dinner',
  },
  { time: '8:00 PM', title: 'After Party doors open', detail: 'Wonderland opens to all ticket holders.', tier: 'All guests' },
  {
    time: '8:30 PM',
    title: 'Fire show & awards',
    detail:
      'The after-dark fire experience, then the winners of best dressed and the scavenger hunt are announced. The dance party begins.',
    tier: 'All guests',
  },
  { time: '9:30 PM', title: 'Artisan boutique closes', detail: 'Last chance to shop the makers.', tier: 'All guests' },
  { time: '11:00 PM', title: 'Last call', detail: 'Final call at the cash bar.', tier: 'All guests' },
  { time: '11:30 PM', title: 'The night ends', detail: 'Down the rabbit hole and home again.', tier: 'All guests' },
];

export const dressCode = {
  headline: 'The Dress Code',
  body: `Think masquerade meets Wonderland. Masks and headpieces are encouraged, black tie and evening wear. Guests are invited to interpret the theme — an elegant masquerade with character: Alice, the White Rabbit, Queen of Hearts, Mad Hatter, Cheshire Cat. An outfit for a whimsical garden party, chess players and playing cards with a touch of mystery. Creative outfits are highly encouraged, but not required.`,
  // Not rendered — the organizer cut it from the page; the FAQ still says masks
  // are not sold on site.
  note: 'Masks are not provided or sold on site — bring your own.',
};

/* Not rendered — the organizer cut the Feast section. Kept: the caterer and
   bar are still who is booked, and the dietary note is a real commitment. */
export const menu = {
  caterer: 'Maison Savahge',
  bar: 'Crust & Craft',
  barNote: 'Cash bar',
  courses: [
    {
      course: 'Hand Passed',
      vipOnly: true,
      items: [
        'Smoked trout dip with garden herbs, lemon, rice cracker',
        'Hand-folded chicken empanada, bright chimichurri',
        'English cucumber with creamy goat cheese, garlic onion crunch, sesame seed, chives',
      ],
    },
    {
      course: 'Starter',
      vipOnly: false,
      items: [
        'Alo Farms mixed and micro greens with apples and cider vinaigrette',
        'Sea salt focaccia and rosemary butter',
      ],
    },
    {
      course: 'Main',
      vipOnly: false,
      items: [
        'Grilled French-cut chicken breast, caramelized onions, olives, cherries',
        'Brown butter garden herb pilaf',
        'Tenderly roasted seasonal vegetables',
      ],
    },
  ],
  dietaryNote: 'A vegetarian option is available by request.',
};

/* Not rendered — the performer credits went with the Feast section. Kept: these
   are the acts under contract. */
export const performers = [
  {
    name: 'DJ Evan',
    role: 'Wonderland After Party',
    detail: 'Spinning the dance floor from 8:30 PM until last call.',
  },
  {
    name: 'Circessence',
    role: 'Cirque & fire',
    detail: 'Aerial and ambient cirque performance directed by Constance Echo Palmer, plus the after-dark fire experience.',
  },
  {
    name: 'Marvin Ross',
    role: 'Illusionist & cardistry',
    detail: 'Tableside magic and sleight of hand moving through the tent all evening.',
  },
];

/**
 * The panel beside the dress code. The organizer replaced the original list of
 * activities with the run of show, one comment per item.
 *
 * These match the published preview verbatim, including wording that arrived by
 * direct edits to that page rather than through a comment — the live page is the
 * copy of record here, so it is followed rather than overwritten.
 */
export const happenings = [
  '5:30 VIP doors open with our tasting room, ambient cirque & magic entertainment, with passed appetizers',
  '7:00 Seating for dinner, ambient entertainment ends, VIP tasting lounge closes',
  '8:30 After dark fire experience, awards for best dressed, winner of scavenger hunt announced, dance party begins',
  'All evening: cash bar, artisan boutique, interactive games & photo opportunities',
];

/** NEEDED: confirmed sponsor list and logo files. Tiers are confirmed. */
export const sponsorTiers = [
  { id: 'queen', name: 'Queen of Hearts', price: 3000, blurb: 'Title billing across the evening.' },
  { id: 'hatter', name: 'Mad Hatter', price: 1500, blurb: 'Featured presence throughout Wonderland.' },
  { id: 'rabbit', name: 'White Rabbit', price: 750, blurb: 'Named recognition on site and on the night.' },
  { id: 'curiosities', name: 'Cabinet of Curiosities', price: 500, blurb: 'A place among our supporters.' },
];

export const sponsors = []; // NEEDED: [{ name, tierId, logo, url }]

export const faqs = [
  {
    q: 'Who can attend?',
    a: 'The Masquerade is an 18 and over evening. Photo ID is checked at the gate, and wristbands are issued for VIP guests and for anyone under 21.',
  },
  {
    q: 'Where do I park?',
    a: 'Parking is available in the Senoia Library lots at 148 Pylant Street, Senoia, GA 30276, including ADA parking. A shuttle is under consideration and will be announced here if confirmed.',
  },
  {
    q: 'Is the venue accessible?',
    a: 'ADA parking is available, and there is ADA access to the Stone Lodge restrooms. Please note the event is largely outdoors on natural terrain — flat or sturdy footwear is a friend to a long evening.',
  },
  {
    q: 'What is the weather plan?',
    a: 'The Masquerade goes on rain or shine. The evening is held under tent, with the Stone Lodge open indoors for VIP guests.',
  },
  {
    q: 'What should I wear?',
    a: 'Black tie and evening wear, with masks and headpieces encouraged. Interpret Wonderland however you like — creative costumes are welcome but never required. Masks are not sold on site.',
  },
  {
    q: 'Can I bring my own food or drinks?',
    a: 'No outside food or beverages, including alcohol, may be brought in. A cash bar by Crust & Craft is open through the evening.',
  },
  {
    q: 'When do tickets stop selling?',
    a: 'VIP and seated dinner tickets close on October 20 so the kitchen can set the table. After Party tickets will also be available at the door on the night of the event.',
  },
  {
    q: 'Can I get a refund or give my ticket to a friend?',
    a: 'All sales are final. Tickets are non-refundable and non-transferable.', // CONFIRM: see ticketing.refundPolicy
  },
];

export const contact = {
  // Only the public DDA address goes on the site — never the organizer's personal contact.
  email: 'welcome@enjoysenoia.com',
  instagram: {
    handle: '@TheHalloweenMasquerade',
    url: 'https://www.instagram.com/thehalloweenmasquerade/', // CONFIRM: handle URL
  },
  partnerInstagram: {
    handle: '@EnjoySenoia',
    url: 'https://www.instagram.com/enjoysenoia/', // CONFIRM: handle URL
  },
  ddaUrl: 'https://enjoysenoia.com',
};

export const seo = {
  title: 'The 3rd Annual Halloween Masquerade: Down the Rabbit Hole | Senoia, GA',
  description:
    'An elegant Halloween masquerade at the Stone Lodge at Marimac Lake in Senoia, Georgia. Saturday, October 24, 2026 — cirque, fire, a seated dinner and the Wonderland After Party.',
  ogImage: null, // NEEDED: 1200x630 share image
};
