import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HandHeart, Send } from 'lucide-react';
import SEO from '../components/common/SEO';
import { getEventBySlug } from '../services/dataService';
import { submitVolunteerSignup, watchVolunteerEvent } from '../services/volunteerService';

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', note: '', website: '' };

const inputClass = (invalid) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-senoia-red/40 ${
    invalid ? 'border-red-400' : 'border-stone-300'
  }`;

const FAILURE_MESSAGES = {
  'functions/resource-exhausted': 'Several sign-ups were sent from this connection recently. Please try again in a little while.',
  'functions/unavailable': 'We could not save your sign-up right now. Please email info@enjoysenoia.com instead.',
};

/**
 * Volunteer shift board for one event, at /volunteer/:eventSlug. Linked from
 * that event's page. Shifts and the open/close switch are staff-managed in the
 * admin portal (Volunteers tab). Spam protection is server-side in
 * functions/index.js; the hidden `website` field and the elapsed-time value are
 * what it checks.
 */
export default function VolunteerPage() {
  const { eventSlug } = useParams();
  const builtIn = getEventBySlug(eventSlug);
  const [event, setEvent] = useState(undefined); // undefined = loading, null = not set up
  const [shifts, setShifts] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setEvent(undefined);
    setShifts(null);
    setLoadError(false);
    return watchVolunteerEvent(eventSlug, {
      onEvent: setEvent,
      onShifts: setShifts,
      onError: (err) => {
        console.warn('Volunteer data failed to load:', err);
        setLoadError(true);
      },
    });
  }, [eventSlug]);

  const name = event?.name || builtIn?.title || 'Senoia Event';
  const closed = event !== undefined && (event === null || event.signupOpen !== true);

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO title={`Volunteer: ${name}`} description={`Sign up to volunteer for the ${name} in Senoia, GA. No account needed.`} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <HandHeart className="w-4 h-4 text-senoia-gold" />
            <span>Volunteer</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">{name}</h1>
          <p className="text-stone-600 text-base sm:text-lg">
            {event?.intro ||
              'Pick a shift below and sign up in seconds. No account needed; you will get a confirmation email with a link to cancel if your plans change.'}
          </p>
          {builtIn && (
            <p className="text-sm">
              <Link to={`/events/${builtIn.slug}`} className="font-medium text-senoia-red hover:text-senoia-darkred">
                Back to the event page
              </Link>
            </p>
          )}
        </div>

        {loadError ? (
          <p className="bg-white p-6 rounded-2xl border border-stone-200 text-sm text-red-600" role="alert">
            We could not load the shift list. Please refresh the page, or email{' '}
            <a className="underline" href="mailto:info@enjoysenoia.com">info@enjoysenoia.com</a>.
          </p>
        ) : event === undefined || shifts === null ? (
          <p className="text-center text-stone-500 py-12" aria-busy="true">Loading shifts…</p>
        ) : closed ? (
          <p className="bg-white p-6 rounded-2xl border border-stone-200 text-sm text-stone-600">
            Volunteer sign-up is not open right now. Questions? Email{' '}
            <a className="underline" href="mailto:info@enjoysenoia.com">info@enjoysenoia.com</a>.
          </p>
        ) : shifts.length === 0 ? (
          <p className="bg-white p-6 rounded-2xl border border-stone-200 text-sm text-stone-600">
            Shifts are still being finalized. Check back soon!
          </p>
        ) : (
          <ul className="space-y-3">
            {shifts.map((s) => (
              <ShiftRow key={s.id} shift={s} onSignUp={() => setSelected(s)} />
            ))}
          </ul>
        )}
      </div>

      {selected && <SignupModal eventSlug={eventSlug} eventName={name} shift={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ShiftRow({ shift, onSignUp }) {
  const remaining = shift.spotsTotal - (shift.spotsFilled ?? 0);
  const full = remaining <= 0;
  return (
    <li className="bg-white rounded-xl border border-stone-200 p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[12rem]">
        <p className="font-semibold text-stone-900">{shift.role}</p>
        <p className="text-stone-500 text-sm">{shift.time}</p>
        {shift.note && <p className="text-stone-500 text-xs mt-1">{shift.note}</p>}
      </div>
      <span
        className={`inline-block text-sm font-semibold rounded-full px-3 py-1 ${
          full ? 'bg-stone-200 text-stone-500' : 'bg-green-100 text-green-800'
        }`}
      >
        {full ? 'Full' : `${remaining} ${remaining === 1 ? 'spot' : 'spots'} left`}
      </span>
      <button
        type="button"
        onClick={onSignUp}
        disabled={full}
        className="px-5 py-2 rounded-lg bg-senoia-red hover:bg-senoia-darkred disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-semibold transition-colors"
      >
        Sign Up
      </button>
    </li>
  );
}

function SignupModal({ eventSlug, eventName, shift, onClose }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [message, setMessage] = useState('');
  const openedAt = useRef(Date.now());
  const ids = useId();
  const field = (key) => `${ids}-${key}`;

  // Closing mid-submit would hide the outcome of an in-flight sign-up.
  const safeClose = () => {
    if (status !== 'sending') onClose();
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') safeClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setMessage('');
    try {
      await submitVolunteerSignup({
        ...values,
        eventSlug,
        shiftId: shift.id,
        elapsedMs: Date.now() - openedAt.current,
      });
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
        return;
      }
      console.warn('Volunteer sign-up failed:', err);
      // The function words its own refusals (shift full, sign-ups closed) for visitors.
      const own = ['functions/failed-precondition', 'functions/not-found'].includes(err.code) && err.message;
      setMessage(
        own ||
          FAILURE_MESSAGES[err.code] ||
          'Something went wrong. Please try again, or email info@enjoysenoia.com.'
      );
    }
  };

  const fieldError = (key) =>
    errors[key] && <p className="text-xs text-red-600" id={field(`${key}-err`)}>{errors[key]}</p>;
  const described = (key) => (errors[key] ? field(`${key}-err`) : undefined);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={safeClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sign up: ${shift.role}`}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'done' ? (
          <div className="text-center space-y-3 py-2" role="status">
            <h2 className="text-xl font-bold font-serif text-stone-900">You are signed up. Thank you!</h2>
            <p className="text-stone-600 text-sm">
              {shift.role} &middot; {shift.time}
            </p>
            <p className="text-stone-500 text-sm">
              A confirmation is on its way to {values.email}. It includes a link if you need to cancel later.
            </p>
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-stone-900">{shift.role}</h2>
              <p className="text-stone-500 text-sm">
                {eventName} &middot; {shift.time}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor={field('firstName')} className="block text-sm font-semibold text-stone-800">First name</label>
                <input id={field('firstName')} autoFocus autoComplete="given-name" value={values.firstName} onChange={update('firstName')}
                  className={inputClass(errors.firstName)} aria-invalid={Boolean(errors.firstName)} aria-describedby={described('firstName')} />
                {fieldError('firstName')}
              </div>
              <div className="space-y-1">
                <label htmlFor={field('lastName')} className="block text-sm font-semibold text-stone-800">Last name</label>
                <input id={field('lastName')} autoComplete="family-name" value={values.lastName} onChange={update('lastName')}
                  className={inputClass(errors.lastName)} aria-invalid={Boolean(errors.lastName)} aria-describedby={described('lastName')} />
                {fieldError('lastName')}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor={field('email')} className="block text-sm font-semibold text-stone-800">Email</label>
              <input id={field('email')} type="email" autoComplete="email" value={values.email} onChange={update('email')}
                className={inputClass(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby={described('email')} />
              {fieldError('email')}
            </div>

            <div className="space-y-1">
              <label htmlFor={field('phone')} className="block text-sm font-semibold text-stone-800">Phone</label>
              <input id={field('phone')} type="tel" autoComplete="tel" value={values.phone} onChange={update('phone')}
                className={inputClass(errors.phone)} aria-invalid={Boolean(errors.phone)} aria-describedby={described('phone')} />
              {fieldError('phone')}
            </div>

            <div className="space-y-1">
              <label htmlFor={field('note')} className="block text-sm font-semibold text-stone-800">
                Anything we should know? <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <textarea id={field('note')} rows={2} value={values.note} onChange={update('note')}
                className={inputClass(errors.note)} aria-invalid={Boolean(errors.note)} aria-describedby={described('note')} />
              {fieldError('note')}
            </div>

            {/* Honeypot: people never see it. A bot that fills it is quietly dropped. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
              </label>
            </div>

            {message && <p className="text-sm text-red-600" role="alert">{message}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={safeClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={status === 'sending'}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-senoia-red hover:bg-senoia-darkred disabled:opacity-60 text-white text-sm font-semibold">
                <Send className="w-4 h-4" />
                {status === 'sending' ? 'Signing up…' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
