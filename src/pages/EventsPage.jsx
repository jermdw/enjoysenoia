import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Search, ArrowRight } from 'lucide-react';
import SEO from '../components/common/SEO';
import { getEvents, getEventSlug } from '../services/dataService';

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const allEvents = getEvents();

  const filteredEvents = allEvents.filter((evt) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'signature' && evt.category?.toLowerCase().includes('dda')) ||
      (activeFilter === 'community' && evt.category?.toLowerCase().includes('community')) ||
      (activeFilter === 'recurring' && evt.is_recurring);

    const matchesSearch =
      !searchQuery ||
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Events in Downtown Senoia"
        description="Discover upcoming community events, festivals, car shows, farmers markets, and porchfest in historic Senoia, Georgia."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Calendar className="w-4 h-4 text-senoia-gold" />
            <span>Community Calendar</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
            Events in Senoia
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Experience our vibrant small-town gatherings, signature festivals, car shows, and weekly markets.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl shadow-xs border border-stone-200">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'signature', label: 'DDA Signature' },
              { id: 'community', label: 'Community' },
              { id: 'recurring', label: 'Recurring' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeFilter === tab.id
                    ? 'bg-senoia-red text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-senoia-gold"
            />
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 space-y-3">
            <p className="text-lg font-serif font-bold text-stone-700">No events found</p>
            <p className="text-sm text-stone-500">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((evt, idx) => {
              const slug = getEventSlug(evt);
              return (
                <div
                  key={evt.title + idx}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-stone-200">
                    <img
                      src={evt.image || 'https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/6980f95eb898c8958cd58b4e_Senoia%E2%80%99s%20Memorial%20Day%20Celebration%20(1200%20x%20628%20px)%20(1200%20x%20628%20px)%20(5).jpg'}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/95 text-senoia-red shadow-xs border border-stone-100">
                        {evt.category || 'Event'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-medium text-stone-500">
                        <Clock className="w-3.5 h-3.5 text-senoia-gold shrink-0" />
                        <span>{evt.date_time}</span>
                      </div>

                      <h2 className="text-xl font-bold font-serif text-stone-900 group-hover:text-senoia-red transition-colors">
                        {evt.title}
                      </h2>

                      <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <Link
                        to={`/events/${slug}`}
                        className="inline-flex items-center text-xs font-semibold text-senoia-red hover:text-senoia-darkred"
                      >
                        <span>Details & Tickets</span>
                        <ArrowRight className="ml-1 w-3.5 h-3.5" />
                      </Link>
                      <span className="text-xs text-stone-400">Downtown Senoia</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
