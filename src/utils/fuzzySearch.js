/**
 * Typo-tolerant text matching for the directory search box.
 *
 * Plain substring matching missed "pizzaria" for "Pizzeria", so a query that is
 * close to a word in the text still counts as a match. Distance is capped by
 * query length so short queries stay precise.
 */

/** Levenshtein distance, bailing out once it exceeds `max`. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }

    if (rowMin > max) return max + 1;
    previous = current;
  }

  return previous[b.length];
}

/** How much misspelling to forgive for a query of this length. */
function toleranceFor(query) {
  if (query.length < 4) return 0;
  if (query.length <= 6) return 1;
  return 2;
}

/** Lowercases and spells out "&", so "crust and craft" finds "Crust & Craft". */
function normalize(value) {
  return String(value).toLowerCase().replace(/&/g, ' and ').replace(/\s+/g, ' ').trim();
}

/**
 * True when `query` appears in `text` outright, or is close enough to a word in
 * it (or to a run of words of the same length) to be a typo.
 */
export function fuzzyMatch(text, query) {
  if (!query) return true;
  if (!text) return false;

  const haystack = normalize(text);
  const needle = normalize(query);
  if (!needle) return true;
  if (haystack.includes(needle)) return true;

  const tolerance = toleranceFor(needle);
  if (tolerance === 0) return false;

  const words = haystack.split(/[^a-z0-9]+/).filter(Boolean);

  return words.some((word, i) => {
    if (editDistance(word, needle, tolerance) <= tolerance) return true;

    // Also compare against the window of words the query could span, so
    // "crust and craft" still finds "Crust & Craft".
    const phrase = words.slice(i).join(' ');
    const window = phrase.slice(0, needle.length + tolerance);
    return editDistance(window, needle, tolerance) <= tolerance;
  });
}

/** True when the query fuzzily matches any of the given fields. */
export function fuzzyMatchAny(fields, query) {
  if (!query) return true;
  return fields.some((field) => fuzzyMatch(field, query));
}
