#!/usr/bin/env python3
"""
Copies the Webflow news export (data/site/news.json) into the Firestore
`news` collection, one document per story keyed by its slug.

Create-only: a story that already exists is skipped, never overwritten, so
running this again after someone has edited a story in the admin portal is
harmless. After the first run Firestore is the source of truth for News; the
JSON file is only this script's input.

    # Local emulator (no credentials; the "owner" token bypasses rules)
    python3 scripts/seed_news.py --emulator 127.0.0.1:8080 --project demo-enjoysenoia

    # Production: uses your gcloud login, and asks before writing
    python3 scripts/seed_news.py --project enjoysenoia

    # Either, without writing anything
    python3 scripts/seed_news.py --project enjoysenoia --dry-run

The documents match isValidNewsStory() in firestore.rules.
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

NEWS_FILE = Path(__file__).resolve().parent.parent / "data" / "site" / "news.json"
COLLECTION = "news"


def published_at(sort_date):
    """
    Midnight-UTC values are calendar dates (see display_date in
    webflow_transform.py). Stored as-is they would read as the previous day in
    Senoia, so they move to 17:00 UTC: midday Eastern, the same date year-round.
    """
    dt = datetime.fromisoformat(sort_date.replace("Z", "+00:00"))
    if (dt.hour, dt.minute, dt.second, dt.microsecond) == (0, 0, 0, 0):
        dt = dt.replace(hour=17)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def value(v):
    """A Python value as a Firestore REST Value."""
    if v is None:
        return {"nullValue": None}
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, tuple) and v[0] == "timestamp":
        return {"timestampValue": v[1]}
    return {"stringValue": str(v)}


def story_fields(item, now):
    return {
        "title": item["title"],
        "slug": item["slug"],
        "summary": item.get("summary") or "",
        "bodyHtml": item.get("body_html") or "",
        "image": item.get("image"),
        "imageAlt": item.get("image_alt") or "",
        "status": "published",
        "publishedAt": ("timestamp", published_at(item["sort_date"])),
        # The old site showed a date only for stories with a publish date.
        "showDate": bool(item.get("date")),
        "featured": bool(item.get("featured")),
        "eventSlug": item.get("event_slug"),
        "createdAt": ("timestamp", now),
        "updatedAt": ("timestamp", now),
        "updatedBy": "webflow-import",
        "webflowId": item.get("id"),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--project", required=True)
    parser.add_argument("--emulator", default=os.environ.get("FIRESTORE_EMULATOR_HOST"),
                        help="host:port of the Firestore emulator (default: $FIRESTORE_EMULATOR_HOST)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    items = [n for n in json.loads(NEWS_FILE.read_text()) if not n.get("merchants_only")]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    if args.emulator:
        base = f"http://{args.emulator}/v1"
        token = "owner"
        target = f"emulator {args.emulator}"
    else:
        base = "https://firestore.googleapis.com/v1"
        target = f"PRODUCTION project {args.project}"
        token = None

    print(f"{len(items)} stories -> {target}, collection '{COLLECTION}'")
    for item in items:
        print(f"  {item['slug']}  ({published_at(item['sort_date'])[:10]})")
    if args.dry_run:
        return

    if not args.emulator:
        if input(f"\nWrite to {target}? Existing stories are skipped. [y/N] ").strip().lower() != "y":
            sys.exit("Nothing written.")
        token = subprocess.run(["gcloud", "auth", "print-access-token"],
                               capture_output=True, text=True, check=True).stdout.strip()

    url = f"{base}/projects/{args.project}/databases/(default)/documents/{COLLECTION}"
    created = skipped = 0
    for item in items:
        body = json.dumps({"fields": {k: value(v) for k, v in story_fields(item, now).items()}})
        req = urllib.request.Request(
            f"{url}?documentId={item['slug']}", data=body.encode(), method="POST",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                     "x-goog-user-project": args.project},
        )
        try:
            urllib.request.urlopen(req).read()
            created += 1
            print(f"  created  {item['slug']}")
        except urllib.error.HTTPError as err:
            if err.code == 409:
                skipped += 1
                print(f"  exists   {item['slug']} (left as is)")
            else:
                sys.exit(f"  FAILED   {item['slug']}: {err.code} {err.read().decode()[:300]}")

    print(f"\n{created} created, {skipped} already there")


if __name__ == "__main__":
    main()
