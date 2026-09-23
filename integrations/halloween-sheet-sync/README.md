# Halloween sign-ups → Google Sheet

An Apps Script that lives inside a Google Sheet and copies decorating-contest
sign-ups from Firestore (`halloween_signups`) into it every 5 minutes. No
Cloud Function, no Blaze plan, no service-account key.

## Which Google account

The script reads Firestore **as the Google account that authorizes it**, through
IAM, not the security rules. That account needs Firestore read access on the
`enjoysenoia` project. Today only the project owner (`jermdw@gmail.com`) has it.

Either create the sheet while signed in as that account, or first grant the
account you want to use **Cloud Datastore Viewer** (`roles/datastore.viewer`)
in the Google Cloud console under IAM for `enjoysenoia`. Otherwise every run
fails with a 403.

## Setup

1. Signed in as that account, create a blank Google Sheet.
2. **Extensions → Apps Script.**
3. **Project Settings** (gear) → tick **Show "appsscript.json" manifest file in
   editor**.
4. Back in **Editor**, replace the contents of `appsscript.json` with the file
   in this folder, and of `Code.gs` with `Code.gs`. Save.
5. Pick `setup` in the function dropdown and **Run**. Google asks for
   permission; because the script is yours and unpublished it shows *"Google
   hasn't verified this app"* — choose **Advanced → Go to … (unsafe)** and
   allow.
6. Back in the sheet, a **Sign-ups** tab now holds every entry, and a
   **Halloween → Sync sign-ups now** menu appears after the next reload.

`setup` is safe to run again; it replaces its own trigger rather than adding
another.

## What it does to the sheet

- Matches rows to sign-ups by the **ID** column (the Firestore document ID) —
  don't edit or delete that column.
- Appends new sign-ups and refreshes the managed columns (Name, Address, Email
  Address, Type, Contest Category, Status, Submitted) on existing ones, so
  publishing an address in the admin tab shows as `published`.
- Leaves any columns you add alone, formulas included. Reordering columns is
  fine; they are found by header text.
- Leaves a row in place if its sign-up is deleted in Firestore.
- Prefixes any value starting with `=`, `+`, `-` or `@` with `'`, so an entry
  cannot plant a formula.

The sheet holds every entrant's name and email. Keep its sharing restricted.

If a run fails (for example the 403 above), Google emails the account that owns
the trigger with the error.
