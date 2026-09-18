# The Masquerade micro-site

The 3rd Annual Masquerade: Down the Rabbit Hole — Saturday, October 24, 2026, at the
Stone Lodge at Marimac Lake, Senoia, GA.

Built from the organizer intake questionnaire completed by Shauna Mooney.

## Where things live

| Path | What it is |
| --- | --- |
| `src/masquerade/data/eventDetails.js` | **Every fact on the site.** Dates, tiers, menu, schedule, FAQ, contact. Edit here, not in components. |
| `src/masquerade/masquerade.css` | Scoped theme (`.masq`), palette, fonts, animations. Nothing leaks into the DDA site. |
| `src/masquerade/MasqueradePage.jsx` | Page shell and section order. |
| `src/masquerade/components/` | Hero, Invitation, Tickets, Schedule, Feast, Sponsors, Faq, Waitlist, nav, footer. |
| `public/masquerade/event-card.svg` | Placeholder title card used by the enjoysenoia.com event listing. |

Routing: `src/App.jsx` renders `/masquerade` **outside** the DDA `Layout`, so the Enjoy
Senoia navbar and footer never appear on it. All other routes sit inside a `DDALayout`
layout route and are unchanged.

## Before launch — needed from the organizer

- [ ] **Ticket Tailor box office URL.** Set `ticketing.url` in `eventDetails.js`. Until then every
      buy button reads "Tickets open soon" instead of linking nowhere.
- [ ] **Venue street address.** The intake gave `Stone Lodge at Marimac Lake, Senoia Library:
      148 Pylant Street`. 148 Pylant is treated as parking. Set `event.venue.addressLine`.
- [ ] **Confirm the date is 2026** (the intake doc says 2006) and that October 24 is the right Saturday.
- [ ] **Confirm the refund policy.** The intake answer was "No refunds no transfers?" — with a question mark.
- [ ] **Confirm After Party door time.** The tier heading said 8:30 PM, the inclusions and run of show say 8:00 PM. The site currently says 8:00 PM.
- [ ] **Brand fonts.** Rumble Brave and Zenaida are not web-licensed here. Drop `.woff2` files in
      `src/masquerade/fonts/`, add `@font-face` rules, and point `--masq-font-display` /
      `--masq-font-body` at them. Cinzel Decorative + Cormorant Garamond stand in until then.
- [ ] **Artwork.** Hero image, past-year photos, and a 1200×630 share image (`seo.ogImage`).
      Also replaces `public/masquerade/event-card.svg`.
- [ ] **Sponsor logos.** Add to the `sponsors` array as `{ name, tierId, logo, url }`; the tier
      grid renders logos automatically once the array is non-empty.
- [ ] **Costume contest details** — categories, prizes, judging (intake said TBD).
- [ ] **Instagram URLs** for @TheHalloweenMasquerade and @EnjoySenoia (guessed from the handles).
- [ ] **Analytics IDs** (Google Analytics / Meta Pixel) — not installed yet.
- [ ] **Legal wording** — photo release, alcohol disclaimer, anything the city or DDA requires.

## Selling states

Each tier in `eventDetails.js` carries its own `status`, because they don't sell alike:

| status | Button |
| --- | --- |
| `onSale` | Buys through Ticket Tailor |
| `atDoor` | Same, plus an "Also sold at the door" mark (current state of General Admission) |
| `waitlist` | Sends to the email capture section |
| `closed` | "Sales closed", not clickable |

Dinner and VIP close October 20 — flip those two to `closed` (or `waitlist`) that morning.

## Email capture

`Waitlist.jsx` writes to the same Firestore `newsletter_subscribers` collection the DDA
homepage uses, tagged `source: 'masquerade_2026'` so masquerade signups can be filtered
in or out of the main list.

## Hosting: two sites, one build

The Firebase project `enjoysenoia` has two Hosting sites, both serving the same `dist`
build. Firebase can't route by hostname within one site, so the micro-site gets its own:

| Target | Site | URL | Behavior |
| --- | --- | --- | --- |
| `main` | `enjoysenoia` | <https://enjoysenoia.web.app> | Full DDA site; `/masquerade` also works here |
| `masquerade` | `thehalloweenmasquerade` | <https://thehalloweenmasquerade.web.app> | `/` 302-redirects to `/masquerade` |

Only Vite's content-hashed output under `/assets/` is cached as `immutable`. Files from
`public/` (gallery photos, `event-card.svg`) keep stable URLs and get replaced, so they
cache for an hour and then revalidate.

The `/` redirect is a 302 on purpose. Browsers cache a 301 more or less permanently, which
would make it hard to change what the domain root serves later. If the two sites should
ever diverge, split the micro-site into its own Vite entry point first.

### Custom domain (thehalloweenmasquerade.com)

Registered at Namecheap (BasicDNS). To finish the hookup:

1. Add `thehalloweenmasquerade.com` as a custom domain on the **`thehalloweenmasquerade`**
   site, not `enjoysenoia`. Add `www.thehalloweenmasquerade.com` as a redirect to the apex.
2. In Namecheap Advanced DNS, add exactly the A and TXT records the console shows. Add TXT
   records alongside the existing SPF record rather than replacing it, and leave the MX
   records alone; they carry Namecheap email forwarding.

## Deploying

`.firebaserc` and `.env.production` are gitignored, and the target-to-site mapping lives
in `.firebaserc`, so a fresh clone needs all of this before a production build:

```bash
firebase use --add                 # pick `enjoysenoia`, alias it `default`
firebase target:apply hosting main enjoysenoia
firebase target:apply hosting masquerade thehalloweenmasquerade
cp .env.example .env.production    # fill from the command in that file
npm run build
firebase deploy --only hosting:masquerade   # or hosting:main; plain `hosting` deploys both
```

Check `firebase use` first. The CLI remembers an active project per directory, and
`target:apply` writes the mapping under whichever project is active, silently.

Stick to `--only hosting` or `--only hosting:<target>`. `firebase deploy` on its own would also push
`firestore.rules` and `storage.rules`; the hardened versions of those live in
PR #3 and are not on this branch yet, so deploying them from here would be a
step backwards.

Still outstanding before this is a real launch:

- **Firestore is not set up** in the project. The newsletter form on the DDA
  home page writes to `newsletter_subscribers` and will fail until a database
  exists and rules are deployed. The Masquerade page itself is static and does
  not touch Firestore.
- **Restrict the web API key** to HTTP referrers in the Google Cloud console.
- **The domain.** The `thehalloweenmasquerade` site and targets are in place; the
  custom domain and Namecheap DNS records still need to go live (see
  [Custom domain](#custom-domain-thehalloweenmasqueradecom) above).
