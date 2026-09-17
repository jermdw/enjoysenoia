import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, Phone, Mail, MapPin, ExternalLink, Utensils, ShoppingBag, Scissors, Stethoscope, Landmark } from 'lucide-react';
import SEO from '../components/common/SEO';
import { getBusinesses } from '../services/dataService';
import { fuzzyMatchAny } from '../utils/fuzzySearch';

const CATEGORY_MAP = [
  { id: 'all', label: 'All Businesses', icon: Building2 },
  { id: 'dining', label: 'Dining & Drinks', icon: Utensils, matches: ['food', 'drink', 'restaurant', 'cafe', 'brewery', 'pizza', 'pub'] },
  { id: 'shopping', label: 'Shopping & Retail', icon: ShoppingBag, matches: ['retail', 'boutique', 'furniture', 'apparel', 'book', 'florist'] },
  { id: 'services', label: 'Services & Salons', icon: Scissors, matches: ['services', 'salon', 'barber', 'spa', 'tattoo', 'realty', 'insurance'] },
  { id: 'health', label: 'Health & Medical', icon: Stethoscope, matches: ['health', 'medical', 'chiropractic', 'dentistry', 'psychiatric', 'care'] },
  { id: 'community', label: 'Civic & Historic', icon: Landmark, matches: ['church', 'museum', 'welcome', 'city', 'historical', 'society'] }
];

export default function BusinessesPage() {
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const businesses = getBusinesses();

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      // Category Match
      let matchesCat = true;
      if (selectedCat !== 'all') {
        const catConfig = CATEGORY_MAP.find(c => c.id === selectedCat);
        // Every record in the dataset is still categorised "General", so the
        // business name is also searched for the category's keywords. Filtering
        // stays approximate until the directory data carries real categories.
        const haystack = `${biz.category || ''} ${biz.name || ''}`.toLowerCase();
        matchesCat = catConfig?.matches.some(m => haystack.includes(m)) || false;
      }

      // Search match, forgiving small typos in the query.
      const q = searchQuery.trim();
      const matchesSearch = !q || fuzzyMatchAny([biz.name, biz.category, biz.address], q);

      return matchesCat && matchesSearch;
    });
  }, [businesses, selectedCat, searchQuery]);

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Downtown Senoia Business Directory"
        description="Explore dining, boutique shopping, professional services, salons, and medical providers in walkable historic downtown Senoia, GA."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Building2 className="w-4 h-4 text-senoia-gold" />
            <span>Merchant Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
            Downtown Senoia Businesses
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Support local! Stroll through our vibrant downtown for award-winning dining, unique boutiques, personal wellness, and professional services.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="space-y-4 bg-white p-5 rounded-2xl shadow-xs border border-stone-200">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name, keyword, or specialty..."
              className="w-full pl-12 pr-4 py-3 text-sm sm:text-base rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-senoia-gold"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {CATEGORY_MAP.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    selectedCat === cat.id
                      ? 'bg-senoia-red text-white shadow-xs scale-102'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 font-medium px-1">
          <span>Showing {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'}</span>
          {(selectedCat !== 'all' || searchQuery) && (
            <button
              onClick={() => { setSelectedCat('all'); setSearchQuery(''); }}
              className="text-senoia-red hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Directory Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 space-y-3">
            <p className="text-lg font-serif font-bold text-stone-700">No matching businesses found</p>
            <p className="text-sm text-stone-500">Try changing your search keywords or category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((biz) => (
              <div
                key={biz.slug || biz.name}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-lg transition-all duration-200"
              >
                {/* Image / Header */}
                <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                  <img
                    src={biz.image || 'https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/63c02a9715862f97c89838c5_Untitled%20(1200%20%C3%97%20628%20px)%20(16).webp'}
                    alt={biz.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/95 text-stone-800 shadow-xs border border-stone-200/50">
                      {biz.category || 'Downtown Business'}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold font-serif text-stone-900 group-hover:text-senoia-red transition-colors">
                      {biz.name}
                    </h3>

                    <div className="space-y-1.5 text-xs sm:text-sm text-stone-600">
                      {biz.phone && (
                        <a
                          href={`tel:${biz.phone}`}
                          className="flex items-center space-x-2 text-stone-600 hover:text-senoia-red transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-senoia-gold shrink-0" />
                          <span>{biz.phone}</span>
                        </a>
                      )}

                      {biz.email && (
                        <a
                          href={`mailto:${biz.email}`}
                          className="flex items-center space-x-2 text-stone-600 hover:text-senoia-red transition-colors truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-senoia-gold shrink-0" />
                          <span className="truncate">{biz.email}</span>
                        </a>
                      )}

                      <div className="flex items-center space-x-2 text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Downtown Senoia, GA 30276</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Links */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {biz.website ? (
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-senoia-red hover:text-senoia-darkred"
                      >
                        <span>Visit Website</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : biz.facebook ? (
                      <a
                        href={biz.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-senoia-red hover:text-senoia-darkred"
                      >
                        <span>Facebook Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400">Main Street District</span>
                    )}

                    <Link
                      to={`/downtown-business/${biz.slug}`}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-700 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
