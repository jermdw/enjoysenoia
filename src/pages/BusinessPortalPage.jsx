import React from 'react';
import { Building2, FileCheck, DollarSign, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

export default function BusinessPortalPage() {
  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="DDA Business Portal"
        description="Resources, grants, permits, and support for downtown Senoia merchants, property owners, and prospective businesses."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Building2 className="w-4 h-4 text-senoia-gold" />
            <span>Merchant & Commercial Resources</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900 leading-tight">
            DDA Business Portal
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Guiding small business owners, prospective retailers, and downtown restaurateurs to succeed in Senoia.
          </p>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl bg-white shadow-xs border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-senoia-red/10 flex items-center justify-center text-senoia-red">
              <DollarSign className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-900">Façade Grants</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Matching grant funds available to eligible downtown commercial property owners and tenants for exterior renovations, signage, and historic restoration.
            </p>
            <Link
              to="/files-forms-and-downloads"
              className="inline-flex items-center text-xs font-semibold text-senoia-red hover:underline"
            >
              <span>Download Grant Application</span>
              <ArrowRight className="ml-1 w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-8 rounded-2xl bg-white shadow-xs border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-senoia-gold/15 flex items-center justify-center text-senoia-gold">
              <FileCheck className="w-6 h-6 text-stone-900" />
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-900">Permits & Guidelines</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Information on city zoning, historic district architectural review guidelines, sidewalk usage, and outdoor dining permits.
            </p>
            <Link
              to="/files-forms-and-downloads"
              className="inline-flex items-center text-xs font-semibold text-senoia-red hover:underline"
            >
              <span>Review DDA Guidelines</span>
              <ArrowRight className="ml-1 w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Contact Advisory Card */}
        <div className="p-8 sm:p-10 rounded-2xl bg-stone-900 text-white space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-serif text-white">Opening a Business in Senoia?</h2>
            <p className="text-sm text-stone-300">
              The Senoia DDA board is here to help connect you with commercial real estate listings, zoning guidance, and municipal resources.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-4">
            <a
              href="mailto:info@enjoysenoia.com?subject=New%20Business%20Inquiry%20Senoia"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-sm font-semibold shadow-xs transition-colors"
            >
              <Mail className="mr-2 w-4 h-4" />
              <span>Contact Business Liaison</span>
            </a>
            <Link
              to="/downtown-businesses"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition-colors"
            >
              <span>View Current Directory</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
