import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Utensils, Music } from 'lucide-react';
import { getEvents } from '../../services/dataService';

export default function RecurringEvents() {
  const allEvents = getEvents();
  const recurring = allEvents.filter(e => e.is_recurring);

  return (
    <section className="py-16 bg-stone-100 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Clock className="w-4 h-4 text-senoia-gold" />
            <span>Regular Traditions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
            Recurring Senoia Events
          </h2>
          <p className="text-stone-600 text-base">
            Make historic downtown Senoia part of your regular weekend and evening plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recurring.map((evt, idx) => {
            const isFarmers = evt.title.toLowerCase().includes('farmers');
            return (
              <div 
                key={evt.title + idx}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 flex flex-col sm:flex-row hover:shadow-md transition-shadow"
              >
                <div className="sm:w-2/5 relative aspect-video sm:aspect-auto overflow-hidden bg-stone-200">
                  <img 
                    src={evt.image || 'https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/67b7cebe7735727df5de2fe0_Fat%20tuesday%20(1200%20x%20628%20px)%20(4).jpg'} 
                    alt={evt.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="p-2 rounded-lg bg-white/90 backdrop-blur-md shadow-xs text-senoia-red inline-block">
                      {isFarmers ? <Utensils className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-senoia-red">
                      {isFarmers ? 'Every Saturday Morning' : 'Monthly Celebration'}
                    </span>
                    <h3 className="text-xl font-bold font-serif text-stone-900">
                      {evt.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {evt.description || 'Join local vendors, fresh produce, live music, and family-friendly activities in historic downtown Senoia.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="text-xs text-stone-500 font-medium">
                      {evt.date_time}
                    </div>
                    <Link
                      to={evt.link || '/events'}
                      className="text-xs font-semibold text-senoia-red hover:text-senoia-darkred inline-flex items-center"
                    >
                      <span>More Info</span>
                      <ArrowRight className="ml-1 w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
