#!/usr/bin/env python3
"""
Pull the Enjoy Senoia Webflow site (CMS collections + asset manifest) to disk.

Writes everything under data/webflow/ and never touches the existing
data/*.json produced by scrape_enjoysenoia.py, so the two can be compared
side by side during the migration.

Usage:
    python3 scripts/webflow_pull.py                     # collections + asset manifest
    python3 scripts/webflow_pull.py --download-assets   # also fetch asset bytes
    python3 scripts/webflow_pull.py --collections news events
    python3 scripts/webflow_pull.py --live-only         # published items only

Auth: WEBFLOW_API_KEY, from the environment or a .env file (cwd, then the
main worktree root). The token is never printed.
"""

import argparse
import html
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API_ROOT = "https://api.webflow.com/v2"
PAGE_LIMIT = 100          # Webflow's per-request maximum
API_MIN_INTERVAL = 1.05   # ~57 req/min, just under the 60/min limit
CDN_HOST = "website-files.com"
# URLs are embedded in rich-text HTML, so match them inside surrounding markup.
# Parentheses are allowed because Webflow filenames routinely contain them
# (e.g. "...(1200 x 628 px) (8).jpg"); trailing unbalanced ones are trimmed below.
CDN_URL_RE = re.compile(r'https?://[^\s"\'<>\\]*website-files\.com/[^\s"\'<>\\]*')

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "data" / "webflow"
COLLECTIONS_DIR = OUT_DIR / "collections"


# --------------------------------------------------------------------------
# token loading
# --------------------------------------------------------------------------

def _parse_env_file(path):
    """Minimal .env reader: KEY=value, ignoring comments and `export` prefixes."""
    values = {}
    try:
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            if key.startswith("export "):
                key = key[len("export "):].strip()
            values[key] = val.strip().strip('"').strip("'")
    except OSError:
        pass
    return values


def _main_worktree_root():
    """The primary checkout, which is where .env lives when we run in a worktree."""
    try:
        common = subprocess.run(
            ["git", "rev-parse", "--git-common-dir"],
            cwd=REPO_ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip()
        return Path(common).resolve().parent
    except (subprocess.CalledProcessError, OSError):
        return None


def load_token():
    token = os.environ.get("WEBFLOW_API_KEY")
    if token:
        return token

    candidates = [REPO_ROOT / ".env", Path.cwd() / ".env"]
    root = _main_worktree_root()
    if root:
        candidates.append(root / ".env")

    seen = set()
    for path in candidates:
        if path in seen or not path.is_file():
            continue
        seen.add(path)
        token = _parse_env_file(path).get("WEBFLOW_API_KEY")
        if token:
            print(f"  token loaded from {path}")
            return token

    sys.exit(
        "WEBFLOW_API_KEY not found.\n"
        "Set it in the environment or add it to a .env file at the repo root."
    )


# --------------------------------------------------------------------------
# API client
# --------------------------------------------------------------------------

class Webflow:
    """Rate-limited Webflow v2 client. Throttles api.webflow.com only."""

    def __init__(self, token):
        self._token = token
        self._last_call = 0.0
        self.calls = 0

    def get(self, path, params=None):
        url = f"{API_ROOT}/{path.lstrip('/')}"
        if params:
            url += "?" + urllib.parse.urlencode(params)

        for attempt in range(5):
            wait = API_MIN_INTERVAL - (time.monotonic() - self._last_call)
            if wait > 0:
                time.sleep(wait)

            req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {self._token}",
                "accept": "application/json",
            })
            self._last_call = time.monotonic()
            self.calls += 1
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    return json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    delay = int(e.headers.get("Retry-After") or 2 ** attempt)
                    print(f"    rate limited, waiting {delay}s")
                    time.sleep(delay)
                    continue
                if e.code in (500, 502, 503, 504) and attempt < 4:
                    time.sleep(2 ** attempt)
                    continue
                # Surface the status and path but never the Authorization header.
                raise SystemExit(f"Webflow API {e.code} on /{path.lstrip('/')}: {e.reason}")
            except urllib.error.URLError as e:
                if attempt < 4:
                    time.sleep(2 ** attempt)
                    continue
                raise SystemExit(f"Network error on /{path.lstrip('/')}: {e.reason}")

        raise SystemExit(f"Gave up on /{path.lstrip('/')} after repeated rate limiting.")

    def paginate(self, path, key, params=None):
        """Walk offset/limit pagination and return every record under `key`."""
        records, offset = [], 0
        while True:
            page = self.get(path, {**(params or {}), "limit": PAGE_LIMIT, "offset": offset})
            batch = page.get(key, [])
            records.extend(batch)
            total = page.get("pagination", {}).get("total", len(records))
            offset += PAGE_LIMIT
            if offset >= total or not batch:
                return records, total


