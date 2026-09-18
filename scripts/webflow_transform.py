#!/usr/bin/env python3
"""
Transform the raw Webflow pull (data/webflow/) into the records the app reads
(data/site/).

Every field the pages already use keeps its existing name and format, so
swapping dataService.js onto this output needs no page changes. Richer fields
(rich-text bodies, hours, address parts, galleries) are added alongside for the
pages to adopt later.

Only items that are live on the Webflow site today are emitted; test items,
unpublished drafts and archived items are left out. The raw pull still has
everything.

Usage:
    python3 scripts/webflow_transform.py
    python3 scripts/webflow_transform.py --asset-base https://storage.example/webflow

--asset-base is the public URL prefix that replaces /assets/webflow, for when
the downloaded files move to Firebase Storage or another host.
"""

import argparse
import html
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "webflow"
OUT_DIR = REPO_ROOT / "data" / "site"
# Hand-assigned directory categories, keyed by business slug. These are the
# labels BusinessesPage filters on, and they are finer than Webflow's own
# taxonomy (which has no "Stay & Tours" or "Civic & Historic").
CATEGORY_FILE = REPO_ROOT / "data" / "business_categories.json"
UNCATEGORIZED = "Downtown Business"
# Only for businesses added in Webflow after the hand-assigned list was made.
# Entertainment maps to nothing on purpose: it spans tours, inns and venues,
# and a wrong heading is worse than none.
WEBFLOW_CATEGORY_FALLBACK = {
    "Food/Drink": "Dining & Drinks",
    "Retail": "Shopping & Retail",
    "Services": "Services & Salons",
    "Health/Beauty": "Health & Medical",
    "Churches": "Civic & Historic",
}

LOCAL_TZ = ZoneInfo("America/New_York")
DEFAULT_ASSET_BASE = "/assets/webflow"

CDN_URL_RE = re.compile(
    r'https?://(?:[a-z0-9.-]*website-files\.com|uploads-ssl\.webflow\.com)/[^\s"\'<>\\]*'
)

# Event rich-text sections worth carrying over, in page order. The
# *-embed-code fields are third-party ticketing/registration scripts and are
# deliberately not included - they should not be injected as HTML.
EVENT_SECTIONS = [
    "logistics-info",
    "band-or-entertainment-info",
    "maps-and-other-info",
    "features-and-highlights-section",
    "features-and-highlights-closing",
    "features-and-highlights-closing-center-justified",
    "vendor-information",
    "volunteer-section",
    "volunteer-information",
    "sponsor-section-intro",
    "presenting-sponsor-info",
    "participant-ticket-notice",
]


# --------------------------------------------------------------------------
# loading
# --------------------------------------------------------------------------

def load_collection(slug):
    path = RAW_DIR / "collections" / f"{slug}.json"
    if not path.is_file():
        sys.exit(f"Missing {path.relative_to(REPO_ROOT)} - run scripts/webflow_pull.py first.")
    return json.loads(path.read_text())


def is_live(item):
    """
    Visible on the published site. A draft flag alone does not mean unpublished:
    an item edited after publishing is flagged draft while its last published
    version stays live, which is what lastPublished records. This rule matches
    the API's /items/live counts exactly for every collection.
    """
    if item.get("isArchived"):
        return False
    return not item.get("isDraft") or bool(item.get("lastPublished"))


def option_names(collection):
    """Option fields store an opaque option id; map it back to the label."""
    names = {}
    for field in collection["collection"]["fields"]:
        for opt in (field.get("validations") or {}).get("options") or []:
            names[opt["id"]] = opt["name"]
    return names


# --------------------------------------------------------------------------
# assets and rich text
# --------------------------------------------------------------------------

class AssetResolver:
    """Rewrites Webflow CDN URLs to where the downloaded copy is served from."""

    def __init__(self, asset_base):
        plan = json.loads((RAW_DIR / "download_plan.json").read_text())
        base = asset_base.rstrip("/")
        # localPath is public/assets/webflow/...; Vite serves public/ at the root.
        self._map = {
            url: base + meta["localPath"][len("public/assets/webflow"):]
            for url, meta in plan.items()
        }
        self.unresolved = set()

    def url(self, value):
        if not value:
            return None
        key = html.unescape(value)
        if key in self._map:
            return self._map[key]
        if CDN_URL_RE.fullmatch(key):
            self.unresolved.add(key)
        return value

    def image(self, field):
        """Image/File field -> URL string (the shape the pages already use)."""
        if not field:
            return None
        return self.url(field.get("url"))

    def images(self, field):
        """MultiImage field -> [{url, alt}]."""
        return [
            {"url": self.url(img.get("url")), "alt": img.get("alt") or ""}
            for img in (field or [])
            if img.get("url")
        ]

    def rewrite_html(self, markup):
        return CDN_URL_RE.sub(lambda m: self.url(m.group(0)), markup)


def clean_html(markup, assets):
    """Strip Webflow editor residue and point embedded images at local copies."""
    if not markup:
        return None
    markup = markup.replace(' id=""', "")
    # Webflow pads spacing with paragraphs holding only a zero-width joiner.
    markup = re.sub(r"<p>(?:‍|&zwj;|\s|&nbsp;)*</p>", "", markup)
    markup = assets.rewrite_html(markup).strip()
    return markup or None


