import React from 'react';

/**
 * Renders ordinal suffixes as superscripts — "3rd Annual" sets the "rd" above
 * the baseline — so event names can stay plain strings in eventDetails.js
 * rather than carrying markup.
 *
 * The split keeps both capture groups, so the parts cycle in threes:
 * text, number, suffix, text, number, suffix, … and only every third item
 * (the suffix) is raised.
 */
export default function Ordinal({ children }) {
  const parts = String(children).split(/(\d+)(st|nd|rd|th)\b/gi);

  return (
    <>
      {parts.map((part, i) => (i % 3 === 2 ? <sup key={i}>{part}</sup> : part))}
    </>
  );
}
