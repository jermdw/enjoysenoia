/**
 * Senoia Halloween — mirror decorating-contest sign-ups into this Google Sheet.
 *
 * Paste into the sheet's Extensions > Apps Script editor, alongside
 * appsscript.json, then run `setup` once. See README.md in this folder.
 *
 * It reads Firestore's REST API with the OAuth token of whoever authorized the
 * script, so access follows that account's IAM on `enjoysenoia` and NOT the
 * security rules — the account must be able to read Firestore in the project
 * (today only the project owner can). Anyone that account shares the sheet
 * with can see every entrant's name and email, so keep sharing restricted.
 *
 * Every run upserts by Firestore document ID:
 *   - a new sign-up is appended as a row;
 *   - an existing row has only the managed columns below rewritten, so a
 *     Publish in the admin tab shows up as Status = published;
 *   - columns the organizer adds (notes, scores) are never touched;
 *   - a row whose sign-up was deleted in Firestore is left as it is.
 */

const PROJECT_ID = 'enjoysenoia';
const COLLECTION = 'halloween_signups';
const SHEET_NAME = 'Sign-ups';
const TIME_ZONE = 'America/New_York';
const SYNC_EVERY_MINUTES = 5;

// Header text -> how to read it from a parsed sign-up. Columns are found by
// header text, so the organizer can reorder them or insert their own.
const COLUMNS = [
  ['ID', (s) => s.id],
  ['Name', (s) => s.name],
  ['Address', (s) => s.address],
  ['Email Address', (s) => s.email],
  ['Type', (s) => s.category],
  ['Contest Category', (s) => s.contestCategory],
  ['Status', (s) => s.status],
  ['Submitted', (s) => s.submittedAt],
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Halloween')
    .addItem('Sync sign-ups now', 'syncSignups')
    .addToUi();
}

/** Run once by hand. Safe to re-run: it replaces its own trigger. */
function setup() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'syncSignups')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncSignups').timeBased().everyMinutes(SYNC_EVERY_MINUTES).create();
  syncSignups();
}

function syncSignups() {
  // The timer and the menu item can overlap; without the lock both would
  // append the same new sign-up.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) return;
  try {
    const signups = fetchSignups_().sort((a, b) => (a.submittedMs || 0) - (b.submittedMs || 0));
    writeSignups_(getSheet_(), signups);
  } finally {
    lock.releaseLock();
  }
}

function fetchSignups_() {
  // No orderBy: Firestore's list silently drops documents missing the field.
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`;
  const out = [];
  let pageToken = '';
  do {
    const url = `${base}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) {
      // Trigger failures are emailed to the owner; make the email useful.
      throw new Error(`Firestore returned ${res.getResponseCode()}: ${res.getContentText().slice(0, 500)}`);
    }
    const body = JSON.parse(res.getContentText());
    (body.documents || []).forEach((doc) => out.push(parseSignup_(doc)));
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return out;
}

function parseSignup_(doc) {
  const f = doc.fields || {};
  const str = (key) => (f[key] && f[key].stringValue) || '';
  const ts = f.submittedAt && f.submittedAt.timestampValue;
  const date = ts ? new Date(ts) : null;
  return {
    id: doc.name.split('/').pop(),
    name: str('name'),
    address: str('address'),
    email: str('email'),
    category: str('category'),
    contestCategory: str('contestCategory'),
    status: str('status'),
    // Local time, not the UTC date: an evening sign-up belongs to that day.
    submittedAt: date ? Utilities.formatDate(date, TIME_ZONE, 'yyyy-MM-dd HH:mm') : '',
    submittedMs: date ? date.getTime() : 0,
  };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(([header]) => header));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  }
  return sheet;
}

function writeSignups_(sheet, signups) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);

  // A managed header the organizer deleted is added back at the end.
  COLUMNS.forEach(([header]) => {
    if (!headers.includes(header)) {
      headers.push(header);
      sheet.getRange(1, headers.length).setValue(header).setFontWeight('bold');
    }
  });
  const colOf = {};
  COLUMNS.forEach(([header]) => (colOf[header] = headers.indexOf(header)));

  const lastRow = sheet.getLastRow();
  const ids = lastRow > 1 ? sheet.getRange(2, colOf.ID + 1, lastRow - 1, 1).getValues().map((r) => String(r[0])) : [];
  const rowOfId = {};
  ids.forEach((id, i) => {
    if (id) rowOfId[id] = i;
  });

  // One array per managed column, covering the existing rows plus new ones.
  const newIds = signups.filter((s) => rowOfId[s.id] === undefined).map((s) => s.id);
  newIds.forEach((id, k) => (rowOfId[id] = ids.length + k));
  const total = ids.length + newIds.length;
  if (total === 0) return;

  COLUMNS.forEach(([header, read]) => {
    const range = sheet.getRange(2, colOf[header] + 1, total, 1);
    // A row left over from a deleted sign-up is written back as read, so its
    // text needs the same guard: getValues returns '=x' for a cell showing =x.
    const values = range.getValues().map(([v]) => [typeof v === 'string' ? safeCell_(v) : v]);
    signups.forEach((s) => (values[rowOfId[s.id]][0] = safeCell_(read(s))));
    // Written a column at a time so the organizer's own columns, formulas
    // included, are never read back and rewritten as plain values.
    range.setValues(values);
  });
}

/**
 * setValues parses a leading = + - @ as a formula, so a sign-up could plant
 * one in the organizer's sheet. Same rule as signupsToCsv in
 * src/services/halloweenService.js.
 */
function safeCell_(value) {
  const s = value == null ? '' : String(value);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}
