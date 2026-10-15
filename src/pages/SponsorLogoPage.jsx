import React, { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImageUp, Send } from 'lucide-react';
import SEO from '../components/common/SEO';
import {
  ACCEPTED_EXTENSIONS,
  LIMITS,
  MAX_BYTES,
  sendSponsorLogo,
  validateSponsorLogo,
} from '../services/sponsorLogoService';

const EMPTY = { sponsor: '', contactName: '', email: '', event: '', website: '' };

const inputClass = (invalid) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-senoia-red/40 ${
    invalid ? 'border-red-400' : 'border-stone-300'
  }`;

const FAILURE_MESSAGES = {
  'functions/resource-exhausted': 'Several logos were sent from this connection recently. Please try again in a little while.',
  'functions/failed-precondition': 'Please take a moment and press Send again.',
  'functions/unavailable': 'We could not save your logo right now. Please email it to info@enjoysenoia.com instead.',
};

/**
 * Sponsor logo upload, linked from the Ticket Tailor confirmation email
 * (optionally as /sponsor-logo?event=Senoia+Porchfest to prefill the event).
 * Spam protection is server-side in functions/index.js; the hidden `website`
 * field and the elapsed-time value here are what it checks. Not in the sitemap
 * and noindexed: it is for sponsors who were sent the link.
 */
export default function SponsorLogoPage() {
  const [params] = useSearchParams();
  const [values, setValues] = useState(() => ({ ...EMPTY, event: (params.get('event') || '').slice(0, LIMITS.eventMax) }));
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [message, setMessage] = useState('');
  const openedAt = useRef(Date.now());
  const fileInput = useRef(null);
  const ids = useId();
  const field = (key) => `${ids}-${key}`;

  useEffect(() => {
    const tag = document.createElement('meta');
    tag.name = 'robots';
    tag.content = 'noindex';
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateSponsorLogo(values, file);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus('sending');
    setMessage('');
    try {
      await sendSponsorLogo({ ...values, elapsedMs: Date.now() - openedAt.current }, file);
      setStatus('done');
      setValues((v) => ({ ...EMPTY, event: v.event }));
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
        setStatus('idle');
        return;
      }
      console.warn('Sponsor logo upload failed:', err);
      setStatus('error');
      setMessage(
        FAILURE_MESSAGES[err.code] ||
          'Something went wrong sending your logo. Please try again, or email it to info@enjoysenoia.com.'
      );
    }
  };

  const fieldError = (key) =>
    errors[key] && <p className="text-xs text-red-600" id={field(`${key}-err`)}>{errors[key]}</p>;
  const described = (key) => (errors[key] ? field(`${key}-err`) : undefined);

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Send Your Sponsor Logo"
        description="Sponsors of Senoia events can upload their logo here for use on event materials and social media."
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <ImageUp className="w-4 h-4 text-senoia-gold" />
            <span>Event Sponsors</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">Send Your Logo</h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Thank you for sponsoring a Senoia event. Upload your logo here and it goes straight to the
            team that builds our event materials and social posts. If you have sponsored with us before
            and your logo has not changed, there is no need to send it again.
          </p>
          <p className="text-stone-500 text-sm">
            Best: a transparent PNG or an SVG, PDF, EPS or AI vector file. Up to {Math.round(MAX_BYTES / 1024 / 1024)} MB.
          </p>
        </div>

        {status === 'done' ? (
          <div className="bg-white p-8 rounded-2xl shadow-xs border border-stone-200 space-y-3" role="status">
            <h2 className="text-xl font-bold font-serif text-stone-900">Thank you. We have your logo.</h2>
            <p className="text-stone-600 text-sm">
              We will reach out only if we have a question about the file.
            </p>
            <button
              type="button"
              onClick={() => {
                openedAt.current = Date.now();
                setStatus('idle');
              }}
              className="text-sm font-semibold text-senoia-red hover:underline"
            >
              Send another logo
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-stone-200 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor={field('sponsor')} className="block text-sm font-semibold text-stone-800">Business or sponsor name</label>
              <input
                id={field('sponsor')}
                type="text"
                value={values.sponsor}
                onChange={update('sponsor')}
                autoComplete="organization"
                maxLength={LIMITS.sponsorMax}
                aria-invalid={Boolean(errors.sponsor)}
                aria-describedby={described('sponsor')}
                className={inputClass(errors.sponsor)}
              />
              {fieldError('sponsor')}
            </div>

            <div className="space-y-1.5">
              <label htmlFor={field('event')} className="block text-sm font-semibold text-stone-800">
                Event you are sponsoring <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <input
                id={field('event')}
                type="text"
                value={values.event}
                onChange={update('event')}
                maxLength={LIMITS.eventMax}
                aria-invalid={Boolean(errors.event)}
                aria-describedby={described('event')}
                className={inputClass(errors.event)}
              />
              {fieldError('event')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor={field('contactName')} className="block text-sm font-semibold text-stone-800">
                  Your name <span className="font-normal text-stone-500">(optional)</span>
                </label>
                <input
                  id={field('contactName')}
                  type="text"
                  value={values.contactName}
                  onChange={update('contactName')}
                  autoComplete="name"
                  maxLength={LIMITS.nameMax}
                  aria-invalid={Boolean(errors.contactName)}
                  aria-describedby={described('contactName')}
                  className={inputClass(errors.contactName)}
                />
                {fieldError('contactName')}
              </div>
              <div className="space-y-1.5">
                <label htmlFor={field('email')} className="block text-sm font-semibold text-stone-800">Email address</label>
                <input
                  id={field('email')}
                  type="email"
                  value={values.email}
                  onChange={update('email')}
                  autoComplete="email"
                  maxLength={LIMITS.emailMax}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={described('email')}
                  className={inputClass(errors.email)}
                />
                {fieldError('email')}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={field('file')} className="block text-sm font-semibold text-stone-800">Logo file</label>
              <input
                ref={fileInput}
                id={field('file')}
                type="file"
                accept={ACCEPTED_EXTENSIONS.map((x) => `.${x}`).join(',')}
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setErrors((prev) => (prev.file ? { ...prev, file: undefined } : prev));
                }}
                aria-invalid={Boolean(errors.file)}
                aria-describedby={described('file')}
                className={`${inputClass(errors.file)} file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold`}
              />
              {fieldError('file')}
            </div>

            {/* Honeypot: off-screen and out of the tab order and the
                accessibility tree, so only a bot that fills every input
                touches it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor={field('website')}>Leave this field empty</label>
              <input
                id={field('website')}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={values.website}
                onChange={update('website')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center px-6 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred disabled:opacity-60 text-white text-sm font-semibold shadow-xs transition-colors"
              >
                <Send className="mr-2 w-4 h-4" />
                {status === 'sending' ? 'Uploading…' : 'Send logo'}
              </button>
              <p className="text-xs text-stone-500">
                Protected by Google reCAPTCHA. Your logo is used only for event materials and promotion.
              </p>
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5" role="alert">
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
