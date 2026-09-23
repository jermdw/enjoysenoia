# The Senoia Halloween micro-site

A single-page site for Halloween in downtown Senoia: the October calendar, the
home-and-business decorating contest, the Masquerade Ball, toddler trick or
treat, and the trick-or-treat map.

Built from the "Senoia Halloween Website" brief by Shauna Mooney
([doc](https://docs.google.com/document/d/1N1ccK2zQT5IKVjAUL62nsvjZiPWrd9LWkPlwvWsSv-g/edit)).

> **Live at <https://senoiahalloween.com>.** Structure, styling, form, map,
> Firestore rules, and deploy wiring are real, deployed, and verified. The copy
> is the organizer's own, transcribed from her slides; see
> [Content](#content) for the few open questions.

## Where things live

| Path | What it is |
| --- | --- |
| `src/halloween/data/halloweenDetails.js` | **Every fact on the site.** Calendar dates, copy, map centre, SEO. Edit here, not in components. |
| `src/halloween/halloween.css` | Scoped theme (`.hallo`), palette, fonts. Nothing leaks into the DDA site or the Masquerade. |
| `src/halloween/components/Art.jsx` | All artwork, as SVG: the icons, the page pattern, and the cream wavy frame every section sits in. |
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

## Content

The brief says *"use existing copy word-for-word where possible"*. The slides it
refers to are images pasted inside the brief document; the Drive text API
cannot read them, but exporting the doc as a zipped web page
(`download_file_content` with `exportMimeType: application/zip`) yields every
image as a JPEG. That is how the copy was transcribed.

### 9/22 edits

The organizer added a "9/22 Edits" section to the brief with a new set of five
slides and these notes, all applied:

- Colour scheme and style to match the new slides: purple, black, orange,
  yellow, cream; a patterned ground of ghosts, witch hats, candy corn, black
  cats, stars, bats and jack-o-lanterns; each section in a cream frame with a
  wavy black outline and a dashed inner line. Hexes were sampled from the
  slide JPEGs. The artwork is drawn as SVG in `Art.jsx`, not cropped from the
  slides, so it stays sharp and tiles cleanly.
- Title face stays Creepster (standing in for Jeepers). Subtitles and
  highlighted details use Oswald, the nearest free match for "Marquis Sans".
- Title is "Halloween in Senoia"; "Senoia, Georgia" and "2026" are gone from
  the page.
- The "Every date on the calendar…" line is removed.
- Calendar markers fill the whole day and carry a printed label.
- Toddler participating businesses are a run of names, like the slide, rather
  than button-like tiles.
- Trick-or-treating time is 5:30pm – 8:30pm.
- The "Every stop on the route" heading is removed. The list under the map
  stays, because it is the only keyboard-reachable form of the pins; it keeps
  an `aria-label` instead.

The new slides also changed some copy, now reflected on the site: the
Masquerade blurb ("Cocktails, magical entertainment, dinner, and dancing!"),
Senoia Bicycle added as a seventh toddler business, the toddler route line,
and the trick-or-treating blurb about the historic district and Willow Dell.

### Still open

- [ ] **Winners vs. every entry on the map.** The contest slide says
      *"Winners will be featured … on the official Trick or Treating map!"*;
      the written brief says every residential entry goes on the map. No code
      change is needed either way — an admin publishes pins one at a time.
- [ ] **"Recieve"** on the toddler slide is corrected to "receive" on the site.
- [ ] **Share image.** `seo.ogImage` is still empty; the title slide would do.
- [ ] **Title font.** Jeepers is a commercial font and is not web-licensed.
      To use the real thing, drop the `.woff2` in `src/halloween/fonts/`, add an
      `@font-face` rule to `halloween.css`, and repoint `--hallo-font-display`.
      Same for Marquis Sans and `--hallo-font-sub`.
- [ ] **Where the golf-cart boundary actually is.** The eligibility rule is
      quoted verbatim, but nothing enforces or shows it. A drawn boundary on the
      map would be a natural addition.

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

1. ~~**Create the Hosting site.**~~ **Done.** The `senoiahalloween` site exists
   in `enjoysenoia` and serves <https://senoiahalloween.web.app>. The name
   matches `.github/workflows/deploy.yml` and the `HALLOWEEN_HOST` regex in
   `src/App.jsx`.
2. ~~**The domain.**~~ **Live.** <https://senoiahalloween.com> serves the site
   over HTTPS. `HALLOWEEN_HOST` in `src/App.jsx` and `seo.url` in
   `halloweenDetails.js` already matched the name, so no code change was needed.

   DNS at Porkbun, for reference:

   | Type | Host | Value |
   | --- | --- | --- |
   | A | *(apex)* | `199.36.158.100` |
   | TXT | *(apex)* | `hosting-site=senoiahalloween` |
   | CNAME | `www` | `senoiahalloween.web.app` |

   `www.senoiahalloween.com` is registered in Firebase as a **redirect** to the
   apex rather than a second copy of the site. Its certificate is issued by
   Firebase once its checker sees the CNAME, which can lag the DNS by up to 24
   hours; until then `www` throws a certificate warning while the apex is fine.
   Re-check with **Verify** on the site's Domains page in the console.

   **Editing DNS at Porkbun — read this first.** Adding a record drops you into
   a bulk editor whose warning reads: *"By unchecking this option your current
   DNS records will be **deleted** and the records shown below will **replace**
   your existing records."* The guard is a checkbox, `Do not delete existing
   records`. If it is unchecked, submitting a single new record wipes the apex A
   and TXT and takes the site down. Confirm it is ticked, and that the staged
   table holds only the rows you meant to add, before submitting.
3. ~~**Firestore must exist.**~~ **Done.** The `(default)` database (nam5,
   Standard edition, free tier) was created in `enjoysenoia` on 2026-09-18, and
   these rules and indexes were deployed on 2026-09-22. Verified against
   production: a public read of `halloween_map_points` returns 200, and a public
   read of `halloween_signups` returns 403 PERMISSION_DENIED.

Local target mapping, if you deploy by hand rather than through Actions:

```bash
firebase target:apply hosting halloween senoiahalloween
cp .env.example .env.production    # fill from the command in that file
npm run build
firebase deploy --only hosting:halloween
```

`.env.production` matters: without it the build still succeeds, but the deployed
site carries an empty Firebase config and every read and write fails in the
visitor's browser. `vite build` does not catch this; only the CI check does.

**Check `firebase use` first.** The CLI remembers an active project per
directory and `.firebaserc` is gitignored, so a fresh clone or a new worktree can
silently default to a *different project*. This bit during setup — the worktree
defaulted to an unrelated project. Pass `--project enjoysenoia` explicitly.

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
