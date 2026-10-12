import React from 'react';
import { Link } from 'react-router-dom';
import { getEventSlug } from '../../services/dataService';

/**
 * Link to an event from a list or card.
 *
 * Events with an `external_url` (set in data/event_overrides.json) have their
 * own website, so the card goes straight there in a new tab instead of making
 * visitors click through the internal detail page. Every other event goes to
 * /events/<slug>. The detail page still exists at its URL for either kind.
 */
export default function EventLink({ event, children, ...props }) {
  if (event?.external_url) {
    return (
      <a href={event.external_url} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={`/events/${getEventSlug(event)}`} {...props}>
      {children}
    </Link>
  );
}
