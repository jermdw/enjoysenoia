import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Suit } from './Ornament';

/**
 * Email capture for announcements and for tiers that sell out. Mirrors the
 * pattern in components/home/NewsletterSection.jsx, writing to the same
 * `newsletter_subscribers` collection with a masquerade source tag so the DDA
 * list stays in one place and these signups can still be filtered out.
 */
export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: email.trim().toLowerCase(),
        subscribedAt: serverTimestamp(),
        source: 'masquerade_2026',
      });
      setStatus('success');
      setEmail('');
    } catch (err) {
      console.warn('Masquerade signup failed:', err);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again, or write to us directly.');
    }
  };

  return (
    <section id="waitlist" className="py-24 sm:py-28 bg-[var(--masq-ink)] scroll-mt-16 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 50% 120%, rgba(216, 205, 182, 0.12), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <Suit suit="club" className="w-5 h-5 mx-auto text-[var(--masq-bone)]" />
        <h2 className="mt-6 text-3xl sm:text-4xl text-[var(--masq-cream)]">Keep an Ear to the Ground</h2>
        <p className="mt-4 text-lg text-[var(--masq-cream-dim)] leading-relaxed">
          Be first to hear when tickets open, when a tier sells out and a waitlist place
          comes free, and what Wonderland becomes next year.
        </p>

        {status === 'success' ? (
          <div className="mt-9 p-6 border border-[var(--masq-bone)] rounded-sm flex items-center justify-center gap-3 text-[var(--masq-cream)]">
            <CheckCircle2 className="w-5 h-5 text-[var(--masq-bone)] shrink-0" />
            <span>You are on the list. Watch for an invitation.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-9 flex flex-col sm:flex-row gap-3">
            <label htmlFor="masq-email" className="sr-only">
              Email address
            </label>
            <input
              id="masq-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder="your@email.com"
              required
              className="flex-grow px-5 py-3.5 rounded-sm bg-[var(--masq-ink-soft)] border border-[var(--masq-line)] text-[var(--masq-cream)] placeholder-[rgba(181,173,156,0.65)] focus:outline-none focus:border-[var(--masq-bone)] transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-3.5 rounded-sm masq-btn-solid disabled:opacity-60 text-xs font-semibold uppercase tracking-[0.2em] transition-colors inline-flex items-center justify-center gap-2 shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span>{status === 'loading' ? 'Sending…' : 'Join the list'}</span>
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-4 flex items-center justify-center gap-2 text-[var(--masq-warning)]">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    </section>
  );
}
