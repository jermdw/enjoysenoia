import React, { useId, useRef, useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { LIMITS, sendContactMessage, validateContact } from '../services/contactService';

const EMPTY = { name: '', email: '', message: '', website: '' };

const inputClass = (invalid) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-senoia-red/40 ${
    invalid ? 'border-red-400' : 'border-stone-300'
  }`;

// What a visitor is told for each way the function can refuse them.
const FAILURE_MESSAGES = {
  'functions/resource-exhausted': 'You have sent several messages recently. Please try again in a little while.',
  'functions/failed-precondition': 'Please take a moment and press Send again.',
  'functions/unavailable': 'We could not send your message right now. Please email info@enjoysenoia.com instead.',
};

/**
 * Contact form. Spam protection is server-side (App Check reCAPTCHA token,
 * rate limit, honeypot, fill time) in functions/index.js; the hidden `website`
 * field and the elapsed-time value here are what it checks.
 */
export default function ContactPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [message, setMessage] = useState('');
  const openedAt = useRef(Date.now());
  const ids = useId();
  const field = (key) => `${ids}-${key}`;

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus('sending');
    setMessage('');
    try {
      await sendContactMessage({ ...values, elapsedMs: Date.now() - openedAt.current });
      setStatus('done');
      setValues(EMPTY);
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
        setStatus('idle');
        return;
      }
      console.warn('Contact message failed:', err);
      setStatus('error');
      setMessage(
        FAILURE_MESSAGES[err.code] ||
          'Something went wrong sending your message. Please try again, or email info@enjoysenoia.com.'
      );
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Contact Us"
        description="Send a message to the Senoia Downtown Development Authority and Welcome Center, or find our address, phone number, and hours."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
              <Mail className="w-4 h-4 text-senoia-gold" />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">Contact Us</h1>
            <p className="text-stone-600 text-base sm:text-lg">
              Send the Senoia DDA a message and we will get back to you. You may find a quicker
              answer in the <Link to="/faq" className="text-senoia-red font-medium hover:underline">FAQ</Link>.
            </p>
          </div>

          {status === 'done' ? (
            <div className="bg-white p-8 rounded-2xl shadow-xs border border-stone-200 space-y-3" role="status">
              <h2 className="text-xl font-bold font-serif text-stone-900">Thank you. Your message is on its way.</h2>
              <p className="text-stone-600 text-sm">
                Replies come from volunteers and part-time staff, so please allow a little time.
              </p>
              <button
                type="button"
                onClick={() => {
                  openedAt.current = Date.now();
                  setStatus('idle');
                }}
                className="text-sm font-semibold text-senoia-red hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-stone-200 space-y-5">
              <div className="space-y-1.5">
                <label htmlFor={field('name')} className="block text-sm font-semibold text-stone-800">Name</label>
                <input
                  id={field('name')}
                  type="text"
                  value={values.name}
                  onChange={update('name')}
                  autoComplete="name"
                  maxLength={LIMITS.nameMax}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? field('name-err') : undefined}
                  className={inputClass(errors.name)}
                />
                {errors.name && <p className="text-xs text-red-600" id={field('name-err')}>{errors.name}</p>}
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
                  aria-describedby={errors.email ? field('email-err') : undefined}
                  className={inputClass(errors.email)}
                />
                {errors.email && <p className="text-xs text-red-600" id={field('email-err')}>{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor={field('message')} className="block text-sm font-semibold text-stone-800">Message</label>
                <textarea
                  id={field('message')}
                  rows={6}
                  value={values.message}
                  onChange={update('message')}
                  maxLength={LIMITS.messageMax}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? field('message-err') : undefined}
                  className={inputClass(errors.message)}
                />
                {errors.message && <p className="text-xs text-red-600" id={field('message-err')}>{errors.message}</p>}
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
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                </button>
                <p className="text-xs text-stone-500">
                  Protected by Google reCAPTCHA. Your message is emailed to the Senoia DDA and used only to reply to you.
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

        <aside className="space-y-4">
          <div className="p-6 rounded-2xl bg-stone-900 text-stone-200 space-y-4 text-sm">
            <h2 className="text-lg font-bold font-serif text-white">Welcome Center</h2>
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-senoia-gold shrink-0 mt-0.5" />
              <span>68 Main St, Senoia, GA 30276</span>
            </div>
            <a href="tel:770-727-9173" className="flex items-center space-x-2.5 hover:text-white">
              <Phone className="w-4 h-4 text-senoia-gold shrink-0" />
              <span>(770) 727-9173</span>
            </a>
            <a href="mailto:info@enjoysenoia.com" className="flex items-center space-x-2.5 hover:text-white">
              <Mail className="w-4 h-4 text-senoia-gold shrink-0" />
              <span>info@enjoysenoia.com</span>
            </a>
            <div className="text-xs text-stone-400 pt-1">
              <p>Mon – Thu: 11:00 AM – 3:00 PM</p>
              <p>Fri &amp; Sat: 11:00 AM – 4:00 PM</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
