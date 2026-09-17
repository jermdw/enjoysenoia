import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import SEO from '../components/common/SEO';
import { getNews, isNewsArticle } from '../services/dataService';

export default function NewsPage() {
  const newsItems = getNews();

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="News & Announcements"
        description="Latest news, announcements, event highlights, and merchant spotlights from the Senoia Downtown Development Authority."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Newspaper className="w-4 h-4 text-senoia-gold" />
            <span>Official Announcements</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
            Senoia DDA News
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Stay connected with the latest projects, merchant achievements, festival recaps, and community milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map((item, idx) => {
            // Legacy photo-gallery records live at /photo-galleries/..., so they
            // link to the media page instead of a news route that cannot exist.
            const isArticle = isNewsArticle(item);
            const slug = isArticle ? item.link.replace('/news/', '') : null;
            const target = isArticle ? `/news/${slug}` : '/media';
            return (
              <article
                key={item.title + idx}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
                  <img
                    src={item.image || 'https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/642d50f75fb1be63954a943c_main2.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {item.date && (
                      <div className="flex items-center space-x-1.5 text-xs text-stone-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-senoia-gold" />
                        <span>{item.date}</span>
                      </div>
                    )}
                    <h2 className="text-xl font-bold font-serif text-stone-900 group-hover:text-senoia-red transition-colors line-clamp-2">
                      {item.title}
                    </h2>
                    <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <Link
                      to={target}
                      className="inline-flex items-center text-xs font-semibold text-senoia-red hover:text-senoia-darkred"
                    >
                      <span>{isArticle ? 'Read Story' : 'View Gallery'}</span>
                      <ArrowRight className="ml-1 w-3.5 h-3.5" />
                    </Link>
                    <span className="text-xs text-stone-400">Senoia DDA</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
