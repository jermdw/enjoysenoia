/**
 * Address -> coordinates for the Halloween admin, via OpenStreetMap's Nominatim.
 *
 * Nominatim because it needs no key or billing account (the same reason the
 * public map uses OSM tiles) and, unlike the US Census geocoder, it answers
 * browser requests with CORS headers, so no function has to proxy it.
 *
 * Its usage policy allows at most one request a second and forbids
 * search-as-you-type, so callers fire this from an explicit button only. The
 * browser's Referer identifies the site, which the policy accepts in place of
 * a custom User-Agent.
 *
 * Results are a starting point, not an answer: OSM often interpolates US house
 * numbers along the street, so a pin can land a few houses off. The admin
 * confirms (or moves) every pin before it is published.
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

// Roughly Senoia's ZIP code. Bounded, so "Main St" cannot match another state.
// Sharpsburg sits just inside the west edge, which is why a bare street
// address also gets the town appended below.
const VIEWBOX = '-84.65,33.37,-84.46,33.23';

let lastRequestAt = 0;

/** "12 Main St" -> "12 Main St, Senoia, GA"; left alone if it already names a town. */
export function withTown(address) {
  const a = address.trim();
  return a.includes(',') || /senoia/i.test(a) ? a : `${a}, Senoia, GA`;
}

/**
 * Looks up an address. Resolves to up to five candidates, best first:
 * `{ lat, lng, label, precise }`, where `precise` is false when Nominatim only
 * matched the street or area rather than a house number. Resolves to `[]` when
 * nothing matched; rejects on a network or service error.
 */
export async function geocodeAddress(address) {
  // The button is disabled while a lookup runs, but a fast answer plus a quick
  // second click could still beat the one-a-second limit.
  const wait = lastRequestAt + 1000 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  const params = new URLSearchParams({
    q: withTown(address),
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'us',
    viewbox: VIEWBOX,
    bounded: '1',
  });
  const res = await fetch(`${ENDPOINT}?${params}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geocoder returned ${res.status}`);
  const results = await res.json();
  return results.map((r) => ({
    lat: roundCoord(Number(r.lat)),
    lng: roundCoord(Number(r.lon)),
    label: r.display_name,
    // House-level matches come back as `place`/`building`/`house`; a bare
    // `road` or `neighbourhood` means the number was not found.
    precise: !['road', 'neighbourhood', 'suburb', 'city', 'town', 'village', 'county', 'postcode'].includes(r.addresstype),
  }));
}

/** Six decimals is about 10 cm, plenty for a house and tidier in Firestore. */
export function roundCoord(n) {
  return Math.round(n * 1e6) / 1e6;
}

/** Straight-line distance in metres; used to flag a pin far from downtown. */
export function distanceMeters([lat1, lng1], [lat2, lng2]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
