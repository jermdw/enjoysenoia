import React from 'react';
import { Landmark, ExternalLink, Film, BookOpen, Clock } from 'lucide-react';
import SEO from '../components/common/SEO';

export default function SenoiaHistoryPage() {
  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="History of Senoia, Georgia"
        description="Explore the rich history, agricultural heritage, historic preservation, and cinematic legacy of Senoia, Georgia."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Landmark className="w-4 h-4 text-senoia-gold" />
            <span>Southern Heritage</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900 leading-tight">
            The History of Senoia
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            From rail crossroads and cotton farming to world-renowned film hub and award-winning historic town.
          </p>
        </div>

        {/* Narrative Card */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-stone-200 space-y-8 text-stone-700 leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif text-stone-900">
              Roots in Agriculture & Commerce
            </h2>
            <p>
              Incorporated in 1860, Senoia began as an agricultural community centered around cotton gins, peach orchards, and thriving railroads connecting Georgia commerce. Named after Senoya Hen-Hen-Ne-Hao, a Creek Indian princess, Senoia grew into a vibrant center for mercantile trades and craftsmanship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-stone-100 py-6">
            <div className="p-4 rounded-xl bg-stone-50 text-center space-y-1">
              <Clock className="w-6 h-6 text-senoia-red mx-auto" />
              <p className="font-bold text-stone-900 text-lg">1860</p>
              <p className="text-xs text-stone-500">Year Incorporated</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 text-center space-y-1">
              <BookOpen className="w-6 h-6 text-senoia-gold mx-auto" />
              <p className="font-bold text-stone-900 text-lg">100+ Homes</p>
              <p className="text-xs text-stone-500">Historic District Roster</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 text-center space-y-1">
              <Film className="w-6 h-6 text-senoia-red mx-auto" />
              <p className="font-bold text-stone-900 text-lg">25+ Productions</p>
              <p className="text-xs text-stone-500">Film & Television Hub</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif text-stone-900">
              Architectural Preservation & Film Heritage
            </h2>
            <p>
              Through deliberate stewardship and community commitment, Senoia preserved its historic Victorian, Queen Anne, and Craftsman architecture. In recent decades, this picturesque setting has attracted major film and television productions—most notably serving as the backdrop for AMC’s <em>The Walking Dead</em> (Woodbury and Alexandria), <em>Fried Green Tomatoes</em>, and <em>Driving Miss Daisy</em>.
            </p>
          </div>

          {/* Historical Society Link */}
          <div className="p-6 rounded-xl bg-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold font-serif text-lg text-white">Senoia Area Historical Society</h3>
              <p className="text-xs text-stone-300">
                Explore comprehensive museum exhibits, archives, and genealogical collections at the Senoia Area Historical Society.
              </p>
            </div>
            <a
              href="https://senoiahistory.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-senoia-gold text-stone-950 font-bold text-xs shadow-sm hover:brightness-110 shrink-0"
            >
              <span>Visit SAHS Website</span>
              <ExternalLink className="ml-1.5 w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
