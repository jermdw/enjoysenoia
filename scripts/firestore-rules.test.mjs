/**
 * Rules tests for the Halloween, News and staff-edit (events, businesses) collections.
 *
 * The two-collection split in src/services/halloweenService.js, and the
 * draft/published gate in src/services/newsService.js, are only as good as
 * firestore.rules — and neither `npm run lint` nor `npm run build` reads that
 * file. This exercises it against the real emulator.
 *
 * Run in CI by .github/workflows/ci.yml, and locally from the repo root with:
 *
 *   npm run test:rules
 *
 * That runs this file and storage-rules.test.mjs under one emulator session.
 * It needs Java 21+ on PATH. @firebase/rules-unit-testing is pinned to 4.0.1,
 * the last release peering firebase ^11 (latest 5.x peers ^12 and npm refuses
 * the install); bump it when the firebase dependency moves.
 *
 * Exits non-zero if any assertion fails.
 */
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, addDoc, query, where, serverTimestamp,
} from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

const pub = env.unauthenticatedContext().firestore();
// Matches an address in isAdmin() in firestore.rules.
const admin = env.authenticatedContext('admin1', { email: 'jermdw@gmail.com' }).firestore();
const nonAdmin = env.authenticatedContext('rando', { email: 'rando@example.com' }).firestore();

const validSignup = (over = {}) => ({
  name: 'Jane Doe',
  address: '12 Main Street, Senoia GA',
  email: 'jane@example.com',
  category: 'residential',
  contestCategory: 'spooky',
  status: 'pending',
  submittedAt: serverTimestamp(),
  source: 'halloween_2026',
  ...over,
});

let pass = 0, fail = 0;
const check = async (label, fn) => {
  try { await fn(); console.log(`  PASS  ${label}`); pass++; }
  catch (e) { console.log(`  FAIL  ${label}\n        ${e.message.split('\n')[0]}`); fail++; }
};

console.log('\nhalloween_signups');
await check('public may create a valid pending sign-up',
  () => assertSucceeds(addDoc(collection(pub, 'halloween_signups'), validSignup())));
await check('public may NOT self-approve (status: published)',
  () => assertFails(addDoc(collection(pub, 'halloween_signups'), validSignup({ status: 'published' }))));
await check('public may NOT inject mapPointId at create',
  () => assertFails(addDoc(collection(pub, 'halloween_signups'), validSignup({ mapPointId: 'x' }))));
await check('public may NOT create with a bad category',
  () => assertFails(addDoc(collection(pub, 'halloween_signups'), validSignup({ category: 'church' }))));
await check('public may NOT create with a malformed email',
  () => assertFails(addDoc(collection(pub, 'halloween_signups'), validSignup({ email: 'nope' }))));
await check('public may NOT create with a bad contestCategory',
  () => assertFails(addDoc(collection(pub, 'halloween_signups'), validSignup({ contestCategory: 'scariest' }))));
await check('public may NOT omit contestCategory',
  () => assertFails(addDoc(collection(pub, 'halloween_signups'), (() => {
    const v = validSignup(); delete v.contestCategory; return v;
  })())));

// Seed with rules disabled so reads and updates have a target.
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'halloween_signups/s1'), {
    name: 'Jane Doe', address: '12 Main Street', email: 'jane@example.com',
    category: 'residential', contestCategory: 'spooky', status: 'pending',
    submittedAt: new Date(), source: 'halloween_2026',
  });
  await setDoc(doc(ctx.firestore(), 'halloween_map_points/p1'), {
    address: '12 Main Street', lat: 33.3, lng: -84.5, kind: 'residential', label: null, createdAt: new Date(),
  });
});

await check('public may NOT read a sign-up (name + email would leak)',
  () => assertFails(getDoc(doc(pub, 'halloween_signups/s1'))));
await check('signed-in non-admin may NOT read a sign-up',
  () => assertFails(getDoc(doc(nonAdmin, 'halloween_signups/s1'))));
await check('admin MAY read a sign-up',
  () => assertSucceeds(getDoc(doc(admin, 'halloween_signups/s1'))));
