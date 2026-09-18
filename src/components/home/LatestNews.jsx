import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { getNews } from '../../services/dataService';
import { webflowAsset } from '../../utils/webflowAsset';

export default function LatestNews() {
  const newsItems = getNews().slice(0, 3);

  return (
    <section id="news" className="py-16 lg:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
              <Newspaper className="w-4 h-4 text-senoia-gold" />
              <span>Stories & Updates</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
              Senoia DDA News
            </h2>
            <p className="text-stone-600 text-base sm:text-lg">
              Stay informed on downtown enhancements, community accomplishments, and merchant highlights.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/news"
              className="inline-flex items-center text-sm font-semibold text-senoia-red hover:text-senoia-darkred group"
            >
              <span>View All News</span>
              <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsItems.map((item, idx) => (
            <article 
              key={item.title + idx}
              className="group flex flex-col bg-stone-50 rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-lg transition-all duration-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-200">
                <img
                  src={item.image || webflowAsset('site/642d50f75fb1be63954a943c_main2.jpg')}
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
                  <h3 className="text-lg font-bold font-serif text-stone-900 group-hover:text-senoia-red transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200/60">
                  <Link
                    to={item.link || '/news'}
                    className="inline-flex items-center text-xs font-semibold text-senoia-red group-hover:text-senoia-darkred"
                  >
                    <span>Read Full Story</span>
                    <ArrowRight className="ml-1 w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
