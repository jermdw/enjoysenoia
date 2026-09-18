import React from 'react';
import { Award, Heart, Mail, Flag } from 'lucide-react';
import SEO from '../components/common/SEO';

export default function VeteransMemorialPage() {
  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Senoia Veterans Memorial Project"
        description="Learn about the Senoia Veterans Memorial project, commemorative banners, and commemorative brick program honoring our nation's heroes."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Flag className="w-4 h-4 text-senoia-red" />
            <span>Honoring Our Heroes</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900 leading-tight">
            Senoia Veterans Memorial
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            A lasting tribute recognizing the courageous service and sacrifice of our United States Armed Forces veterans.
          </p>
        </div>

        {/* Feature Hero Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200">
          <div className="aspect-[21/9] bg-stone-900 overflow-hidden relative">
            <img
              src="https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/642d50f75fb1be63954a943c_main2.jpg"
              alt="Senoia Veterans Memorial Banners"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
              <span className="text-white text-lg font-serif font-bold drop-shadow">
                Commemorative Banners & Memorial Plaza
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-6 text-stone-700 leading-relaxed">
            <h2 className="text-2xl font-bold font-serif text-stone-900">
              Commemorative Banners Program
            </h2>
            <p>
              The Senoia Downtown Development Authority, in partnership with local civic leaders and veterans organizations, proudly presents commemorative street banners along Main Street and the downtown corridor honoring local veterans.
            </p>
            <p>
              Each banner features the veteran’s name, branch of service, conflict or era served, and photo. These banners are displayed prominently throughout downtown to celebrate Memorial Day, Independence Day, and Veterans Day.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-5 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                <Award className="w-5 h-5 text-senoia-gold" />
                <h3 className="font-bold text-stone-900 text-base">Banner Inquiries</h3>
                <p className="text-xs text-stone-600">
                  To sponsor a banner for a family member or local veteran, contact the Senoia DDA at the Welcome Center.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                <Heart className="w-5 h-5 text-senoia-red" />
                <h3 className="font-bold text-stone-900 text-base">Memorial Contributions</h3>
                <p className="text-xs text-stone-600">
                  Contributions directly support the continued beautification and expansion of the Senoia Veterans Memorial plaza.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
              <a
                href="mailto:info@enjoysenoia.com?subject=Senoia%20Veterans%20Memorial%20Inquiry"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-sm font-semibold shadow-xs transition-colors"
              >
                <Mail className="mr-2 w-4 h-4" />
                <span>Contact Memorial Committee</span>
              </a>
              <span className="text-xs text-stone-500">
                Senoia DDA • PO Box 310, Senoia, GA 30276
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
