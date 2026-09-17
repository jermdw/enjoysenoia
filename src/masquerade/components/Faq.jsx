import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionHeading } from './Ornament';
import { faqs } from '../data/eventDetails';

export default function Faq() {
  return (
    <section id="faq" className="py-24 sm:py-32 bg-[var(--masq-ink-soft)] scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Know before you go"
          title="Curious Questions"
          lead="Here is everything worth knowing before you arrive."
        />

        {/* Native <details> keeps this keyboard- and screen-reader-friendly
            without any accordion state to manage. */}
        <div className="mt-14 divide-y divide-[var(--masq-line)] border-y border-[var(--masq-line)]">
          {faqs.map((faq) => (
            <details key={faq.q} className="masq-faq group">
              <summary className="flex items-center justify-between gap-6 py-5 text-left">
                <span className="text-lg sm:text-xl text-[var(--masq-cream)] masq-display">{faq.q}</span>
                <ChevronDown className="masq-faq-chevron w-5 h-5 shrink-0 text-[var(--masq-gold)] transition-transform duration-300" />
              </summary>
              <p className="pb-6 -mt-1 text-[var(--masq-cream-dim)] leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
