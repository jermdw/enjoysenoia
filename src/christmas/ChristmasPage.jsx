import React, { useEffect } from 'react';
import { ExternalLink, House, Store, Truck } from 'lucide-react';
import './christmas.css';
import ChristmasSEO from './components/ChristmasSEO';
import bmwLogo from './assets/bmw-of-south-atlanta.png';
import { DDA_ORIGIN, events, sponsor } from './data/christmasDetails';
import { getEventBySlug, useContentOverrides } from '../services/dataService';

const ICONS = { market: Store, parade: Truck, home: House };

// Listing values that mean "nothing here" (the Webflow export writes the string).
const present = (value) => (value && value !== 'None' ? value : null);

// Listings store UTC; the events happen in Senoia.
const dayFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
});

function formatWhen(listing) {
  const start = new Date(present(listing?.start) || NaN);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(present(listing.end) || NaN);
  const times = Number.isNaN(end.getTime())
    ? timeFormat.format(start)
    : `${timeFormat.format(start)} – ${timeFormat.format(end)}`;
  return `${dayFormat.format(start)} · ${times}`;
}

/**
 * One card. DDA events take their date, description and contact from the live
 * listing, so staff edits in /admin reach this page; the card's own `when` and
 * `blurb` cover a listing that has none.
 */
function EventCard({ item }) {
  const listing = item.slug ? getEventBySlug(item.slug) : null;
  const Icon = ICONS[item.icon];
  const when = formatWhen(listing) || item.when;
  const blurb = present(listing?.description) || item.blurb;
  const contact = present(listing?.coordinator_email);
  const href = item.url || `${DDA_ORIGIN}/events/${item.slug}`;
  const label = item.linkLabel || 'Event details';

  return (
    <li className="xmas-card">
      <span className="xmas-card-icon" aria-hidden="true">
        <Icon size={24} />
      </span>
      <h3 className="xmas-display">{item.title}</h3>
      <p className="xmas-when">{when}</p>
      {blurb && <p className="xmas-blurb">{blurb}</p>}
      {contact && (
        <p className="xmas-contact">
          Questions? <a href={`mailto:${contact}`}>{contact}</a>
        </p>
      )}
      <a className="xmas-btn" href={href} target="_blank" rel="noreferrer">
        {label}
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    </li>
  );
}

/**
 * The Christmas in Senoia micro-site: one page, its own brand, rendered outside
 * the DDA Layout (see App.jsx). BMW of South Atlanta presents it.
 */
export default function ChristmasPage() {
  useContentOverrides();

  useEffect(() => {
    // index.html sets a light background on <body>; match the page's cream so
    // overscroll does not flash a different shade.
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#fbf6ec';
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  return (
    <div className="xmas">
      <ChristmasSEO />
      <header className="xmas-hero">
        <div className="xmas-wrap">
          <h1 className="xmas-display">
            Christmas
            <span>in</span>
            Senoia
          </h1>
          <p className="xmas-tagline">Celebrate the season in the heart of Senoia.</p>
          <div className="xmas-presented">
            <span className="xmas-presented-label">Presented by</span>
            <img src={bmwLogo} alt={sponsor.name} width="889" height="217" />
          </div>
        </div>
      </header>

      <main>
        <section className="xmas-section" aria-labelledby="xmas-events">
          <div className="xmas-wrap">
            <h2 id="xmas-events" className="xmas-display">
              This Season
            </h2>
            <ul className="xmas-cards">
              {events.map((item) => (
                <EventCard key={item.key} item={item} />
              ))}
            </ul>
          </div>
        </section>

        <section className="xmas-section xmas-shop">
          <div className="xmas-wrap">
            <p className="xmas-shop-words">Shop · Dine · Stroll · Enjoy</p>
            <p>
              Make a day of it downtown.{' '}
              <a href={`${DDA_ORIGIN}/downtown-businesses`} target="_blank" rel="noreferrer">
                Find shops and restaurants in Senoia
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="xmas-footer">
        <div className="xmas-wrap">
          <p>
            A{' '}
            <a href={DDA_ORIGIN} target="_blank" rel="noreferrer">
              Senoia Downtown Development Authority
            </a>{' '}
            celebration
          </p>
        </div>
      </footer>
    </div>
  );
}