def text(value):
    """Trim the stray whitespace Webflow editors leave on plain-text fields."""
    return value.strip() if isinstance(value, str) else value


# --------------------------------------------------------------------------
# dates
# --------------------------------------------------------------------------

def parse_iso(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def is_date_only(dt):
    """Webflow stores date-only fields as midnight UTC."""
    return dt.hour == 0 and dt.minute == 0 and dt.second == 0


def display_datetime(dt):
    """Matches the old site: 'September 26, 2026 10:00 AM', in Senoia's time."""
    local = dt.astimezone(LOCAL_TZ)
    return f"{local:%B} {local.day}, {local.year} {local:%I:%M %p}".replace(" 0", " ", 1)


def display_date(dt):
    """
    'January 20, 2026'. Midnight-UTC values are calendar dates, so they are
    read in UTC - converting them to Eastern would show the previous day.
    """
    if not is_date_only(dt):
        dt = dt.astimezone(LOCAL_TZ)
    return f"{dt:%B} {dt.day}, {dt.year}"


# --------------------------------------------------------------------------
# collections
# --------------------------------------------------------------------------

def build_events(assets, index):
    raw = load_collection("events")
    options = option_names(raw)
    events = []

    for item in raw["items"]:
        f = item["fieldData"]
        if not is_live(item) or f.get("test-event"):
            continue

        start = parse_iso(f.get("start-date"))
        end = parse_iso(f.get("event-end-date-for-calendar"))
        # A few items have an end date left over from a previous year.
        if start and end and end < start:
            end = None

        gallery = index.get(f.get("photo-gallery") or "")
        events.append({
            # --- fields the pages already read ---
            "title": text(f.get("name")),
            "date_time": display_datetime(start) if start else "",
            "category": options.get(f.get("event-type"), ""),
            "description": text(f.get("event-summary")) or text(f.get("hero-sub-caption")) or "",
            "image": assets.image(f.get("main-image")),
            "link": f"/events/{f['slug']}",
            "is_recurring": bool(f.get("recurring-event")),
            # --- additional fields ---
            "id": item["id"],
            "slug": f["slug"],
            "start": start.isoformat() if start else None,
            "end": end.isoformat() if end else None,
            "is_active": bool(f.get("active-event")),
            "address": text(f.get("address")),
            "hero_image": assets.image(f.get("hero-image")),
            "hero_caption": text(f.get("hero-caption")),
            "hero_sub_caption": text(f.get("hero-sub-caption")),
            "button": (
                {"text": text(f.get("button-1-text")), "url": f.get("button-1-url")}
                if f.get("button-1-url") else None
            ),
            "signup_url": f.get("link-to-signup"),
            "google_maps_url": f.get("google-maps-link"),
            "coordinator_email": f.get("event-coordinator-contact-email"),
            "flyer_image": assets.image(f.get("primary-flyer-image")),
            "flyer_pdf": assets.image(f.get("primary-flyer-pdf")),
            "sections": {
                key: body for key in EVENT_SECTIONS
                if (body := clean_html(f.get(key), assets))
            },
            "photos": assets.images(f.get("photos")),
            "video_url": (f.get("features-video") or {}).get("url"),
            "gallery_slug": gallery["slug"] if gallery else None,
        })

    # Chronological; undated events sort last.
    events.sort(key=lambda e: (e["start"] is None, e["start"] or ""))
    return events


def build_businesses(assets, index, report):
    raw = load_collection("downtown-business")
    curated = json.loads(CATEGORY_FILE.read_text()) if CATEGORY_FILE.is_file() else {}
    businesses = []

    for item in raw["items"]:
        f = item["fieldData"]
        if not is_live(item) or f.get("test-item"):
            continue

        webflow_category = (index.get(f.get("category") or "") or {}).get("name") or ""
        category = curated.get(f["slug"])
        if category is None:
            category = WEBFLOW_CATEGORY_FALLBACK.get(webflow_category, UNCATEGORIZED)
            report.append(f"{f['slug']}: no hand-assigned category, "
                          f"used {category!r} (Webflow: {webflow_category or 'none'})")
        street = ", ".join(p for p in (text(f.get("street-address-1")),
                                       text(f.get("street-address-2"))) if p)
        region = " ".join(p for p in (text(f.get("state")), text(f.get("zip"))) if p)
        address = ", ".join(p for p in (street, text(f.get("city")), region) if p)

        businesses.append({
            # --- fields the pages already read ---
            "name": text(f.get("name")),
            "slug": f["slug"],
            "category": category,
            "phone": text(f.get("phone")),
            "email": text(f.get("email")),
            "website": f.get("website-url"),
            "facebook": f.get("facebook"),
            "instagram": f.get("instagram"),
            "image": assets.image(f.get("main-image")),
            "path": f"/downtown-business/{f['slug']}",
            "address": address,
            # --- additional fields ---
            "id": item["id"],
            "webflow_category": webflow_category,
            "summary": text(f.get("summary-description")),
            "description_html": clean_html(f.get("full-description"), assets),
            "hours_html": clean_html(f.get("hours"), assets),
            "street_address_1": text(f.get("street-address-1")),
            "street_address_2": text(f.get("street-address-2")),
            "city": text(f.get("city")),
            "state": text(f.get("state")),
            "zip": text(f.get("zip")),
            "google_maps_url": f.get("google-maps"),
            "twitter": f.get("twitter"),
            "linkedin": f.get("linkedin"),
            "tiktok": f.get("ticktok"),
            "video_url": (f.get("video") or {}).get("url"),
            "pdf": assets.image(f.get("pdf")),
            "gallery": assets.images(f.get("gallery")),
            "tags": [index[t]["name"] for t in (f.get("tags") or []) if t in index],
        })

    businesses.sort(key=lambda b: (b["name"] or "").lower())
    return businesses


def build_news(assets, index):
    raw = load_collection("news")
    news = []

    for item in raw["items"]:
        f = item["fieldData"]
        if not is_live(item) or f.get("test-item"):
            continue

        published = parse_iso(f.get("publish-date"))
        parent = index.get(f.get("parent-event") or "")
        news.append({
            # --- fields the pages already read ---
            "title": text(f.get("name")),
            # Most posts have no publish date, and the old site showed none for
            # them; leave it blank rather than inventing one.
            "date": display_date(published) if published else "",
            "summary": text(f.get("post-summary")) or "",
            "image": assets.image(f.get("main-image")),
            "link": f"/news/{f['slug']}",
            # --- additional fields ---
            "id": item["id"],
            "slug": f["slug"],
            "published": published.isoformat() if published else None,
            # Ordering only: the explicit date if set, otherwise creation time.
            "sort_date": f.get("publish-date") or item.get("createdOn"),
            "body_html": clean_html(f.get("post-body"), assets),
            "image_alt": text(f.get("main-image-alt-text")) or "",
            "thumbnail": assets.image(f.get("thumbnail-image")),
            "thumbnail_alt": text(f.get("thumbnail-image-alt-text")) or "",
            "featured": bool(f.get("featured")),
            "merchants_only": bool(f.get("merchants-only-news-item")),
            "event_slug": parent["slug"] if parent else None,
        })

    news.sort(key=lambda n: n["sort_date"] or "", reverse=True)
    return news


def build_galleries(assets, index):
    """
    Photo galleries, in the same card shape as news so the /news listing can
    show them alongside articles (as it did with the scraped data).
    """
    raw = load_collection("photo-galleries")
    galleries = []

    for item in raw["items"]:
        f = item["fieldData"]
        if not is_live(item) or f.get("test-photo-gallery"):
            continue

        # Webflow caps a MultiImage field, so one gallery is split across
        # gallery-images-1..10; flatten them back into one ordered list.
        images = []
        for n in range(1, 11):
            images.extend(assets.images(f.get(f"gallery-images-{n}")))

        event = index.get(f.get("event") or "")
        galleries.append({
            # --- fields the news cards read ---
            "title": text(f.get("name")),
            "date": "",
            "summary": text(f.get("summary-description")) or "",
            "image": assets.image(f.get("main-image")),
            "link": f"/photo-galleries/{f['slug']}",
            # --- additional fields ---
            "id": item["id"],
            "slug": f["slug"],
            "description_html": clean_html(f.get("full-description"), assets),
            "images": images,
            "event_slug": event["slug"] if event else None,
        })

    # rank-order is unset on every gallery, so keep Webflow's collection order,
    # which is also the order the old site listed them in.
    return galleries


# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Build app data from the raw Webflow pull.")
    ap.add_argument("--asset-base", default=DEFAULT_ASSET_BASE,
                    help=f"public URL prefix for downloaded assets (default {DEFAULT_ASSET_BASE})")
    args = ap.parse_args()

    assets = AssetResolver(args.asset_base)
    index = json.loads((RAW_DIR / "item_index.json").read_text())

    category_report = []
    outputs = {
        "events": build_events(assets, index),
        "businesses": build_businesses(assets, index, category_report),
        "news": build_news(assets, index),
        "galleries": build_galleries(assets, index),
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, records in outputs.items():
        (OUT_DIR / f"{name}.json").write_text(
            json.dumps(records, indent=2, ensure_ascii=False) + "\n"
        )
        print(f"  {name:<12} {len(records):>3} records -> data/site/{name}.json")

    if category_report:
        print(f"\n  {len(category_report)} businesses need a category in "
              f"{CATEGORY_FILE.relative_to(REPO_ROOT)}:")
        for line in category_report:
            print(f"    {line}")

    if assets.unresolved:
        print(f"\n  WARNING: {len(assets.unresolved)} CDN URLs are not in the download plan "
              "and still point at Webflow. Re-run scripts/webflow_pull.py.")
        for url in sorted(assets.unresolved)[:10]:
            print(f"    {url}")
    else:
        print("\n  all Webflow CDN URLs rewritten to local assets")


if __name__ == "__main__":
    main()
