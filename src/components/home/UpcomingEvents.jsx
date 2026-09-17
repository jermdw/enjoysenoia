import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { getEvents, getEventSlug } from '../../services/dataService';

export default function UpcomingEvents() {
  const allEvents = getEvents();
  // Filter for upcoming / signature non-recurring events
  const upcomingEvents = allEvents.filter(e => !e.is_recurring).slice(0, 4);

  return (
    <section id="events" className="py-16 lg:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
              <Calendar className="w-4 h-4 text-senoia-gold" />
              <span>Community & DDA Gatherings</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
              Upcoming Events
            </h2>
            <p className="text-stone-600 text-base sm:text-lg">
              Join us for seasonal festivals, music, car shows, and community celebrations in historic Senoia.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/events"
              className="inline-flex items-center text-sm font-semibold text-senoia-red hover:text-senoia-darkred group"
            >
              <span>View All Events</span>
              <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {upcomingEvents.map((evt, idx) => {
            const slug = getEventSlug(evt);
            return (
              <div 
                key={evt.title + idx}
                className="group flex flex-col bg-stone-50 rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Event Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-stone-200">
                  <img
                    src={evt.image || 'https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/6980f95eb898c8958cd58b4e_Senoia%E2%80%99s%20Memorial%20Day%20Celebration%20(1200%20x%20628%20px)%20(1200%20x%20628%20px)%20(5).jpg'}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-md text-senoia-red shadow-xs border border-stone-100">
                      {evt.category || 'DDA Event'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-stone-500">
                      <Clock className="w-3.5 h-3.5 text-senoia-gold shrink-0" />
                      <span>{evt.date_time || 'Check details for schedule'}</span>
                    </div>

                    <h3 className="text-lg font-bold font-serif text-stone-900 group-hover:text-senoia-red transition-colors line-clamp-2">
                      {evt.title}
                    </h3>

                    <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                    <Link
                      to={`/events/${slug}`}
                      className="inline-flex items-center text-xs font-semibold text-senoia-red group-hover:text-senoia-darkred"
                    >
                      <span>Event Details</span>
                      <ArrowRight className="ml-1 w-3.5 h-3.5" />
                    </Link>
                    <span className="text-xs text-stone-400">Downtown Senoia</span>
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
