import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, Globe, MapPin, ArrowLeft, Facebook, Instagram, Share2 } from 'lucide-react';
import SEO from '../components/common/SEO';
import { getBusinessBySlug, getBusinesses } from '../services/dataService';

export default function BusinessDetailPage() {
  const { slug } = useParams();
  const business = getBusinessBySlug(slug) || getBusinesses()[0];

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title={business?.name || 'Business Details'}
        description={`Contact information, hours, and details for ${business?.name} in historic downtown Senoia, GA.`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/downtown-businesses"
          className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-senoia-red transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          <span>Back to Merchant Directory</span>
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200">
          {/* Hero Media */}
          <div className="relative aspect-[21/9] sm:aspect-[2/1] w-full bg-stone-900 overflow-hidden">
            <img
              src={business?.image || 'https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/63c02a9715862f97c89838c5_Untitled%20(1200%20%C3%97%20628%20px)%20(16).webp'}
              alt={business?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-senoia-red uppercase tracking-wider shadow-sm">
                {business?.category || 'Downtown Business'}
              </span>
            </div>
          </div>

          {/* Business Info Header */}
          <div className="p-6 sm:p-10 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
                {business?.name}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-stone-500">
                <MapPin className="w-4 h-4 text-senoia-red shrink-0" />
                <span>Historic Downtown Senoia, GA 30276</span>
              </div>
            </div>

            {/* Quick Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
              {business?.phone && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-senoia-gold shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400 font-medium uppercase">Phone</p>
                    <a href={`tel:${business.phone}`} className="text-sm font-semibold text-stone-800 hover:text-senoia-red">
                      {business.phone}
                    </a>
                  </div>
                </div>
              )}

              {business?.email && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-senoia-gold shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400 font-medium uppercase">Email</p>
                    <a href={`mailto:${business.email}`} className="text-sm font-semibold text-stone-800 hover:text-senoia-red truncate block">
                      {business.email}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Outbound Links */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              {business?.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-sm font-semibold shadow-xs transition-colors"
                >
                  <Globe className="mr-2 w-4 h-4" />
                  <span>Visit Website</span>
                </a>
              )}

              {business?.facebook && (
                <a
                  href={business.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
                >
                  <Facebook className="mr-2 w-4 h-4 text-blue-600" />
                  <span>Facebook</span>
                </a>
              )}

              {business?.instagram && (
                <a
                  href={business.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
                >
                  <Instagram className="mr-2 w-4 h-4 text-pink-600" />
                  <span>Instagram</span>
                </a>
              )}

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: business?.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Business link copied to clipboard!');
                  }
                }}
                className="ml-auto p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
