import React from 'react';
import { Mail } from 'lucide-react';
import { SectionHeading, Suit } from './Ornament';
import { sponsorTiers, sponsors, contact } from '../data/eventDetails';

const suitForTier = { queen: 'heart', hatter: 'club', rabbit: 'diamond', curiosities: 'spade' };

export default function Sponsors() {
  return (
    <section id="sponsors" className="py-24 sm:py-32 bg-[var(--masq-ink)] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="With thanks to"
          title="Our Patrons"
          lead="The Masquerade is carried by the businesses and neighbors who believe an odd, beautiful night is worth having in Senoia."
        />

        {/* Sponsor logos land here as they're confirmed. Until then the tiers
            stand on their own as a sponsorship invitation. */}
        {sponsors.length > 0 && (
          <div className="mt-14 space-y-12">
            {sponsorTiers.map((tier) => {
              const tierSponsors = sponsors.filter((s) => s.tierId === tier.id);
              if (tierSponsors.length === 0) return null;
              return (
                <div key={tier.id}>
                  <p className="masq-eyebrow text-center">{tier.name}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-10">
                    {tierSponsors.map((sponsor) => (
                      <a
                        key={sponsor.name}
                        href={sponsor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <img src={sponsor.logo} alt={sponsor.name} className="h-14 sm:h-16 w-auto object-contain" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sponsorTiers.map((tier) => (
            <article
              key={tier.id}
              className="border border-[var(--masq-line)] rounded-sm p-7 text-center bg-[var(--masq-ink-soft)] hover:border-[var(--masq-gold)] transition-colors"
            >
              <Suit suit={suitForTier[tier.id]} className="w-5 h-5 mx-auto text-[var(--masq-crimson-bright)]" />
              <h3 className="mt-4 text-xl text-[var(--masq-cream)]">{tier.name}</h3>
              <p className="mt-3 text-[var(--masq-cream-dim)] leading-snug">{tier.blurb}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-[var(--masq-cream-dim)] max-w-xl mx-auto">
            Sponsorships support the Senoia Downtown Development Authority and the events it
            brings to town. Packages are available now.
          </p>
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent('Masquerade sponsorship')}`}
            className="mt-7 inline-flex items-center gap-2.5 px-8 py-3.5 rounded-sm border border-[var(--masq-gold)] text-[var(--masq-gold)] hover:bg-[var(--masq-gold)] hover:text-[var(--masq-ink)] text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Become a sponsor</span>
          </a>
        </div>
      </div>
    </section>
  );
}
