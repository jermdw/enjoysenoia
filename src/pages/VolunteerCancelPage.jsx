import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { cancelVolunteerSignup } from '../services/volunteerService';

/**
 * Release a volunteer shift from the link in the confirmation email
 * (/volunteer-cancel?token=...). Private to the link holder: noindexed, kept
 * out of the sitemap and disallowed in robots.txt.
 */
export default function VolunteerCancelPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState({ status: 'idle', error: null }); // idle | sending | done

  useEffect(() => {
    const tag = document.createElement('meta');
    tag.name = 'robots';
    tag.content = 'noindex';
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  const confirm = async () => {
    setState({ status: 'sending', error: null });
    try {
      await cancelVolunteerSignup(token);
      setState({ status: 'done', error: null });
    } catch (err) {
      console.warn('Volunteer cancel failed:', err);
      const own = ['functions/not-found', 'functions/failed-precondition'].includes(err.code) && err.message;
      setState({
        status: 'idle',
        error: own || 'Something went wrong. Please try again, or email info@enjoysenoia.com.',
      });
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO title="Cancel a Volunteer Shift" description="Release a volunteer shift using the link from your confirmation email." />
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-4">
          {!token ? (
            <>
              <h1 className="text-xl font-bold font-serif text-stone-900">This link is incomplete</h1>
              <p className="text-stone-600 text-sm">
                Please use the link from your confirmation email, or write to{' '}
                <a className="underline" href="mailto:info@enjoysenoia.com">info@enjoysenoia.com</a>.
              </p>
            </>
          ) : state.status === 'done' ? (
            <>
              <h1 className="text-xl font-bold font-serif text-stone-900">Your shift was cancelled</h1>
              <p className="text-stone-600 text-sm">Your spot has been released. Thank you for letting us know.</p>
              <Link to="/events" className="inline-block text-sm font-semibold text-senoia-red hover:underline">
                Back to events
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold font-serif text-stone-900">Cancel your volunteer shift?</h1>
              <p className="text-stone-600 text-sm">This releases your spot so someone else can take it.</p>
              {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
              <button type="button" onClick={confirm} disabled={state.status === 'sending'}
                className="w-full px-6 py-3 rounded-lg bg-senoia-red hover:bg-senoia-darkred disabled:opacity-60 text-white text-sm font-semibold">
                {state.status === 'sending' ? 'Cancelling…' : 'Yes, cancel my shift'}
              </button>
              <Link to="/events" className="block text-sm text-stone-500 underline">Never mind, keep my shift</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
