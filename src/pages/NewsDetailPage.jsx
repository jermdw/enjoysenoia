import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';
import SEO from '../components/common/SEO';
import NotFoundNotice from '../components/common/NotFoundNotice';
import { getNewsArticles } from '../services/dataService';

export default function NewsDetailPage() {
  const { slug } = useParams();
  // Only records that actually live at /news/<slug> can answer this route.
  const article = getNewsArticles().find(n => n.link === `/news/${slug}`);

  if (!article) {
    return (
      <NotFoundNotice
        title="Story not found"
        message="This story may have moved. Browse the newsroom for the latest from downtown Senoia."
        backTo="/news"
        backLabel="Back to News"
      />
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title={article?.title || 'News Story'}
        description={article?.summary || 'Senoia DDA announcement.'}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/news"
          className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-senoia-red transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          <span>Back to All News</span>
        </Link>

        <article className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-stone-200 space-y-8">
          <div className="space-y-4">
            {article?.date && (
              <div className="flex items-center space-x-2 text-xs font-semibold text-senoia-gold uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>{article.date}</span>
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 leading-tight">
              {article?.title}
            </h1>
          </div>

          {article?.image && (
            <div className="rounded-xl overflow-hidden aspect-[16/10] bg-stone-100 shadow-sm">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed text-base sm:text-lg space-y-4">
            <p className="font-medium text-stone-900 leading-relaxed">
              {article?.summary}
            </p>
            <p>
              The Senoia Downtown Development Authority continues its mission to support local economic development, enhance community life, and foster historic preservation throughout the town of Senoia.
            </p>
            <p>
              For more information about upcoming projects, board meetings, or downtown events, please visit the Welcome Center at 68 Main St or explore our public records in the Files & Downloads section.
            </p>
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-400">Published by Senoia DDA</span>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: article?.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Story link copied to clipboard!');
                }
              }}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
            >
              <Share2 className="mr-1.5 w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
