import React from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { Keyhole } from './Ornament';
import { contact } from '../data/eventDetails';

/**
 * Social follow block. This replaced the email capture that used to sit here at
 * the organizer's request.
 *
 * Note for whoever picks this up: the site no longer collects addresses, so a
 * tier with `status: 'waitlist'` has nowhere to send people — its button now
 * points here. If a waitlist is wanted again, this is where it goes.
 */
// The event's own accounts only; the partner @EnjoySenoia Instagram stays off.
const accounts = [
  { ...contact.facebook, Icon: Facebook },
  { ...contact.instagram, Icon: Instagram },
];

export default function Follow() {
  return (
    <section
      id="follow"
      className="py-24 sm:py-28 bg-[var(--masq-ink)] scroll-mt-16 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 50% 120%, rgba(139, 14, 22, 0.35), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <Keyhole className="w-14 h-[5.25rem] mx-auto text-[var(--masq-gold)]" />
        <h2 className="mt-6 text-3xl sm:text-4xl text-[var(--masq-cream)]">
          Follow the key. See where curiosity takes you.
        </h2>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          {accounts.map((account) => (
            <a
              key={account.handle}
              href={account.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-sm border border-[var(--masq-gold)] text-[var(--masq-gold)] hover:bg-[var(--masq-gold)] hover:text-[var(--masq-ink)] text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            >
              <account.Icon className="w-4 h-4" />
              <span>{account.handle}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
