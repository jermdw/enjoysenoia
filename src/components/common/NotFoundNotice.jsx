import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import SEO from './SEO';

/**
 * Shown when a slug in the URL matches no record. Detail pages previously fell
 * back to the first item in the dataset, which served an unrelated business,
 * event, or story under the requested URL.
 */
export default function NotFoundNotice({ title, message, backTo, backLabel }) {
  return (
    <div className="py-16 sm:py-24 bg-stone-50 min-h-screen">
      <SEO title={title} description={message} />

      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-stone-200 text-stone-500 flex items-center justify-center mx-auto">
          <SearchX className="w-7 h-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">{title}</h1>
        <p className="text-stone-600">{message}</p>

        <Link
          to={backTo}
          className="inline-flex items-center px-6 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white font-semibold text-sm shadow-md transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          <span>{backLabel}</span>
        </Link>
      </div>
    </div>
  );
}
