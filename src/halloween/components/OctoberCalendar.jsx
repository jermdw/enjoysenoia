import React, { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  parseISO,
  isSameDay,
} from 'date-fns';
import { event, calendarEvents, CALENDAR_KINDS } from '../data/halloweenDetails';
import { WavyFrame } from './Art';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Section 1 — the October calendar.
 *
 * The grid is derived from `event.year`, not hardcoded, so rolling the site to
 * the next Halloween is a one-line change in the data module. A day carrying an
 * entry is filled edge to edge in its colour, with the entry's short label
 * printed inside, so the month reads at a glance without the legend. Those days
 * are buttons; picking one shows its detail below the grid, which keeps the
 * whole month readable on a phone without a popover.
 */
export default function OctoberCalendar() {
  const halloween = parseISO(event.halloweenISO);

  const { days, leadingBlanks, byDate } = useMemo(() => {
    const first = startOfMonth(new Date(event.year, 9, 1)); // month 9 = October
    const all = eachDayOfInterval({ start: first, end: endOfMonth(first) });

    const grouped = calendarEvents.reduce((acc, item) => {
      (acc[item.date] ||= []).push(item);
      return acc;
    }, {});

    return { days: all, leadingBlanks: getDay(first), byDate: grouped };
  }, []);

  // Open on the first day that has something on it, so the panel is never empty.
  const [selected, setSelected] = useState(() => {
    const dates = calendarEvents.map((e) => e.date).sort();
    return dates[0] ?? null;
  });

  const selectedItems = selected ? byDate[selected] ?? [] : [];

  // Only show legend entries that are actually used this month.
  const usedKinds = useMemo(
    () => [...new Set(calendarEvents.map((e) => e.kind))],
    []
  );

  return (
    <section id="calendar">
      <div className="hallo-wrap">
        <WavyFrame>
          <h2 className="hallo-center">October in Senoia</h2>

          <ul className="hallo-legend hallo-legend-center">
            {usedKinds.map((kind) => (
              <li key={kind}>
                <span className="hallo-cal-swatch" style={{ backgroundColor: CALENDAR_KINDS[kind].color }} aria-hidden="true" />
                {CALENDAR_KINDS[kind].label}
              </li>
            ))}
          </ul>

          <div className="hallo-cal-grid" role="grid" aria-label={`October ${event.year}`}>
            {DOW.map((d) => (
              <div key={d} className="hallo-cal-dow" role="columnheader">{d}</div>
            ))}

            {Array.from({ length: leadingBlanks }, (_, i) => (
              <div key={`blank-${i}`} className="hallo-cal-cell is-empty" role="gridcell" />
            ))}

            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd');
              const items = byDate[iso] ?? [];
              const classes = [
                'hallo-cal-cell',
                items.length ? 'has-events' : '',
                isSameDay(day, halloween) ? 'is-halloween' : '',
                selected === iso ? 'is-selected' : '',
              ].filter(Boolean).join(' ');

              // Names the entries, since the aria-label replaces the visible label text.
              const label = [format(day, 'MMMM d'), ...items.map((item) => item.title)].join(', ');

              // A day with nothing on it is not interactive, so it is not a button.
              if (!items.length) {
                return (
                  <div key={iso} className={classes} role="gridcell">
                    <span className="hallo-cal-num">{format(day, 'd')}</span>
                  </div>
                );
              }

              return (
                <button
                  key={iso}
                  type="button"
                  className={classes}
                  role="gridcell"
                  aria-label={label}
                  aria-pressed={selected === iso}
                  onClick={() => setSelected(iso)}
                >
                  {/* One block per entry, stacked, so a day with two entries is
                      split between both colours rather than hiding one. */}
                  {items.map((item, i) => (
                    <span
                      key={i}
                      className="hallo-cal-event"
                      style={{ backgroundColor: CALENDAR_KINDS[item.kind].color, color: CALENDAR_KINDS[item.kind].ink }}
                    >
                      {i === 0 && <span className="hallo-cal-num">{format(day, 'd')}</span>}
                      <span className="hallo-cal-label">{item.label ?? item.title}</span>
                    </span>
                  ))}
                </button>
              );
            })}
          </div>

          {/* aria-live so keyboard and screen-reader users hear the panel change. */}
          <div className="hallo-cal-detail" aria-live="polite">
            {selectedItems.length > 0 && (
              <>
                <h3>{format(parseISO(selected), 'EEEE, MMMM d')}</h3>
                <ul>
                  {selectedItems.map((item, i) => (
                    <li key={i} className="hallo-card">
                      <strong>{item.title}</strong>
                      {item.detail && <p>{item.detail}</p>}
                      {/* In-page anchors scroll; only an external site opens a new tab. */}
                      {item.href && (item.href.startsWith('#') ? (
                        <a href={item.href}>Details →</a>
                      ) : (
                        <a href={item.href} target="_blank" rel="noreferrer">Details →</a>
                      ))}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </WavyFrame>
      </div>
    </section>
  );
}
