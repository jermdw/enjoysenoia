/**
 * Rules tests for the Halloween collections.
 *
 * The two-collection split in src/services/halloweenService.js is only as good
 * as firestore.rules — and neither `npm run lint` nor `npm run build` reads
 * that file. This exercises it against the real emulator.
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
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

// Seed with rules disabled so reads and updates have a target.
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'halloween_signups/s1'), {
    name: 'Jane Doe', address: '12 Main Street', email: 'jane@example.com',
    category: 'residential', status: 'pending', submittedAt: new Date(), source: 'halloween_2026',
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

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
