import React from 'react';
import { Ticket } from 'lucide-react';
import { getEventBySlug, getOpenTicket } from '../../services/dataService';

/**
 * Direct ticket checkout on an umbrella event's card, so buying does not take a
 * trip through its micro-site. `ticket_event_slug` (data/event_overrides.json)
 * names the listing that sells the tickets; the link and label come from there,
 * and the button goes away when that listing stops selling.
 */
export default function EventTicketButton({ event }) {
  const ticket = getOpenTicket(getEventBySlug(event?.ticket_event_slug));
  if (!ticket) return null;
  return (
    <a
      href={ticket.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold text-center transition-colors"
    >
      <Ticket className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{ticket.label}</span>
    </a>
  );
}
