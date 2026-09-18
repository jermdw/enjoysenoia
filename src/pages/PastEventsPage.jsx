import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import SEO from '../components/common/SEO';
import { getPastEvents } from '../services/dataService';
import { webflowAsset } from '../utils/webflowAsset';

export default function PastEventsPage() {
  const events = getPastEvents();

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Past Events & Recaps"
        description="Explore photo galleries and historical event recaps from previous celebrations in Senoia, GA."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          to="/events"
          className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-senoia-red transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          <span>Back to Upcoming Events</span>
        </Link>

        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Calendar className="w-4 h-4 text-senoia-gold" />
            <span>Event Archives</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
            Past Events & Photo Recaps
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Look back at memorable car shows, porchfests, parades, and downtown festivals from years past.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((evt, idx) => (
            <div
              key={evt.title + idx}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="relative aspect-video bg-stone-200 overflow-hidden">
                <img
                  src={evt.image || webflowAsset('site/6980f95eb898c8958cd58b4e_Senoia_s_Memorial_Day_Celebration__1200_x_628_px___1200_x_628_px___5_.jpg')}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    {evt.category || 'Annual Event'}
                  </span>
                  <h3 className="text-xl font-bold font-serif text-stone-900">
                    {evt.title}
                  </h3>
                  <p className="text-sm text-stone-600 line-clamp-3">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>Downtown Senoia</span>
                  <Link
                    to={evt.link || '/media'}
                    className="font-semibold text-senoia-red hover:text-senoia-darkred"
                  >
                    View Highlights
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
