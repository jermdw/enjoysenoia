import React from 'react';
import { Landmark, Calendar, Target, Shield, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

export default function AboutDDAPage() {
  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="About the Senoia Downtown Development Authority"
        description="Learn about the mission, board members, meeting schedule, and economic development initiatives of the Senoia DDA."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Landmark className="w-4 h-4 text-senoia-gold" />
            <span>Senoia Downtown Development Authority</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900 leading-tight">
            Revitalizing & Promoting Historic Senoia
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Dedicated to fostering a vibrant downtown economy while preserving our rich historical heritage.
          </p>
        </div>

        {/* Mission Card */}
        <div className="p-8 sm:p-10 rounded-2xl bg-white shadow-sm border border-stone-200 space-y-4">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-bold text-sm uppercase tracking-wider">
            <Target className="w-4 h-4 text-senoia-gold" />
            <span>Our Mission</span>
          </div>
          <blockquote className="text-xl sm:text-2xl font-serif text-stone-900 italic leading-relaxed border-l-4 border-senoia-gold pl-4 py-1">
            “The mission of the Senoia Downtown Development Authority is to revitalize, enhance, promote, and stimulate the economic development of Senoia while maintaining its historical integrity and charm.”
          </blockquote>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed pt-2">
            The DDA works in partnership with local merchants, property owners, city leadership, and community organizations to support public enhancements, foster small business vitality, and coordinate family-friendly downtown events.
          </p>
        </div>

        {/* Public Meetings & Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white shadow-sm border border-stone-200 space-y-3">
            <div className="flex items-center space-x-2.5 text-senoia-red font-bold text-sm uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-senoia-gold" />
              <span>Meeting Schedule</span>
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-900">Regular Monthly Meetings</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              The Senoia DDA meets on the <strong>3rd Monday of each month at 6:30 PM</strong> at Senoia City Hall. All meetings are open to the public.
            </p>
            <div className="pt-2">
              <Link
                to="/files-forms-and-downloads"
                className="inline-flex items-center text-xs font-semibold text-senoia-red hover:text-senoia-darkred"
              >
                <span>View Meeting Agendas & Minutes</span>
                <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white shadow-sm border border-stone-200 space-y-3">
            <div className="flex items-center space-x-2.5 text-senoia-red font-bold text-sm uppercase tracking-wider">
              <Shield className="w-4 h-4 text-senoia-gold" />
              <span>Welcome Center</span>
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-900">Visitor & Community Center</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Located at <strong>68 Main St</strong> in the heart of downtown. Staffed by helpful volunteers ready to provide visitor guides, walking tour maps, and event schedules.
            </p>
            <div className="pt-2 text-xs text-stone-500">
              <span>Phone: (770) 727-9173 | Email: welcome@enjoysenoia.com</span>
            </div>
          </div>
        </div>

        {/* Board & Contact Details */}
        <div className="p-8 sm:p-10 rounded-2xl bg-stone-900 text-white space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-serif text-white">Get in Touch with the DDA</h2>
            <p className="text-sm text-stone-300">
              Have questions about starting a business in Senoia, applying for a façade grant, or participating in downtown events?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <a href="mailto:info@enjoysenoia.com" className="p-4 rounded-xl bg-stone-800 hover:bg-stone-700 transition-colors flex items-center space-x-3 text-stone-200">
              <Mail className="w-5 h-5 text-senoia-gold shrink-0" />
              <div>
                <p className="text-xs text-stone-400 font-medium">General Inquiries</p>
                <p className="text-sm font-semibold">info@enjoysenoia.com</p>
              </div>
            </a>
            <a href="mailto:treasurer@enjoysenoia.com" className="p-4 rounded-xl bg-stone-800 hover:bg-stone-700 transition-colors flex items-center space-x-3 text-stone-200">
              <Landmark className="w-5 h-5 text-senoia-gold shrink-0" />
              <div>
                <p className="text-xs text-stone-400 font-medium">DDA Treasury</p>
                <p className="text-sm font-semibold">treasurer@enjoysenoia.com</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
