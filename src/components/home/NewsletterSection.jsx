import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function NewsletterSection() {
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
    setErrorMessage('');
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: email.trim().toLowerCase(),
        subscribedAt: serverTimestamp(),
        source: 'homepage_cta'
      });
      setStatus('success');
      setEmail('');
    } catch (err) {
      // Never report success for a subscription that was not stored — the
      // address would be missing from the admin export.
      console.warn('Newsletter subscription failed:', err);
      setStatus('error');
      setErrorMessage('We could not save your subscription. Please try again later.');
    }
  };

  return (
    <section className="py-16 bg-stone-900 text-white relative overflow-hidden">
      {/* Subtle background ornament */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-senoia-red/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 text-senoia-gold text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <Mail className="w-4 h-4" />
            <span>Monthly Newsletter</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
            Sign up for our newsletter
          </h2>

          <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
            Keep up with events, announcements, and news in downtown Senoia. Sent monthly. You can unsubscribe at any time.
          </p>

          {status === 'success' ? (
            <div className="p-6 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-center space-x-3 text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="font-medium text-base">Thank you for subscribing! You're all set.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Enter your email address..."
                className="w-full px-4 py-3.5 rounded-xl bg-stone-800/90 border border-stone-700 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-senoia-gold focus:border-transparent text-sm"
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white font-semibold text-sm shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center space-x-2"
              >
                <span>{status === 'loading' ? 'Subscribing...' : 'Sign-Up'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-center space-x-2 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
