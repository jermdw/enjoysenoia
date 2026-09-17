import React from 'react';
import { Instagram, Mail, MapPin } from 'lucide-react';
import Ornament from './Ornament';
import { contact, event } from '../data/eventDetails';

export default function MasqueradeFooter() {
  return (
    <footer className="bg-[var(--masq-ink)] border-t border-[var(--masq-line)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <p className="masq-display text-2xl sm:text-3xl text-[var(--masq-cream)]">
            {event.name}
          </p>
          <p className="masq-display text-lg text-[var(--masq-gold)] italic mt-1">{event.theme}</p>
          <p className="mt-4 text-[var(--masq-cream-dim)]">
            {event.dateLabel} · {event.timeLabel}
          </p>
        </div>

        <Ornament suit="heart" className="my-10" />

        <div className="grid sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="space-y-2">
            <p className="masq-eyebrow">The Venue</p>
            <p className="text-[var(--masq-cream)] flex items-start gap-2 justify-center sm:justify-start">
              <MapPin className="w-4 h-4 mt-1 shrink-0 text-[var(--masq-gold)]" />
              <span>{event.venue.label}</span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="masq-eyebrow">Ask Us Anything</p>
            <a
              href={`mailto:${contact.email}`}
              className="masq-link inline-flex items-center gap-2 text-[var(--masq-cream)]"
            >
              <Mail className="w-4 h-4 text-[var(--masq-gold)]" />
              <span>{contact.email}</span>
            </a>
          </div>

          <div className="space-y-2">
            <p className="masq-eyebrow">Follow the Rabbit</p>
            <div className="flex flex-col gap-1.5">
              <a
                href={contact.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="masq-link inline-flex items-center gap-2 text-[var(--masq-cream)] justify-center sm:justify-start"
              >
                <Instagram className="w-4 h-4 text-[var(--masq-gold)]" />
                <span>{contact.instagram.handle}</span>
              </a>
              <a
                href={contact.partnerInstagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="masq-link inline-flex items-center gap-2 text-[var(--masq-cream)] justify-center sm:justify-start"
              >
                <Instagram className="w-4 h-4 text-[var(--masq-gold)]" />
                <span>{contact.partnerInstagram.handle}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--masq-line)] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--masq-cream-dim)]">
          <p>
            {event.hashtag} · {event.host}
          </p>
          <a href={contact.ddaUrl} className="masq-link">
            enjoysenoia.com
          </a>
        </div>
      </div>
    </footer>
  );
}
