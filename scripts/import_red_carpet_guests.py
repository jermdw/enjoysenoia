#!/usr/bin/env python3
"""
Loads the Masquerade ticket buyers into the Firestore `masquerade_photo_guests`
collection, which decides who requestRedCarpetLink sends a photo link to.

Input is one or more CSV exports from Ticket Tailor (orders or issued tickets).
Every column whose header contains "email" is read, so buyer and attendee
addresses both count. Only a hash of each address is stored: the document id
is sha256 of the trimmed, lowercased email, matching emailHash() in
functions/redCarpet.js. Re-running is harmless; existing guests are kept.

    # Local emulator (no credentials; the "owner" token bypasses rules)
    python3 scripts/import_red_carpet_guests.py orders.csv --emulator 127.0.0.1:8080 --project demo-enjoysenoia

    # Production: uses your gcloud login, and asks before writing
    python3 scripts/import_red_carpet_guests.py orders.csv --project enjoysenoia

    # Either, without writing anything
    python3 scripts/import_red_carpet_guests.py orders.csv --project enjoysenoia --dry-run
"""
import argparse
import csv
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

COLLECTION = "masquerade_photo_guests"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize(email):
    """Must match normalizeEmail() in functions/redCarpet.js."""
    return email.strip().lower()


def read_emails(paths):
    emails = set()
    for path in paths:
        with open(path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            columns = [c for c in (reader.fieldnames or []) if "email" in c.lower()]
            if not columns:
                sys.exit(f"{path}: no column with 'email' in its header ({reader.fieldnames})")
            print(f"{path}: reading {', '.join(columns)}")
            for row in reader:
                for c in columns:
                    value = normalize(row.get(c) or "")
                    if EMAIL_RE.match(value):
                        emails.add(value)
    return sorted(emails)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("csv", nargs="+", help="Ticket Tailor CSV export(s)")
    parser.add_argument("--project", required=True)
    parser.add_argument("--emulator", default=os.environ.get("FIRESTORE_EMULATOR_HOST"),
                        help="host:port of the Firestore emulator (default: $FIRESTORE_EMULATOR_HOST)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    emails = read_emails(args.csv)
    if args.emulator:
        base, token, target = f"http://{args.emulator}/v1", "owner", f"emulator {args.emulator}"
    else:
        base, token, target = "https://firestore.googleapis.com/v1", None, f"PRODUCTION project {args.project}"

    print(f"\n{len(emails)} distinct addresses -> {target}, collection '{COLLECTION}'")
    if args.dry_run:
        for e in emails[:5]:
            print(f"  {e[:2]}***@{e.split('@')[1]}")
        return

    if not args.emulator:
        if input(f"\nWrite to {target}? [y/N] ").strip().lower() != "y":
            sys.exit("Nothing written.")
        token = subprocess.run(["gcloud", "auth", "print-access-token"],
                               capture_output=True, text=True, check=True).stdout.strip()

    db = f"projects/{args.project}/databases/(default)/documents"
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    created = 0
    # Create-only (precondition exists: false), so an address already on the
    # list is left alone. One write per commit: a failed precondition fails
    # the whole commit it is in.
    for e in emails:
        doc = f"{db}/{COLLECTION}/{hashlib.sha256(e.encode()).hexdigest()}"
        body = {"writes": [{
            "update": {"name": doc, "fields": {
                "addedAt": {"timestampValue": now},
                "source": {"stringValue": "ticket-tailor-csv"},
            }},
            "currentDocument": {"exists": False},
        }]}
        req = urllib.request.Request(
            f"{base}/projects/{args.project}/databases/(default)/documents:commit",
            data=json.dumps(body).encode(), method="POST",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                     "x-goog-user-project": args.project},
        )
        try:
            urllib.request.urlopen(req).read()
            created += 1
        except urllib.error.HTTPError as err:
            if err.code not in (400, 409) or "exist" not in err.read().decode().lower():
                sys.exit(f"  FAILED: {err.code}")

    print(f"\n{created} added, {len(emails) - created} already on the list")


if __name__ == "__main__":
    main()
