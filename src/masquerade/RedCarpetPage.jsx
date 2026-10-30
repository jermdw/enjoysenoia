import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import './masquerade.css';
import { Suit } from './components/Ornament';
import {
  downloadUrl,
  fetchRedCarpetPhotos,
  requestRedCarpetLink,
  thumbUrl,
} from '../services/redCarpetService';

/**
 * Red Carpet photo downloads for Masquerade guests: /red-carpet on
 * thehalloweenmasquerade.com, /masquerade/red-carpet on enjoysenoia.com.
 *
 * Without a token it asks for the email the guest bought tickets with and
 * mails them a link (see functions/redCarpet.js). With ?t=<token> it shows
 * the whole Red Carpet set, and each photo downloads as the print file.
 * Private to link holders, so it is noindexed.
 */
export default function RedCarpetPage() {
  const [params] = useSearchParams();
  const token = params.get('t');
  const home = useLocation().pathname.startsWith('/masquerade') ? '/masquerade' : '/';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Red Carpet Photos | The Halloween Masquerade';
    const tag = document.createElement('meta');
    tag.name = 'robots';
    tag.content = 'noindex';
    document.head.appendChild(tag);
    const previousBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0b0a0c';
    return () => {
      document.title = previousTitle;
      tag.remove();
      document.body.style.backgroundColor = previousBg;
    };
  }, []);

  return (
    <div className="masq min-h-screen">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Link to={home} className="inline-flex items-center gap-2 text-sm text-[var(--masq-cream-dim)] hover:text-[var(--masq-gold)]">
          <ArrowLeft className="w-4 h-4" /> The Masquerade
        </Link>

        <div className="mt-10 text-center">
          <span className="masq-eyebrow">October 24, 2026</span>
          <h1 className="mt-4 text-4xl sm:text-5xl text-[var(--masq-cream)]">Red Carpet Photos</h1>
        </div>

        {token ? <Gallery token={token} /> : <RequestForm />}

        <div className="mt-16 flex items-center justify-center gap-4" aria-hidden="true">
          <Suit suit="heart" className="w-4 h-4 text-[var(--masq-crimson-bright)]" />
          <Suit suit="spade" className="w-4 h-4 text-[var(--masq-gold)]" />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--masq-cream-dim)]">
          Photographs © 2026{' '}
          <a href="https://www.melissaprosser.com/license" target="_blank" rel="noopener noreferrer" className="masq-link">
            Melissa Prosser Photography, LLC
          </a>
          . For personal use.
        </p>
      </main>
    </div>
  );
}

const inputClass =
  'w-full rounded-sm border border-[var(--masq-line)] bg-[var(--masq-ink-soft)] px-4 py-3 text-[var(--masq-cream)] placeholder:text-[var(--masq-cream-dim)] focus:outline-none focus:border-[var(--masq-gold)]';
const buttonClass =
  'inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-sm bg-[var(--masq-crimson)] hover:bg-[var(--masq-crimson-bright)] disabled:opacity-60 text-[var(--masq-cream)] text-xs font-semibold uppercase tracking-[0.25em] transition-colors';

function RequestForm({ notice }) {
  const openedAt = useRef(Date.now());
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState({ status: 'idle', error: null }); // idle | sending | sent

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'sending', error: null });
    try {
      await requestRedCarpetLink({ email, website, elapsedMs: Date.now() - openedAt.current });
      setState({ status: 'sent', error: null });
    } catch (err) {
      console.warn('Red Carpet link request failed:', err);
      const own = ['functions/invalid-argument', 'functions/resource-exhausted', 'functions/failed-precondition']
        .includes(err.code) && err.message;
      setState({ status: 'idle', error: own || 'Something went wrong. Please try again in a moment.' });
    }
  };

  if (state.status === 'sent') {
    return (
      <div className="mt-12 max-w-lg mx-auto text-center" role="status">
        <p className="text-xl text-[var(--masq-cream)]">Check your email.</p>
        <p className="mt-4 text-lg text-[var(--masq-cream-dim)] leading-relaxed">
          If <strong className="text-[var(--masq-cream)]">{email.trim()}</strong> bought tickets to the Masquerade,
          a link to the photos is on its way. It can take a few minutes; check spam too. Nothing after ten
          minutes? Try the address on your ticket confirmation, or write to{' '}
          <a href="mailto:info@enjoysenoia.com" className="masq-link">info@enjoysenoia.com</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-12 max-w-lg mx-auto text-center">
      {notice && <p className="mb-6 text-lg text-[var(--masq-gold)]">{notice}</p>}
      <p className="text-lg text-[var(--masq-cream-dim)] leading-relaxed">
        Download a full-resolution, print-ready copy of your Red Carpet photo. Enter the email you bought your
        tickets with and we'll send you a link.
      </p>
      <label htmlFor="rc-email" className="sr-only">Email address</label>
      <input
        id="rc-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`mt-8 ${inputClass}`}
      />
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {state.error && <p className="mt-4 text-sm text-[var(--masq-crimson-bright)]" role="alert">{state.error}</p>}
      <button type="submit" disabled={state.status === 'sending'} className={`mt-6 w-full sm:w-auto ${buttonClass}`}>
        {state.status === 'sending' ? 'Sending…' : 'Email me a link'}
      </button>
    </form>
  );
}

function Gallery({ token }) {
  const [state, setState] = useState({ status: 'loading', photos: [], expiresAt: null, error: null });

  useEffect(() => {
    let live = true;
    fetchRedCarpetPhotos(token)
      .then(({ photos, expiresAt }) => live && setState({ status: 'ready', photos, expiresAt, error: null }))
      .catch((err) => live && setState({ status: 'error', photos: [], expiresAt: null, error: err.status ?? 0 }));
    return () => {
      live = false;
    };
  }, [token]);

  if (state.status === 'loading') {
    return <p className="mt-12 text-center text-[var(--masq-cream-dim)]" role="status">Opening the photos…</p>;
  }
  if (state.status === 'error') {
    const notice = state.error === 410
      ? 'That link has expired. Ask for a new one below.'
      : state.error === 404
        ? "That link doesn't work. Ask for a new one below."
        : 'The photos could not be loaded. Try the link again, or ask for a new one below.';
    return <RequestForm notice={notice} />;
  }

  const until = new Date(state.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return (
    <>
      <p className="mt-6 max-w-2xl mx-auto text-center text-lg text-[var(--masq-cream-dim)] leading-relaxed">
        Find yours and tap <strong className="text-[var(--masq-cream)]">Download</strong> for the full-resolution
        file, ready to print. This link works until {until}.
      </p>
      <ul className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {state.photos.map((n) => (
          <li key={n} className="rounded-sm border border-[var(--masq-line)] bg-[var(--masq-ink-soft)] overflow-hidden">
            <img
              src={thumbUrl(token, n)}
              alt={`Red Carpet photo ${n}`}
              width="600"
              height="400"
              loading="lazy"
              decoding="async"
              className="w-full h-auto aspect-[3/2] object-cover"
            />
            <a
              href={downloadUrl(token, n)}
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--masq-cream-dim)] hover:text-[var(--masq-gold)]"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
