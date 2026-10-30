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
  // Not rendered — the organizer cut the capacity line from the FAQ intro.
  capacityLabel: 'Limited to roughly 200 guests',
  venue: {
    // CONFIRM: the intake doc gives one string mixing two locations —
    // "Stone Lodge at Marimac Lake, Senoia Library: 148 Pylant Street".
    // 148 Pylant Street is treated here as parking (see FAQ), not the venue address.
    name: 'The Stone Lodge at Marimac Lake',
    // Not rendered — the organizer deleted the footer, which was its only home.
    cityState: 'Senoia, Georgia',
    // How the venue is written on the page. `name` stays clean because the
    // JSON-LD in MasqueradeSEO pairs it with a structured address.
    label: 'The Stone Lodge at Marimac Lake, Senoia GA',
    addressLine: null, // NEEDED: street address for the Stone Lodge
    // Not rendered — the organizer cut it from the page; the FAQ carries the fact.
    setting: 'An outdoor evening under tent, with the Stone Lodge open indoors for VIP guests.',
  },
  // Not rendered — went with the footer. This is the DDA's presenting credit;
  // worth confirming the event is allowed to run without it.
  host: 'Presented in support of the Senoia Downtown Development Authority',
  // Not rendered — the organizer deleted the footer, which was its only home.
  hashtag: '#DowntheRabbitHole',
};

/**
 * After the event. The organizer's 2026-10-29 email replaced the hero blurb
 * ("This Halloween, follow the white rabbit…") with a thank-you and links to
 * the night's photos, and asked for the credits below.
 */
export const thankYou = {
  lead: 'Thank you for joining us! You can find your photos below.',
  photos: [
    {
      label: 'Red Carpet',
      url: 'https://listings.mpp-media.com/listings/01a18836-e069-72f8-8ecf-43061791d891/download-center?signature=52d26a44bce9f1f1b92bd8dae0d4203c96ad7323085f4f5308d0fdf080618c35',
    },
    { label: 'Photobooth', url: 'https://boothpics.com/X0X4' },
  ],
  // The organizer's poster of sponsor and Friends of Wonderland logos, as sent
  // (973×1544, IMG_1126.jpeg).
  sponsorLogos: '/masquerade/sponsors-2026.jpg',
  sponsors: [
    { name: 'Susan Medina with Modern Woodmen', url: 'https://reps.modernwoodmen.org/smedina/' },
    { name: 'Origin Aesthetics', url: 'https://www.origin-aesthetics.com' },
    { name: 'Roof King', url: 'https://roofkingexteriors.com' },
    { name: 'Jake McPherson with First Community Mortgage', url: 'https://www.firstcommunitymortgage.com/loan-officer/jakemcpherson/' },
    { name: 'Senoia Bicycle', url: 'https://www.senoiabicycle.com' },
  ],
  friends: [
    { name: 'Glass House Society', role: 'floral centerpieces', url: 'https://www.facebook.com/p/Glass-House-Society-61587607612747/' },
    { name: '4 Rivers Antiques', role: 'boutique & interior decor', url: 'https://www.facebook.com/kellyandcoantiques/' },
    { name: 'Heather Ozee', role: 'boutique & artist', url: 'https://www.heatherozeedesigns.com' },
    { name: 'House of Eteaquette', role: 'VIP', url: 'https://www.houseofeteaquette.com' },
    { name: 'Crooks Marketplace', role: 'VIP Bourbon tasting', url: 'https://crookscostplus.com' },
    { name: 'Doc Brown Spirits', role: 'VIP Bourbon tasting', url: 'https://docbrownfarm.com' },
  ],
  specialThanks: [
    { name: 'Hidden Gem Bar Co.', role: 'Savannah, your Bourbon tasting guide', url: 'https://www.instagram.com/hiddengembarco' },
    // The email spells it "Sahavge"; "Savahge" matches menu.caterer and the
    // caterer's own email address, which the organizer gave as the link.
    { name: 'Maison Savahge', role: 'your chef & catering', url: 'mailto:DianeSavahge@gmail.com' },
    { name: 'Crust & Craft', role: 'your bar', url: 'https://www.crustandcraftpizza.com/senoia' },
    { name: 'Constance Echo Palmer & cast', role: 'your acrobatic entertainment', url: 'https://www.circusecho.com' },
    { name: 'Marvin Ross', role: 'your illusionist & magician', url: 'https://www.marvinross.com/about' },
  ],
  // Only `name` is linked: .masq-link's underline is drawn for one line.
  hosts: {
    before: 'And your hosts, the',
    name: 'Downtown Development Authority',
    after: ', as represented by Shauna Mooney & Taylor Schmeck.',
    url: 'https://www.enjoysenoia.com',
  },
  signOff: 'See you next year, Mateys!',
};

