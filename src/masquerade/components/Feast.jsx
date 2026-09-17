import React from 'react';
import { Wine } from 'lucide-react';
import Ornament, { SectionHeading, Suit } from './Ornament';
import { menu, performers } from '../data/eventDetails';

export default function Feast() {
  return (
    <section id="feast" className="py-24 sm:py-32 bg-[var(--masq-ink-soft)] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Mad Tea Party"
          title="The Feast"
          lead={`Dinner by ${menu.caterer}, with a cash bar by ${menu.bar}.`}
        />

        <div className="mt-14 grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Menu card, printed on cream so it reads like the real thing. */}
          <div className="masq-paper rounded-sm p-8 sm:p-11 shadow-2xl">
            <p className="text-center text-[0.7rem] uppercase tracking-[0.3em] text-[#8b6f4e]">
              Menu
            </p>
            <Ornament suit="heart" className="my-5 opacity-60" />

            <div className="space-y-8">
              {menu.courses.map((course) => (
                <div key={course.course}>
                  <h3 className="masq-display text-xl text-[#2b2118] text-center">{course.course}</h3>
                  {course.vipOnly && (
                    <p className="text-center text-[0.65rem] uppercase tracking-[0.2em] text-[#8b6f4e] mt-1">
                      VIP hour
                    </p>
                  )}
                  <ul className="mt-4 space-y-3 text-center">
                    {course.items.map((item) => (
                      <li key={item} className="text-[#3d3128] leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-9 pt-6 border-t border-[#c9b391] text-center space-y-1">
              <p className="text-sm italic text-[#5b4a3a]">{menu.dietaryNote}</p>
              <p className="text-sm text-[#5b4a3a] flex items-center justify-center gap-2">
                <Wine className="w-3.5 h-3.5" />
                <span>
                  {menu.barNote} by {menu.bar} — last call at 11:00 PM
                </span>
              </p>
            </div>
          </div>

          {/* Who's performing. */}
          <div>
            <h3 className="text-2xl sm:text-3xl text-[var(--masq-cream)]">The Company</h3>
            <p className="mt-3 text-[var(--masq-cream-dim)] leading-relaxed">
              Acrobats overhead, cards appearing at your elbow, and fire once the sun is
              well down.
            </p>

            <ul className="mt-9 space-y-8">
              {performers.map((performer, i) => (
                <li key={performer.name} className="flex gap-5">
                  <Suit
                    suit={['diamond', 'heart', 'club'][i % 3]}
                    className="w-4 h-4 mt-2 shrink-0 text-[var(--masq-crimson-bright)]"
                  />
                  <div>
                    <h4 className="masq-display text-xl text-[var(--masq-cream)]">{performer.name}</h4>
                    <p className="masq-eyebrow mt-1">{performer.role}</p>
                    <p className="mt-2 text-[var(--masq-cream-dim)] leading-relaxed">{performer.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
