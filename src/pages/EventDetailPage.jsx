import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, MapPin, ArrowLeft, Ticket, Share2, Sparkles } from 'lucide-react';
import SEO from '../components/common/SEO';
import NotFoundNotice from '../components/common/NotFoundNotice';
import { getEventBySlug } from '../services/dataService';
import { webflowAsset } from '../utils/webflowAsset';

export default function EventDetailPage() {
  const { slug } = useParams();
  const event = getEventBySlug(slug);

  if (!event) {
    return (
      <NotFoundNotice
        title="Event not found"
        message="This event may have ended or moved. Browse the calendar for what is coming up in downtown Senoia."
        backTo="/events"
        backLabel="Back to All Events"
      />
    );
  }

  // Events with their own site or box office set `ticket_url` in data/event_overrides.json.
  // The two legacy checks below stay until those entries carry the field too.
  const isCarShow = slug?.includes('car-show') || event?.title?.toLowerCase().includes('car show');
  const isPorchfest = slug?.includes('porchfest') || event?.title?.toLowerCase().includes('porchfest');

  let ticketUrl = event?.ticket_url || null;
  if (!ticketUrl && isCarShow) ticketUrl = 'https://senoiacar.show';
  if (!ticketUrl && isPorchfest) ticketUrl = 'https://senoiaporchfest.org';

  // A ticketed event must never fall through to the "free community event" badge.
  const isInternalTicketLink = Boolean(ticketUrl && ticketUrl.startsWith('/'));
  const ticketLabel = event?.ticket_label || 'Official Event & Ticket Website';

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title={event?.title || 'Event Details'}
        description={event?.description || 'Event details for historic Senoia, Georgia.'}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link
          to="/events"
          className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-senoia-red transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          <span>Back to All Events</span>
        </Link>

        {/* Hero Image */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl bg-stone-900">
          <img
            src={event?.image || webflowAsset('site/6980f95eb898c8958cd58b4e_Senoia_s_Memorial_Day_Celebration__1200_x_628_px___1200_x_628_px___5_.jpg')}
            alt={event?.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-senoia-red uppercase tracking-wider shadow-md">
              {event?.category || 'DDA Event'}
            </span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-stone-200 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
              {event?.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-stone-600 pt-2 border-y border-stone-100 py-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-senoia-gold" />
                <span>{event?.date_time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-senoia-red" />
                <span>{event?.location || 'Historic Downtown Senoia, GA'}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4">
            <p className="text-lg font-medium text-stone-800">
              {event?.description}
            </p>
            <p>
              Join the Senoia Downtown Development Authority and the local community for this event. Stroll down historic Main Street, visit our local shops and dining destinations, and enjoy the southern hospitality Senoia has to offer.
            </p>
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
            {ticketUrl ? (
              isInternalTicketLink ? (
                <Link
                  to={ticketUrl}
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white font-semibold text-sm shadow-md transition-all hover:scale-105"
                >
                  <Ticket className="mr-2 w-4 h-4" />
                  <span>{ticketLabel}</span>
                </Link>
              ) : (
                <a
                  href={ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white font-semibold text-sm shadow-md transition-all hover:scale-105"
                >
                  <Ticket className="mr-2 w-4 h-4" />
                  <span>{ticketLabel}</span>
                </a>
              )
            ) : (
              <div className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                <Sparkles className="w-4 h-4" />
                <span>Free Community Event – No Admission Fee</span>
              </div>
            )}

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: event?.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Event link copied to clipboard!');
                }
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
            >
              <Share2 className="mr-2 w-4 h-4" />
              <span>Share Event</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