await check('admin MAY set mapPointId when publishing',
  () => assertSucceeds(updateDoc(doc(admin, 'halloween_signups/s1'), { status: 'published', mapPointId: 'p1' })));
await check('admin may NOT add an unknown field',
  () => assertFails(updateDoc(doc(admin, 'halloween_signups/s1'), { secretNote: 'hi' })));

console.log('\nhalloween_map_points');
await check('public MAY read map points',
  () => assertSucceeds(getDoc(doc(pub, 'halloween_map_points/p1'))));
await check('public may NOT write a map point',
  () => assertFails(addDoc(collection(pub, 'halloween_map_points'), {
    address: 'anywhere', lat: 1, lng: 1, kind: 'residential', label: null, createdAt: serverTimestamp() })));
await check('admin MAY write a map point',
  () => assertSucceeds(addDoc(collection(admin, 'halloween_map_points'), {
    address: 'Main St at Seavy St', lat: 33.3, lng: -84.5, kind: 'closure', label: 'Road closed', createdAt: serverTimestamp() })));
await check('admin may NOT write a map point carrying an email',
  () => assertFails(addDoc(collection(admin, 'halloween_map_points'), {
    address: 'x', lat: 1, lng: 1, kind: 'residential', label: null, createdAt: serverTimestamp(), email: 'jane@example.com' })));
await check('admin MAY write an unplaced pin (null coords)',
  () => assertSucceeds(addDoc(collection(admin, 'halloween_map_points'), {
    address: 'unplaced', lat: null, lng: null, kind: 'parking', label: null, createdAt: serverTimestamp() })));

const story = (slug, over = {}) => ({
  title: 'Porchfest Highlights',
  slug,
  summary: 'Thank you, Senoia!',
  bodyHtml: '<p>Thank you, Senoia!</p>',
  image: null,
  imageAlt: '',
  status: 'published',
  publishedAt: new Date('2026-09-09T17:00:00Z'),
  showDate: true,
  featured: false,
  eventSlug: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  updatedBy: 'jermdw@gmail.com',
  webflowId: null,
  ...over,
});

await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'news/published-story'), story('published-story'));
  await setDoc(doc(ctx.firestore(), 'news/draft-story'), story('draft-story', { status: 'draft' }));
});

console.log('\nnews');
await check('public MAY read a published story',
  () => assertSucceeds(getDoc(doc(pub, 'news/published-story'))));
await check('public may NOT read a draft',
  () => assertFails(getDoc(doc(pub, 'news/draft-story'))));
await check('signed-in non-admin may NOT read a draft',
  () => assertFails(getDoc(doc(nonAdmin, 'news/draft-story'))));
await check('admin MAY read a draft',
  () => assertSucceeds(getDoc(doc(admin, 'news/draft-story'))));
await check('public MAY list stories filtered to published',
  () => assertSucceeds(getDocs(query(collection(pub, 'news'), where('status', '==', 'published')))));
await check('public may NOT list stories without the published filter',
  () => assertFails(getDocs(collection(pub, 'news'))));
await check('public may NOT write a story',
  () => assertFails(setDoc(doc(pub, 'news/new-story'), story('new-story'))));
await check('signed-in non-admin may NOT write a story',
  () => assertFails(setDoc(doc(nonAdmin, 'news/new-story'), story('new-story'))));
await check('admin MAY create a story',
  () => assertSucceeds(setDoc(doc(admin, 'news/new-story'), story('new-story'))));
await check('admin MAY publish a draft',
  () => assertSucceeds(updateDoc(doc(admin, 'news/draft-story'), { status: 'published' })));
await check('admin may NOT store a slug that differs from the document id',
  () => assertFails(setDoc(doc(admin, 'news/other-story'), story('not-other-story'))));
await check('admin may NOT use a slug with spaces or capitals',
  () => assertFails(setDoc(doc(admin, 'news/Bad Slug'), story('Bad Slug'))));
await check('admin may NOT set an unknown status',
  () => assertFails(setDoc(doc(admin, 'news/odd-story'), story('odd-story', { status: 'scheduled' }))));
