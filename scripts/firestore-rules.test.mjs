/**
 * Rules tests for the Halloween and News collections.
 *
 * The two-collection split in src/services/halloweenService.js, and the
 * draft/published gate in src/services/newsService.js, are only as good as
 * firestore.rules — and neither `npm run lint` nor `npm run build` reads that
 * file. This exercises it against the real emulator.
 *
 * Deliberately not wired into package.json or CI: the repo has no test runner
 * and this needs Java plus a one-off install. Run it by hand from the repo root
 * after touching firestore.rules:
 *
 *   npm i --no-save @firebase/rules-unit-testing@4.0.1
 *   npx -y firebase-tools@latest emulators:exec --only firestore \
 *     --project rules-test "node scripts/firestore-rules.test.mjs"
 *
 * The 4.0.1 pin is not cosmetic: it is the last release peering firebase ^11,
 * which is what this repo uses. Latest (5.x) peers firebase ^12 and npm refuses
 * the install. Bump it when the firebase dependency moves.
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

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