/**
 * Ticketing. Both links go straight to Ticket Tailor's hosted checkout (the
 * "Select tickets" step), skipping the Senoia DDA box office and event pages.
 * They're the targets of each event page's "Buy tickets" button, from the
 * events at tickettailor.com/events/senoiadda/2391217 (tickets) and
 * /2391233 (sponsorship). If an event is recreated, its id/chk pair changes.
 */
export const ticketing = {
  // Not rendered — the organizer cut the "handled through Ticket Tailor" line
  // from the sales note.
  platform: 'Ticket Tailor',
  url: 'https://www.tickettailor.com/checkout/view-event/id/9006557/chk/7e8b027ec397999f7d6652520c9ae4b8/',
  sponsorshipUrl: 'https://www.tickettailor.com/checkout/view-event/id/9006568/chk/6edd76ff76867da0933867f5dff34d54/',
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
    // Confirmed by the organizer: 8:00 PM is the door time. The intake doc's
    // "8:30 PM" was wrong and she is correcting it on the ticket listing.
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
/**
 * Sponsorship tiers. The amounts are no longer shown — the organizer wants the
 * sponsor's logo in that spot instead — but they are what each package costs,
 * so they stay here for the conversation that follows the enquiry email.
 */
export const sponsorTiers = [
  { id: 'queen', name: 'Queen of Hearts', price: 3000, blurb: 'Title billing across the evening.' },
  { id: 'hatter', name: 'Mad Hatter', price: 1500, blurb: 'Featured presence throughout Wonderland.' },
  { id: 'rabbit', name: 'White Rabbit', price: 750, blurb: 'Named recognition on site and on the night.' },
  { id: 'curiosities', name: 'Cabinet of Curiosities', price: 500, blurb: 'A place among our supporters.' },
];

export const sponsors = []; // NEEDED: [{ name, tierId, logo, url }]

/**
 * Photographs from the first two Masquerades, ordered so the gallery runs from
 * late afternoon through to the end of the night.
 *
 * The 2025 frames carry EXIF capture times (5:49 PM to 8:49 PM). The 2024 frames
 * were exported without EXIF, but their numbering runs in order and darkens
 * steadily, which places them along the same evening. The two years interleave
 * on purpose: the section is one evening unfolding, not a year-by-year archive.
 *
 * EXIF was stripped when these were resized for the web.
 */
export const gallery = [
  { src: '/masquerade/gallery/img_7495.jpg', w: 800, h: 1200, alt: 'Tables laid under the tent in late afternoon light, black and white drapes overhead and red feather centrepieces on the linen.' },
  { src: '/masquerade/gallery/20241026_dsc_0882.jpg', w: 800, h: 1200, alt: 'A centrepiece of dark roses and berries in a gold vase, lit by candles on a black tablecloth.' },
  { src: '/masquerade/gallery/img_7498.jpg', w: 800, h: 1200, alt: 'Long tables set beneath the open-sided tent, string lights strung above and pine woods beyond.' },
  { src: '/masquerade/gallery/img_7504.jpg', w: 800, h: 1200, alt: 'A place setting with a red menu card, gold charger and white roses.' },
  { src: '/masquerade/gallery/img_7506.jpg', w: 800, h: 1200, alt: 'Table detail — lanterns, white roses and a red runner across black linen.' },
  { src: '/masquerade/gallery/img_7524.jpg', w: 800, h: 1200, alt: 'The tent seen from the path at dusk, its draped entrance lit by hanging bulbs.' },
  { src: '/masquerade/gallery/20241026_dsc_0892.jpg', w: 1600, h: 1067, alt: 'An aerialist in silver poses inside a suspended hoop above the crowd, autumn trees gold behind her.' },
  { src: '/masquerade/gallery/img_7639.jpg', w: 800, h: 1200, alt: 'An aerial artist balances on a standing hoop against bare branches and a pale sky.' },
  { src: '/masquerade/gallery/img_7764.jpg', w: 1024, h: 683, alt: 'Bottles lined along the bar in the tasting room.' },
  { src: '/masquerade/gallery/20241026_dsc_0899.jpg', w: 1600, h: 1067, alt: 'Masked guests laughing together around a cocktail table at sunset.' },
  { src: '/masquerade/gallery/20241026_dsc_0915.jpg', w: 1600, h: 1067, alt: 'An acrobat hangs upside down from a hoop on the lawn while masked guests watch.' },
  { src: '/masquerade/gallery/img_7893.jpg', w: 800, h: 1200, alt: 'A performer arches backwards through a hoop among the pines.' },
  { src: '/masquerade/gallery/img_7905.jpg', w: 800, h: 1200, alt: 'Two guests in masks and black tie pose against a red and gold striped backdrop.' },
  { src: '/masquerade/gallery/20241026_dsc_0921.jpg', w: 1600, h: 1067, alt: 'An aerialist in silver steps through a hoop as guests gather on the grass.' },
  { src: '/masquerade/gallery/20241026_dsc_0934.jpg', w: 800, h: 1200, alt: 'A couple in a feathered mask and blue tuxedo pose at the Moonlight on Marimac backdrop.' },
  { src: '/masquerade/gallery/img_7980.jpg', w: 1024, h: 683, alt: 'Two guests in top hats and masks pose between red and gold curtains.' },
  { src: '/masquerade/gallery/20241026_dsc_0938.jpg', w: 800, h: 1200, alt: 'A couple in black tie and masks at the photo backdrop after dark.' },
  { src: '/masquerade/gallery/20241026_dsc_0999.jpg', w: 800, h: 1200, alt: 'Two guests in red and black gowns and masks pose at the backdrop.' },
  { src: '/masquerade/gallery/20241026_dsc_1008.jpg', w: 1600, h: 1067, alt: 'Guests seated along the candlelit dinner table beneath the trees.' },
  { src: '/masquerade/gallery/20241026_dsc_1161.jpg', w: 800, h: 1200, alt: 'A fire performer breathes a plume of flame into the dark.' },
  { src: '/masquerade/gallery/20241026_dsc_1201.jpg', w: 1600, h: 1067, alt: 'A fire breather sends a column of flame high above the lawn.' },
  { src: '/masquerade/gallery/20241026_dsc_1252.jpg', w: 800, h: 1200, alt: 'A fire performer exhales a wide burst of flame against the night.' },
  { src: '/masquerade/gallery/img_8142.jpg', w: 800, h: 1200, alt: 'An aerial silks artist suspended from a tripod rig above the crowd.' },
  { src: '/masquerade/gallery/20241026_dsc_1457.jpg', w: 1600, h: 1067, alt: 'A fire dancer spins lit fans in front of a watching crowd.' },
  { src: '/masquerade/gallery/img_8315.jpg', w: 1024, h: 683, alt: 'An aerialist performs in a lyra hoop above a mirrored stage.' },
  { src: '/masquerade/gallery/20241026_dsc_1531.jpg', w: 1600, h: 1067, alt: 'The band plays beside a lit backdrop of bicycle wheels.' },
  { src: '/masquerade/gallery/20241026_dsc_1549.jpg', w: 1600, h: 1067, alt: 'A singer and guitarist perform on the lawn stage late in the night.' },
  { src: '/masquerade/gallery/img_8505.jpg', w: 1024, h: 683, alt: 'A fire performer raises flaming torches beneath the tent as guests watch from their seats.' },
];

/**
 * Arrivals & Parking section. Copy is the organizer's, from her 2026-10-21
 * email. Pins follow the marked-up map she attached: OSM has no Stone Lodge,
 * so its pin is the building inside the drive loop west of the lake.
 */
export const arrivals = {
  paragraphs: [
    'Parking is available in the Senoia Branch Library lots: upper, next to library, and lower. Golf carts may enter from Howard Road and park on the side of Mary’s Parkway.',
    'Tickets are digital entry; you may share your name or QR code at the door.',
  ],
  // Senoia Branch Library, 148 Pylant St — the organizer asked for the map
  // to centre here.
  center: [33.29771, -84.56133],
  // The lodge is about 200 m west of the library; on a phone, zoom 17 would
  // push its pin off the edge.
  zoom: 17,
  zoomNarrow: 16,
  // `tooltip` is the side the always-on label sits, so pins this close don't
  // cover each other's labels.
  markers: [
    { id: 'lodge', label: 'Masquerade Here', kind: 'venue', at: [33.29876, -84.56352], tooltip: 'bottom' },
    { id: 'golf-carts', label: 'Golf Cart Parking', kind: 'golf', at: [33.29923, -84.56311], tooltip: 'top' },
    { id: 'upper-lot', label: 'Parking', kind: 'parking', at: [33.29858, -84.56152], tooltip: 'top' },
    { id: 'library-lot', label: 'Parking', kind: 'parking', at: [33.29789, -84.56108], tooltip: 'right' },
    { id: 'lower-lot', label: 'Parking', kind: 'parking', at: [33.29603, -84.56305], tooltip: 'bottom' },
  ],
};

export const faqs = [
  {
    q: 'Who can attend?',
    a: 'The Masquerade is an 18 and over evening. Photo ID is checked at the gate, and wristbands are issued for VIP guests and for anyone under 21.',
  },
  {
    q: 'Where do I park?',
    a: 'Parking is available in the Senoia Library lots at 148 Pylant Street, Senoia, GA 30276, including ADA parking.',
  },
  {
    q: 'Is the venue accessible?',
    a: 'ADA parking is available, and there is ADA access to the Stone Lodge restrooms.',
  },
  {
    q: 'What is the weather plan?',
    a: 'The Masquerade goes on rain or shine. The evening is held under tent, with the Stone Lodge open indoors for VIP guests.',
  },
  {
    q: 'What should I wear?',
    a: 'Black tie and evening wear, with masks and headpieces encouraged. Interpret Wonderland however you like — creative costumes are welcome but never required.',
  },
  {
    q: 'Can I bring my own food or drinks?',
    // The organizer's own wording, taken from the published preview.
    a: 'No :)',
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
  facebook: {
    handle: 'Follow on Facebook',
    // Supplied by the organizer. Not opened from here — verify before launch.
    url: 'https://www.facebook.com/profile.php?id=61594326304265',
  },
  instagram: {
    handle: 'Follow on Instagram',
    // Supplied by the organizer, minus the share-sheet tracking parameters.
    url: 'https://www.instagram.com/thehalloweenmasquerade/',
  },
  partnerInstagram: {
    handle: '@EnjoySenoia',
    url: 'https://www.instagram.com/enjoysenoia/', // CONFIRM: handle URL
  },
  // Not rendered — the organizer deleted the footer, which was its only home.
  ddaUrl: 'https://enjoysenoia.com',
};

export const seo = {
  // The page's home. Also used as the canonical on enjoysenoia.com/masquerade,
  // so search engines treat the two addresses as one page.
  url: 'https://thehalloweenmasquerade.com/',
  title: 'The 3rd Annual Halloween Masquerade: Down the Rabbit Hole | Senoia, GA',
  // Post-event wording; also the static description scripts/build-microsite-html.mjs
  // writes for link unfurlers.
  description:
    'Thank you for joining us at the Stone Lodge at Marimac Lake in Senoia, Georgia, on October 24, 2026. Find your Red Carpet and Photobooth photos, and thank the sponsors who made the night possible.',
  ogImage: 'https://thehalloweenmasquerade.com/masquerade/og-image.png', // 1200x630; scripts/build-og-images.mjs
};
