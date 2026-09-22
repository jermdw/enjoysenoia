# The Senoia Halloween micro-site

A single-page site for Halloween in downtown Senoia: the October calendar, the
home-and-business decorating contest, the Masquerade Ball, toddler trick or
treat, and the trick-or-treat map.

Built from the "Senoia Halloween Website" brief by Shauna Mooney
([doc](https://docs.google.com/document/d/1N1ccK2zQT5IKVjAUL62nsvjZiPWrd9LWkPlwvWsSv-g/edit)).

> **This is a scaffold, not a launch.** The structure, the styling, the form,
> the map, and the deploy wiring are real and working. Almost none of the
> *words* are the organizer's — see [Content](#content-the-big-one) below.

## Where things live

| Path | What it is |
| --- | --- |
| `src/halloween/data/halloweenDetails.js` | **Every fact on the site.** Calendar dates, copy, map centre, SEO. Edit here, not in components. |
| `src/halloween/halloween.css` | Scoped theme (`.hallo`), palette, fonts. Nothing leaks into the DDA site or the Masquerade. |
| `src/halloween/HalloweenPage.jsx` | Page shell and section order. |
| `src/halloween/components/` | SEO, nav, hero, calendar, contest + form, Masquerade teaser, toddler, trick-or-treating + map. |
| `src/services/halloweenService.js` | Firestore reads/writes and the CSV export. **Read the header comment before changing the collections.** |
| `src/pages/admin/HalloweenAdmin.jsx` | Admin tab: review sign-ups, export CSV, publish addresses to the map, manage closures and parking. |

Routing: `src/App.jsx` renders the page **outside** the DDA `Layout`, so the
Enjoy Senoia navbar and footer never appear. On its own domain it renders at
`/`; on enjoysenoia.com it is at `/halloween`. Same pattern as the Masquerade.

## The data model, and why it is two collections

Firestore rules are per-document — **there is no way to allow a public read of
only some fields.** A single collection holding name + address + email could
therefore never be public-readable without publishing every entrant's name and
email to anyone who opened the map.

| Collection | Public | Admin | Holds |
| --- | --- | --- | --- |
| `halloween_signups` | **create only** | read/write | name, address, email, category, status |
| `halloween_map_points` | **read only** | read/write | address, lat, lng, kind, label |

Nothing moves between them automatically. An admin reviews a sign-up and
publishes it, which copies **the address alone** across. That review step is
also the spam gate: a collection that were both public-write and public-read
would let anyone drop an arbitrary address onto a map of the town's
trick-or-treat route.

`lat`/`lng` may be null. An unplaced pin is stored and skipped by the map, which
is what lets the site run with no geocoding service at all — the admin pastes
coordinates from Google Maps when publishing.

The sign-up form tells entrants that residential addresses appear on a public
map. The brief does not include that disclosure; it is there because the site
publishes the data.

### Verifying the rules

The split above is only as good as `firestore.rules`, and neither `npm run lint`
nor `npm run build` reads that file. `scripts/firestore-rules.test.mjs` exercises
it against the Firestore emulator — 15 assertions, including that the public
cannot read a sign-up, cannot self-approve onto the map, and that a map point
cannot carry an email. Run it after touching the rules (needs Java):

```bash
npm i --no-save @firebase/rules-unit-testing@4.0.1
npx -y firebase-tools@latest emulators:exec --only firestore --project rules-test "node scripts/firestore-rules.test.mjs"
```

It is not in `package.json` or CI: the repo has no test runner, and the 4.0.1
pin is the last release peering `firebase ^11` (latest peers ^12 and npm refuses
the install). All 15 pass as committed.

### Indexes

`getSignups({ category })` pairs a `where` with an `orderBy`, which Firestore can
only serve from a composite index. It is declared in `firestore.indexes.json` and
must be deployed before that path is used. The no-argument call the admin tab
makes today needs no index.

## Content — the big one

The brief says *"use existing copy word-for-word where possible"* and repeatedly
refers to "the slides". **Those slides are images pasted inside the brief
document itself.** There is no separate deck in Drive (searched by owner, by
title, and across every shared presentation), and the images cannot be read out
of the doc through the Drive text API.

So: **every string in `halloweenDetails.js` marked `NEEDED` is placeholder text
written to be thrown away.** Nothing on this site is approved copy yet.

To finish the content, the fastest path is for the organizer to export the
slides — File → Download → PNG, or just send the original deck — after which
the calendar dates, section copy, and artwork can be filled in from them.

### Needed from the organizer

- [ ] **The slides**, as images or the original deck. Everything below comes from them.
- [ ] **October dates.** Only the Masquerade (Oct 24) is confirmed; every other
      calendar entry is a guess at what the slides show. Sign-up open/close,
      judging night, and both trick-or-treat times are unconfirmed.
- [ ] **Toddler trick or treat details** — date, time, route, participating
      merchants, age range. The brief names the section and says nothing more.
- [ ] **Decorating contest prizes and judging criteria** — not in the brief.
- [ ] **Sign-up deadline** — not in the brief.
- [ ] **Artwork.** The brief asks for classic 2D American Halloween imagery:
      ghosts, pumpkins, spiders, a haunted house, a graveyard, kids in costume.
      The hero is type on a gradient until these arrive. Also needs a 1200×630
      share image (`seo.ogImage`).
- [ ] **Title font.** The brief asks for something close to "Jeepers", which is
      a commercial font and is not web-licensed. Creepster stands in — same
      1950s spooky-comic register, free to serve. To use the real thing, drop the
      `.woff2` in `src/halloween/fonts/`, add an `@font-face` rule to
      `halloween.css`, and repoint `--hallo-font-display`.
- [ ] **The domain** (see below).
- [ ] **Where the golf-cart boundary actually is.** The eligibility rule is
      quoted verbatim from the brief, but nothing enforces or shows it. A drawn
      boundary on the map would be a natural addition.

## The Google Sheets requirement

The brief asks for sign-ups to land in a Google Sheet with columns for name,
address, and email.

A live Firestore → Sheets sync needs a Cloud Function and the Blaze plan; this
repo has neither. So the admin tab exports a CSV with exactly those columns,
which imports into Sheets in one step (**File → Import → Upload**). That
satisfies the requirement at zero infrastructure cost.

If the organizer wants it automatic later, the upgrade is a Firestore `onCreate`
trigger appending to a sheet through the Sheets API — a Blaze project, a service
account, and the sheet shared with it.

The export quotes every field and neutralises leading `=`, `+`, `-`, and `@`, so
a sign-up cannot smuggle a formula into the organizer's spreadsheet.

## Hosting: three sites, one build

The Firebase project `enjoysenoia` serves all three sites from the same `dist`
build; the app picks the page from the hostname.

| Target | Site | Behavior |
| --- | --- | --- |
| `main` | `enjoysenoia` | Full DDA site; `/halloween` also works here |
| `masquerade` | `thehalloweenmasquerade` | Masquerade at `/` |
| `halloween` | `senoiahalloween` | This page at `/`; `/halloween` 301-redirects to `/` |

### Before this deploys

1. **Create the Hosting site.** In the Firebase console, add a site to the
   `enjoysenoia` project. `senoiahalloween` is the placeholder name used in
   `.github/workflows/deploy.yml` and in the `HALLOWEEN_HOST` regex in
   `src/App.jsx` — if you name it something else, change both.
2. **The domain.** Being registered at Porkbun; the name is not chosen yet.
   Once it is, update **three** places: the `HALLOWEEN_HOST` regex in
   `src/App.jsx`, `seo.url` in `halloweenDetails.js`, and the Hosting custom
   domain in the console. In Porkbun's DNS, add exactly the A and TXT records
   the Firebase console shows, and point `www` at the apex.
3. **Firestore must exist.** It still is not provisioned in this project — the
   DDA newsletter form has the same problem. Until a database is created and
   `firestore.rules` is deployed, every sign-up fails and the admin tab shows an
   error. The form never reports success for an entry that was not stored.

Local target mapping, if you deploy by hand rather than through Actions:

```bash
firebase target:apply hosting halloween senoiahalloween
npm run build
firebase deploy --only hosting:halloween
```

Stick to `--only hosting:<target>`. A bare `firebase deploy` would also push
`firestore.rules` and `storage.rules` — check what is in them first.

CI deploys all three targets from `.github/workflows/deploy.yml` on push to
`main`, and opens a preview channel per target on every pull request. **Two
places list the targets**: the `matrix.target` list and the `.firebaserc`
heredoc in the "Map hosting targets" step. Both already include `halloween`.

Because the page is also served at `/halloween` on the main site, it can be
reviewed on a PR preview channel before any DNS exists.

## Map

Leaflet with OpenStreetMap tiles — no API key, no billing account, nothing to
provision. Pins are `CircleMarker`s rather than Leaflet's default `Marker`,
whose icon points at image files bundlers rewrite (the classic "markers don't
render in production" bug); a vector circle needs no assets.

Leaflet is a heavy dependency for a page whose first screen is type, so
`TrickOrTreatMap` is behind `React.lazy` and gets its own `vendor-map` chunk.

The pins are also listed as text underneath the map — the map itself is not
meaningfully reachable by keyboard.

If traffic ever gets heavy, check OpenStreetMap's tile usage policy; it is a
donated service, not a CDN.