# --------------------------------------------------------------------------
# pulling
# --------------------------------------------------------------------------

def pull_collections(wf, site_id, only=None, live_only=False):
    listing = wf.get(f"sites/{site_id}/collections").get("collections", [])
    if only:
        wanted = {s.lower() for s in only}
        listing = [c for c in listing if c["slug"].lower() in wanted
                   or c["displayName"].lower() in wanted]
        if not listing:
            sys.exit(f"No collections matched: {', '.join(only)}")

    results = []
    for meta in listing:
        # The collection detail carries `fields` with types - that is what tells
        # RichText apart from PlainText and identifies Reference/MultiImage fields.
        schema = wf.get(f"collections/{meta['id']}")
        endpoint = f"collections/{meta['id']}/items"
        if live_only:
            endpoint += "/live"
        items, total = wf.paginate(endpoint, "items")

        drafts = sum(1 for i in items if i.get("isDraft"))
        archived = sum(1 for i in items if i.get("isArchived"))

        # isDraft means "has unpublished edits", which is NOT the same as "not on
        # the site" - an item edited after publishing is flagged draft while its
        # last published version stays live. Only /items/live is authoritative
        # about what visitors actually see, so ask it rather than inferring.
        if live_only:
            live = total
        else:
            live = wf.get(f"collections/{meta['id']}/items/live",
                          {"limit": 1}).get("pagination", {}).get("total", 0)

        record = {
            "collection": schema,
            "counts": {"total": total, "live": live,
                       "draft": drafts, "archived": archived},
            "items": items,
        }
        COLLECTIONS_DIR.mkdir(parents=True, exist_ok=True)
        (COLLECTIONS_DIR / f"{meta['slug']}.json").write_text(
            json.dumps(record, indent=2, ensure_ascii=False)
        )
        print(f"  {meta['displayName']:<28} {total:>4} total, {live:>4} live "
              f"(draft {drafts}, archived {archived})")
        results.append(record)
    return results


def build_item_index(collections):
    """itemId -> {collection, slug, name}, so Reference fields resolve offline."""
    index = {}
    for rec in collections:
        cslug = rec["collection"]["slug"]
        for item in rec["items"]:
            fd = item.get("fieldData", {})
            index[item["id"]] = {
                "collection": cslug,
                "slug": fd.get("slug"),
                "name": fd.get("name"),
            }
    return index


def collect_referenced_urls(collections):
    """
    Every Webflow CDN URL appearing anywhere in item field data.

    Rich text fields hold HTML, so a field value is not itself a URL - the URLs
    have to be pulled out of the markup, with entities decoded first so that
    `&amp;` in a query string does not truncate the match.
    """
    urls = set()

    def trim(url):
        # A ')' that closes nothing belongs to the surrounding prose, not the URL.
        while url.endswith(")") and url.count(")") > url.count("("):
            url = url[:-1]
        return url.rstrip(".,;")

    def walk(node):
        if isinstance(node, dict):
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)
        elif isinstance(node, str) and CDN_HOST in node:
            urls.update(trim(u) for u in CDN_URL_RE.findall(html.unescape(node)))

    for rec in collections:
        for item in rec["items"]:
            walk(item.get("fieldData", {}))
    return urls


def cms_local_name(url):
    """Webflow CDN paths already end in <fileid>_<name.ext>, which is unique."""
    seg = urllib.parse.unquote(url.split("?")[0].rstrip("/").split("/")[-1])
    clean = "".join(c if c.isalnum() or c in "._- " else "_" for c in seg).strip()
    return clean.replace(" ", "_") or "asset"


def build_download_plan(manifest, referenced):
    """
    Union of the asset manager and everything the CMS actually references.

    These are two different buckets - the Assets API lists the modern asset
    manager (s3.amazonaws.com/webflow-prod-assets/...), while CMS image fields
    point at cdn.prod.website-files.com/<legacy-id>/... Pulling only one of
    them silently loses the other.
    """
    # Sorted so the committed plan produces stable diffs across runs;
    # `referenced` is a set and would otherwise reorder every time.
    plan = {}
    for url, meta in sorted(manifest.items()):
        plan[url] = {"localPath": meta["localPath"], "size": meta["size"],
                     "source": "asset-manager"}
    for url in sorted(referenced):
        if url in plan:
            continue
        plan[url] = {"localPath": f"public/assets/webflow/cms/{cms_local_name(url)}",
                     "size": 0, "source": "cms-field"}
    return plan


