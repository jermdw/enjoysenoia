/**
 * Content for the Christmas in Senoia micro-site (christmas.enjoysenoia.com).
 *
 * BMW of South Atlanta presents the season: the Christkindl Market, the Light
 * Up Senoia parade and the Candlelight Tour of Homes, as on the sponsor's
 * flyer. The two DDA events are read from the event listings (`slug`), so a
 * date, description or contact staff change in /admin shows up here too; `when`
 * and `blurb` below are only what the card says when a listing has nothing.
 *
 * Plain data, no JSX or imports: scripts/build-microsite-html.mjs imports
 * `seo` from this file under Node.
 */

export const sponsor = {
  name: 'BMW of South Atlanta',
};

export const events = [
  {
    key: 'christkindl',
    title: 'Christkindl Market',
    // From the market's own site (2026-10-14). The sponsor flyer says 11/26 to
    // 12/25; the market opens Black Friday and closes Christmas Eve.
    when: 'November 27 – December 24',
    blurb:
      'The Atlanta Christkindl Market brings a German-style holiday market to downtown Senoia, at 158 Seavy Street. Free admission.',
    url: 'https://www.christkindlmarket.org/senoia',
    linkLabel: 'Visit the Christkindl Market',
    icon: 'market',
  },
  {
    key: 'parade',
    slug: 'light-up-senoia-parade',
    title: 'Light Up Senoia Christmas Parade',
    when: 'Saturday, December 5',
    icon: 'parade',
  },
  {
    key: 'tour',
    slug: '2026-senoia-candlelight-tour-of-homes',
    title: 'Candlelight Tour of Homes',
    when: 'Sunday, December 13',
    blurb: 'Eight stops in downtown Senoia, 3 to 8 PM. Tickets are $30 and sold online only.',
    icon: 'home',
  },
];

/**
 * The Tour of Homes chauffeured BMW silent auction (src/christmas/AuctionPage.jsx).
 * Agreed with Stephanie Reeder (DDA) 2026-10-20 and 2026-11-11: three cars,
 * three separate auctions, four riders per car, $200 opening bid, open to
 * ticket holders only, all proceeds to the DDA. The cars themselves (title,
 * photo, opening bid, close time, open switch) are edited in /admin, Auction tab.
 *
 * The "$200" and "Sunday, December 6 at 8 PM" below are plain text, and so is
 * the auction paragraph in the Tour of Homes listing (data/event_overrides.json).
 * Change the opening bid or close time in admin, and change them here too.
 */
export const auction = {
  eventLine: 'Candlelight Tour of Homes · Sunday, December 13',
  tagline: 'A silent auction for a chauffeured Tour of Homes for up to four. Three cars, three auctions.',
  reception:
    "Your evening begins at the Mess Hall on Main Street with champagne and hors d'oeuvres for your party.",
  ride: "Then your chauffeur drives you home to home on this year's Candlelight Tour of Homes in a BMW from BMW of South Atlanta. Each car seats four.",
  proceeds: 'Every dollar raised goes to the Senoia Downtown Development Authority.',
  ticketsUrl: 'https://buytickets.at/senoiadda/2477581',
  steps: [
    {
      title: '1. Get your tickets',
      body: 'The auction is open to Tour of Homes ticket holders, and everyone riding in the car needs a ticket.',
    },
    {
      title: '2. Get your bidding link',
      body: 'Enter the email you bought tickets with. We check it with our ticket system and email you a link to bid.',
    },
    {
      title: '3. Bid',
      body: "Each car is its own auction, starting at $200. We'll email you if someone outbids you.",
    },
    {
      title: '4. Winners hear from us',
      body: 'Bidding closes Sunday, December 6 at 8 PM. We email each winner to arrange payment and the evening.',
    },
  ],
  terms: [
    'A bid is a promise to pay that amount if you win. Winners pay the Senoia DDA after bidding closes; we email instructions.',
    'Each car carries the winner and up to three guests. Every rider needs a Tour of Homes ticket of their own.',
    "Champagne is served to guests 21 and older. We'll send winners the start time and details by email.",
    "Bidding closes at the time shown on each car. If a winner can't complete payment, we may offer the car to the next-highest bidder.",
  ],
};

/**
 * Credits for the placeholder car photos in public/christmas/auction/, from
 * Wikimedia Commons under CC BY-SA 4.0, which requires naming the author and
 * the license. Keyed by the path a lot's `image` holds; a car whose photo
 * staff replace simply shows no credit line.
 */
const CC_BY_SA_4 = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' };
export const placeholderPhotos = {
  '/christmas/auction/x7.jpg': {
    author: 'Damian B Oh',
    source: 'https://commons.wikimedia.org/wiki/File:BMW_G07_LCI_X7_xDrive40i_M_Sport_Black_Sapphire_Metallic_(11).jpg',
    ...CC_BY_SA_4,
  },
  '/christmas/auction/x5.jpg': {
    author: 'Damian B Oh',
    source: 'https://commons.wikimedia.org/wiki/File:BMW_G05_LCI_X5_M_Sport_Manhattan_Metallic.jpg',
    ...CC_BY_SA_4,
  },
  '/christmas/auction/ix.jpg': {
    author: 'Alexander Migl',
    source: 'https://commons.wikimedia.org/wiki/File:2025_BMW_iX_DSC_2687.jpg',
    ...CC_BY_SA_4,
  },
};

// Event detail pages live on the DDA site. Absolute, because on this host every
// path folds back to "/" (App.jsx).
export const DDA_ORIGIN = 'https://www.enjoysenoia.com';

export const seo = {
  title: 'Christmas in Senoia',
  description:
    'Christmas in Senoia, presented by BMW of South Atlanta: the Christkindl Market, the Light Up Senoia Christmas Parade, and the Candlelight Tour of Homes in downtown Senoia, Georgia.',
  url: 'https://christmas.enjoysenoia.com/',
  ogImage: 'https://christmas.enjoysenoia.com/christmas/og-image.png', // 1200x630; scripts/build-og-images.mjs
};
