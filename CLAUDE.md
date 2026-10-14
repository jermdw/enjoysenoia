# enjoysenoia

The Senoia, GA downtown site (Downtown Development Authority) plus three event micro-sites,
all built from this one React + Vite SPA and served from Firebase Hosting. Staff manage
content through an admin portal at `/admin`. Merging to `main` deploys to production.

## Commands

```bash
npm run dev           # vite on :3000
npm run lint          # oxlint
npm run build         # sitemap, vite build, then the micro-site HTML copies
npm run test:sitemap  # node --test, no dependencies
npm run test:rules    # Firestore + Storage rules against the emulators; needs Java 21+
```

CI (`.github/workflows/ci.yml`) runs `verify` (lint, sitemap test, offline build) and
`rules` on every PR; both are required checks on `main`. `deploy.yml` builds and deploys:
PRs get a preview channel on each site, `main` goes live, and a daily 09:17 UTC run
rebuilds so the generated sitemap picks up staff edits.

## One build, four sites

| Hosting target | Site | Serves |
|---|---|---|
| `main` | `enjoysenoia` (www.enjoysenoia.com) | `dist/` |
| `masquerade` | `thehalloweenmasquerade` | `dist-masquerade/` |
| `halloween` | `senoiahalloween` | `dist-halloween/` |
| `christmas` | `senoiachristmas` (christmas.enjoysenoia.com) | `dist-christmas/` |

- The SPA picks the micro-site from `window.location.hostname` in `src/App.jsx`
  (`MASQUERADE_HOST`, `HALLOWEEN_HOST`, `CHRISTMAS_HOST`). Changing a domain means
  changing that regex too.
- New event micro-sites go on a subdomain of enjoysenoia.com (like
  christmas.enjoysenoia.com), not a new registered domain. Each still needs its own
  Hosting site, because the static head below is per site.
- The micro-site targets serve copies of `dist/` whose `index.html` has a static head
  (title, Open Graph) written by `scripts/build-microsite-html.mjs`, so link unfurlers
  that don't run JS see the right title.
- `.firebaserc` is gitignored; deploy.yml writes the target-to-site mapping at run time.

## Firebase project

- Always pass `--project enjoysenoia` to the Firebase CLI. The default alias on this
  machine resolves to `sahs-archives`, which is a different project.
- The Firebase MCP's active project is also `sahs-archives`. Don't use its Auth or
  Firestore tools for this repo; use the CLI or REST with
  `x-goog-user-project: enjoysenoia`.
- Web config is `VITE_FIREBASE_*` (see `.env.example`). It is public by design; the rules
  are what protect data. CI sets them as repo *variables*, not secrets.
- Deploys need the `FIREBASE_SERVICE_ACCOUNT` secret, which Dependabot and fork PRs
  don't get, so they build but don't preview.

## Content model

- Events and businesses are generated from the Webflow CMS by
  `scripts/webflow_transform.py` into `data/site/*.json`. Regenerate; don't hand-edit.
  Typo fixes to Webflow text go in `BUSINESS_TEXT_FIXES` in that script.
- Staff edits live in Firestore `events/{slug}` and `businesses/{slug}` and are merged
  over the built-in data at runtime (`src/services/dataService.js`): matching slug is a
  patch, `hidden: true` removes, an unmatched slug adds. The site must render with no
  Firestore at all.
- News is different: Firestore is the source of truth (`news`, with a
  `status`/`publishedAt` index). `data/site/news.json` is only seed input.
- Rich text from Firestore is rendered through `RichText` and DOMPurify. Keep it that way.
- Images that migrated off Webflow are plain `<img>` URLs to Storage `?alt=media`
  (`src/utils/webflowAsset.js`).
- `scripts/generate-sitemap.mjs` reads public Firestore at build time and falls back to
  built-in data; `SITEMAP_OFFLINE=1` skips Firestore. Redirects on the `main` target are
  excluded from the sitemap.

## Admin access (three places, keep in step)

An admin is an account with the `admin` custom claim, or an email on the allowlist. The
allowlist is duplicated in `src/services/adminAccess.js`, `firestore.rules` and
`storage.rules`. The rules are the enforcement point; the JS only decides what renders.
Prefer the claim for new people.

## Rules and tests

`firestore.rules` and `storage.rules` are read by neither lint nor build; only
`npm run test:rules` exercises them. Change a rule, add or update a case in
`scripts/firestore-rules.test.mjs` or `scripts/storage-rules.test.mjs`.
`@firebase/rules-unit-testing` is pinned at 4.0.1 because 5.x peers firebase ^12 and this
repo is on ^11. Move them together.

## App Check

Set up with reCAPTCHA Enterprise but **monitoring only; enforcement is deliberately
off** (decision 2026-10-04). Never enforce it on Storage: images are bare `<img>` URLs
that can't carry a token. Before enforcing Firestore, re-read the verified share, and
remember the Halloween sheet sync (`integrations/halloween-sheet-sync`, reads every 5
minutes) sends no token.

## Gotchas

- **DNS is at GoDaddy.** enjoysenoia.com moved off Webflow on 2026-10-12. Claude can't
  edit DNS here; changes are made by hand. Setting up a domain on Firebase via "Quick
  setup" and then switching DNS causes an outage window; use the "Advanced" setup
  (TXT `hosting-site`, then the A record last).
- PR preview channels share the **live** Firestore database. Test writes with the
  emulators (`VITE_*_EMULATOR_HOST` in `.env.local`, `scripts/emulator_admin.py`).
- A missing `VITE_FIREBASE_*` value doesn't fail the build. It fails in the visitor's
  browser, so deploy.yml checks for it explicitly.
- Branch protection blocks direct pushes to `main`. Every change goes through a PR.

## Not turned on yet

`claude-review.yml` and `claude.yml` exist but are gated by the repo variable
`CLAUDE_REVIEW_ENABLED` (unset). They are waiting on an Anthropic workload-identity
federation rule that authenticates this repo; the rule's subject is
`repo:jermdw@13936004/enjoysenoia@1344058602:<context>`. Set the variable to `true` once
a run gets past the token exchange.