def pull_assets(wf, site_id):
    assets, total = wf.paginate(f"sites/{site_id}/assets", "assets")
    manifest = {}
    for a in assets:
        url = a.get("hostedUrl")
        if not url:
            continue
        # Keyed by hostedUrl so references can be rewritten to local paths later.
        manifest[url] = {
            "id": a.get("id"),
            "displayName": a.get("displayName"),
            "originalFileName": a.get("originalFileName"),
            "contentType": a.get("contentType"),
            "size": a.get("size") or 0,
            "altText": a.get("altText"),
            "localPath": f"public/assets/webflow/{local_name(a)}",
        }
    print(f"  {total} assets in the asset manager")
    return manifest


def local_name(asset):
    """<asset-id>_<displayName> - readable, and collision-free across folders."""
    clean = (asset.get("displayName") or asset.get("originalFileName") or "asset")
    clean = "".join(c if c.isalnum() or c in "._- " else "_" for c in clean).strip()
    return f"{asset.get('id')}_{clean}".replace(" ", "_")


def download_assets(plan):
    """Fetch bytes from the CDN. Not rate limited - this is not the API."""
    fetched = skipped = failed = 0

    for url, meta in plan.items():
        dest = REPO_ROOT / meta["localPath"]
        # Asset-manager entries carry a size to verify against; CMS-field URLs
        # do not, so for those existence alone is the resume signal.
        if dest.exists() and (not meta["size"] or dest.stat().st_size == meta["size"]):
            skipped += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "enjoysenoia-migration/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                dest.write_bytes(resp.read())
            fetched += 1
        except (urllib.error.URLError, OSError) as e:
            print(f"    FAILED {meta['localPath']}: {e}")
            failed += 1

    print(f"  downloaded {fetched}, already present {skipped}, failed {failed}")
    return {"downloaded": fetched, "skipped": skipped, "failed": failed}


def human(num_bytes):
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Pull Webflow CMS content and assets.")
    ap.add_argument("--collections", nargs="+", metavar="SLUG",
                    help="only these collections (slug or display name)")
    ap.add_argument("--live-only", action="store_true",
                    help="published items only (skips drafts and archived)")
    ap.add_argument("--skip-assets", action="store_true", help="skip the asset manifest")
    ap.add_argument("--download-assets", action="store_true",
                    help="also download asset bytes to public/assets/webflow/")
    args = ap.parse_args()

    token = load_token()
    wf = Webflow(token)

    sites = wf.get("sites").get("sites", [])
    if not sites:
        sys.exit("Token is valid but no sites are accessible.")
    site = sites[0]
    print(f"\nSite: {site['displayName']} ({site['id']})")
    print(f"Last published: {site.get('lastPublished') or 'n/a'}\n")

    print("Collections")
    collections = pull_collections(wf, site["id"], args.collections, args.live_only)

    # A scoped run only sees part of the site, so it must not overwrite the
    # whole-site artifacts - item_index.json is what resolves Reference fields.
    suffix = ".partial" if args.collections else ""
    if suffix:
        print("\n  (scoped run: writing *.partial.json, leaving full-site files alone)")

    index = build_item_index(collections)
    (OUT_DIR / f"item_index{suffix}.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False)
    )

    report = {
        "site": {"id": site["id"], "name": site["displayName"]},
        "pulledAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "liveOnly": args.live_only,
        "collections": {
            r["collection"]["slug"]: r["counts"] for r in collections
        },
    }

    if not args.skip_assets:
        print("\nAssets")
        manifest = pull_assets(wf, site["id"])
        (OUT_DIR / f"assets{suffix}.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))

        total_bytes = sum(m["size"] for m in manifest.values())
        print(f"  total size {human(total_bytes)}")

        # The asset manager and the CMS image fields are separate buckets, so
        # report them separately rather than as one reconciled set.
        referenced = collect_referenced_urls(collections)
        plan = build_download_plan(manifest, referenced)
        (OUT_DIR / f"download_plan{suffix}.json").write_text(
            json.dumps(plan, indent=2, ensure_ascii=False)
        )

        cms_only = [u for u, m in plan.items() if m["source"] == "cms-field"]
        report["assets"] = {
            "assetManagerCount": len(manifest),
            "assetManagerBytes": total_bytes,
            "cmsReferencedCount": len(referenced),
            "cmsOnlyCount": len(cms_only),
            "downloadPlanCount": len(plan),
        }
        print(f"  referenced by CMS fields:  {len(referenced)}")
        print(f"  CMS-only (not in manager): {len(cms_only)}")
        print(f"  total files to download:   {len(plan)}")

        if args.download_assets:
            print("\nDownloading")
            report["download"] = download_assets(plan)
        else:
            print(f"\n  (manifest only - pass --download-assets to fetch {len(plan)} files)")

    (OUT_DIR / f"report{suffix}.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"\nWrote {OUT_DIR.relative_to(REPO_ROOT)}/  ({wf.calls} API calls)\n")


if __name__ == "__main__":
    main()
