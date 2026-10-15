// Run with: node --test scripts/sitemap.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { composeRoutes, redirectedPaths, staticRoutes, toXml } from './generate-sitemap.mjs';
import { validateSitemap } from './check-sitemap.mjs';

const base = {
  staticPaths: ['/', '/about-the-dda'],
  events: [{ link: '/events/a' }, { link: '/events/b' }, { title: 'No Link Event' }],
  businesses: [{ slug: 'x' }, { slug: 'y' }],
  newsSlugs: ['story'],
  patches: { events: {}, businesses: {} },
  redirected: new Set(),
};

test('built-in only', () => {
  assert.deepEqual(composeRoutes(base), [
    '/', '/about-the-dda', '/downtown-business/x', '/downtown-business/y',
    '/events/a', '/events/b', '/events/no-link-event', '/news/story',
  ]);
});

test('hidden patches drop built-in items; complete new docs are added; orphan patches are not', () => {
  const r = composeRoutes({
    ...base,
    patches: {
      events: {
        a: { hidden: true },
        b: { hidden: false, title: 'Edited' },
        fresh: { hidden: false, title: 'T', start: '2027-01-01' },
        orphan: { hidden: false, title: 'T' },
        gone: { hidden: true, title: 'T', start: 's' },
      },
      businesses: { x: { hidden: true }, newbiz: { hidden: false, name: 'N' }, noname: { hidden: false } },
    },
  });
  assert.ok(!r.includes('/events/a') && !r.includes('/downtown-business/x'));
  assert.ok(r.includes('/events/b') && r.includes('/events/fresh') && r.includes('/downtown-business/newbiz'));
  assert.ok(!r.includes('/events/orphan') && !r.includes('/events/gone') && !r.includes('/downtown-business/noname'));
});

test('redirected paths are excluded; only exact main-target redirects count', () => {
  const set = redirectedPaths({
    hosting: [
      { target: 'main', redirects: [{ source: '/events/a' }, { source: '/partners/**' }] },
      { target: 'halloween', redirects: [{ source: '/events/b' }] },
    ],
  });
  assert.deepEqual([...set], ['/events/a']);
  assert.ok(!composeRoutes({ ...base, redirected: set }).includes('/events/a'));
});

test('staticRoutes skips params, wildcards, admin and micro-site pages', () => {
  const src = '<Route path="/x"/><Route path="/e/:slug"/><Route path="*"/><Route path="/admin"/><Route path="/halloween"/>';
  assert.deepEqual([...staticRoutes(src + '<Route path="/sponsor-logo"/>')], ['/x']);
  assert.deepEqual([...staticRoutes(src)], ['/x']);
});

test('output validates; empty or foreign-host output does not', () => {
  const many = Array.from({ length: 60 }, (_, i) => `/p${i}`);
  assert.deepEqual(validateSitemap(toXml(['/', ...many])), []);
  assert.ok(validateSitemap(toXml(['/'])).length > 0);
  assert.ok(validateSitemap(toXml(['/', ...many]).replace('www.enjoysenoia.com/p1<', 'example.com/p1<')).length > 0);
  assert.ok(validateSitemap('<html/>').length > 0);
});