await check('admin may NOT add an unknown field',
  () => assertFails(setDoc(doc(admin, 'news/odd-story'), story('odd-story', { secretNote: 'hi' }))));
await check('admin may NOT omit publishedAt',
  () => assertFails(setDoc(doc(admin, 'news/odd-story'), (() => {
    const v = story('odd-story'); delete v.publishedAt; return v;
  })())));
await check('admin MAY record firstPublishedAt when publishing',
  () => assertSucceeds(updateDoc(doc(admin, 'news/new-story'), { status: 'published', firstPublishedAt: new Date() })));
await check('admin MAY delete a story',
  () => assertSucceeds(deleteDoc(doc(admin, 'news/new-story'))));


// Staff edits to events and the downtown directory. The same two checks apply
// to both collections, so they run through one table.
const eventDoc = (slug, over = {}) => ({
  slug, hidden: false, title: 'Fall Festival', start: '2026-11-07T15:00:00.000Z',
  date_time: 'November 7, 2026 10:00 AM', updatedAt: serverTimestamp(), updatedBy: 'jermdw@gmail.com', ...over,
});
const businessDoc = (slug, over = {}) => ({
  slug, hidden: false, name: 'Senoia Sim Racing', category: 'Shopping & Retail',
  website: 'https://senoiasimracing.com/', address: 'Lower level, 48 Main Street', updatedAt: serverTimestamp(), ...over,
});

for (const [col, make, titleKey] of [['events', eventDoc, 'title'], ['businesses', businessDoc, 'name']]) {
  console.log(`\n${col} (staff edits)`);
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `${col}/existing-item`), make('existing-item'));
  });
  await check(`public MAY read ${col}`,
    () => assertSucceeds(getDoc(doc(pub, `${col}/existing-item`))));
  await check(`public MAY list ${col}`,
    () => assertSucceeds(getDocs(collection(pub, col))));
  await check(`public may NOT create in ${col}`,
    () => assertFails(setDoc(doc(pub, `${col}/new-item`), make('new-item'))));
  await check(`public may NOT hide an item in ${col}`,
    () => assertFails(updateDoc(doc(pub, `${col}/existing-item`), { hidden: true })));
  await check(`public may NOT delete from ${col}`,
    () => assertFails(deleteDoc(doc(pub, `${col}/existing-item`))));
  await check(`signed-in non-admin may NOT write ${col}`,
    () => assertFails(setDoc(doc(nonAdmin, `${col}/new-item`), make('new-item'))));
  await check(`admin MAY create in ${col}`,
    () => assertSucceeds(setDoc(doc(admin, `${col}/new-item`), make('new-item'))));
  await check(`admin MAY hide an item in ${col} (partial patch)`,
    () => assertSucceeds(setDoc(doc(admin, `${col}/some-built-in`), { slug: 'some-built-in', hidden: true }, { merge: true })));
  await check(`admin MAY delete a patch in ${col}`,
    () => assertSucceeds(deleteDoc(doc(admin, `${col}/new-item`))));
  await check(`admin may NOT store a slug that differs from the document id in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/other-item`), make('not-other-item'))));
  await check(`admin may NOT use a slug with capitals in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/Bad Slug`), make('Bad Slug'))));
  await check(`admin may NOT add an unknown field in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/odd-item`), make('odd-item', { secretNote: 'hi' }))));
  await check(`admin may NOT omit hidden in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/odd-item`), (() => {
      const v = make('odd-item'); delete v.hidden; return v;
    })())));
  await check(`admin may NOT set hidden to a non-boolean in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/odd-item`), make('odd-item', { hidden: 'yes' }))));
  await check(`admin may NOT save an empty ${titleKey} in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/odd-item`), make('odd-item', { [titleKey]: '' }))));
  await check(`admin may NOT save an oversized ${titleKey} in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/odd-item`), make('odd-item', { [titleKey]: 'x'.repeat(201) }))));
  await check(`admin may NOT save a non-string image in ${col}`,
    () => assertFails(setDoc(doc(admin, `${col}/odd-item`), make('odd-item', { image: 5 }))));
}

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
