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
    blurb: 'Details and tickets coming soon.',
    icon: 'home',
  },
];

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
