/**
 * Rules tests for storage.rules: the News editor's image uploads, and the
 * private/ prefix that only the Admin SDK may read.
 *
 * Run in CI by .github/workflows/ci.yml, and locally with `npm run test:rules`
 * (see firestore-rules.test.mjs for setup notes).
 *
 * Exits non-zero if any assertion fails.
 */
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

const env = await initializeTestEnvironment({
  projectId: 'rules-test',
  storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
});

const pub = env.unauthenticatedContext().storage();
// Matches an address in isAdmin() in storage.rules.
const admin = env.authenticatedContext('admin1', { email: 'jermdw@gmail.com' }).storage();
const claimAdmin = env.authenticatedContext('admin2', { email: 'someone@example.com', admin: true }).storage();
const nonAdmin = env.authenticatedContext('rando', { email: 'rando@example.com' }).storage();

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const image = { contentType: 'image/png' };

let pass = 0, fail = 0;
const check = async (label, fn) => {
  try { await fn(); console.log(`  PASS  ${label}`); pass++; }
  catch (e) { console.log(`  FAIL  ${label}\n        ${e.message.split('\n')[0]}`); fail++; }
};

await env.withSecurityRulesDisabled(async (ctx) => {
  await uploadBytes(ref(ctx.storage(), 'webflow/site/logo.png'), png, image);
  await uploadBytes(ref(ctx.storage(), 'news/old-story/photo.png'), png, image);
  await uploadBytes(ref(ctx.storage(), 'private/masquerade-2026/red-carpet/full/123.jpg'), png, image);
  await uploadBytes(ref(ctx.storage(), 'root.png'), png, image);
});

console.log('\nreads');
await check('public MAY read a migrated asset',
  () => assertSucceeds(getBytes(ref(pub, 'webflow/site/logo.png'))));
await check('public MAY read a news image',
  () => assertSucceeds(getBytes(ref(pub, 'news/old-story/photo.png'))));

await check('public MAY read a file at the bucket root',
  () => assertSucceeds(getBytes(ref(pub, 'root.png'))));
await check('public may NOT read under private/',
  () => assertFails(getBytes(ref(pub, 'private/masquerade-2026/red-carpet/full/123.jpg'))));
await check('admin may NOT read under private/ from the browser',
  () => assertFails(getBytes(ref(admin, 'private/masquerade-2026/red-carpet/full/123.jpg'))));
await check('admin may NOT upload under private/ from the browser',
  () => assertFails(uploadBytes(ref(admin, 'private/masquerade-2026/red-carpet/full/999.jpg'), png, image)));

console.log('\nnews uploads');
await check('admin MAY upload an image under news/<slug>/',
  () => assertSucceeds(uploadBytes(ref(admin, 'news/new-story/1-photo.png'), png, image)));
await check('admin-claim account MAY upload an image under news/',
  () => assertSucceeds(uploadBytes(ref(claimAdmin, 'news/new-story/2-photo.png'), png, image)));
await check('admin may NOT upload a non-image under news/',
  () => assertFails(uploadBytes(ref(admin, 'news/new-story/notes.html'), png, { contentType: 'text/html' })));
await check('admin may NOT upload an image of 10 MB or more',
  () => assertFails(uploadBytes(ref(admin, 'news/new-story/huge.png'), new Uint8Array(10 * 1024 * 1024), image)));
await check('admin may NOT overwrite an existing news image',
  () => assertFails(uploadBytes(ref(admin, 'news/old-story/photo.png'), png, image)));
await check('signed-in non-admin may NOT upload',
  () => assertFails(uploadBytes(ref(nonAdmin, 'news/new-story/3-photo.png'), png, image)));
await check('public may NOT upload',
  () => assertFails(uploadBytes(ref(pub, 'news/new-story/4-photo.png'), png, image)));
await check('admin MAY delete a news image',
  () => assertSucceeds(deleteObject(ref(admin, 'news/new-story/1-photo.png'))));

console.log('\neverywhere else');
await check('admin may NOT upload outside news/',
  () => assertFails(uploadBytes(ref(admin, 'webflow/site/new.png'), png, image)));
await check('admin may NOT overwrite a migrated asset',
  () => assertFails(uploadBytes(ref(admin, 'webflow/site/logo.png'), png, image)));
await check('admin may NOT delete a migrated asset',
  () => assertFails(deleteObject(ref(admin, 'webflow/site/logo.png'))));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
