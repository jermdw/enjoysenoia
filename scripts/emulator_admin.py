#!/usr/bin/env python3
"""
Creates a portal admin in the local Auth emulator, for trying the admin
portal (the News editor) without touching the live project.

Emulator only: it refuses to run without --auth-emulator, and the account it
makes exists nowhere else. Start the emulators and point the dev build at
them first (see .env.example):

    firebase emulators:start --only firestore,auth,storage --project enjoysenoia
    python3 scripts/seed_news.py --emulator 127.0.0.1:8080 --project enjoysenoia
    python3 scripts/emulator_admin.py --auth-emulator 127.0.0.1:9099 --project enjoysenoia

Then sign in at http://localhost:3000/admin with the account below. The
account carries the `admin` custom claim, which firestore.rules and
storage.rules accept alongside the email allowlist.
"""
import argparse
import json
import sys
import urllib.error
import urllib.request

# Emulator-only test account. Never reused outside the local Auth emulator.
EMAIL = "editor@example.test"
PASSWORD = "emulator-only-editor"


def call(url, body, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        return json.loads(urllib.request.urlopen(req).read() or b"{}")
    except urllib.error.HTTPError as err:
        return {"error": json.loads(err.read() or b"{}").get("error", {})}


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--auth-emulator", required=True, help="host:port of the Auth emulator")
    parser.add_argument("--project", required=True)
    args = parser.parse_args()

    base = f"http://{args.auth_emulator}/identitytoolkit.googleapis.com/v1"
    created = call(f"{base}/accounts:signUp?key=emulator", {"email": EMAIL, "password": PASSWORD})
    if "error" in created and created["error"].get("message") != "EMAIL_EXISTS":
        sys.exit(f"Could not create the account: {created['error']}")
    signed_in = call(f"{base}/accounts:signInWithPassword?key=emulator",
                     {"email": EMAIL, "password": PASSWORD, "returnSecureToken": True})
    if "error" in signed_in:
        sys.exit(f"Could not sign in: {signed_in['error']}")

    # "owner" is the emulator's admin token; it bypasses everything, emulator only.
    updated = call(f"{base}/projects/{args.project}/accounts:update",
                   {"localId": signed_in["localId"], "customAttributes": json.dumps({"admin": True})},
                   token="owner")
    if "error" in updated:
        sys.exit(f"Could not grant the admin claim: {updated['error']}")
    print(f"Emulator admin ready: {EMAIL} (password in scripts/emulator_admin.py)")


if __name__ == "__main__":
    main()
