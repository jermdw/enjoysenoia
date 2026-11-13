import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Car, ExternalLink, GlassWater, Mail, Ticket } from 'lucide-react';
import './christmas.css';
import bmwLogo from './assets/bmw-of-south-atlanta.png';
import { auction, sponsor } from './data/christmasDetails';
import {
  getAuctionBidder,
  isLotOpen,
  isToken,
  loadToken,
  minimumBid,
  placeAuctionBid,
  requestAuctionLink,
  saveToken,
  watchLots,
} from '../services/auctionService';

const money = (n) => `$${Number(n).toLocaleString('en-US')}`;
const closeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const formatClose = (lot) => (lot.closesAt?.toDate ? closeFormat.format(lot.closesAt.toDate()) : null);

/** The callable's own message for errors it raises on purpose; a generic one otherwise. */
const ownMessage = (err, fallback) =>
  ['functions/invalid-argument', 'functions/failed-precondition', 'functions/resource-exhausted',
    'functions/unauthenticated', 'functions/unavailable'].includes(err?.code) && err.message
    ? err.message
    : fallback;

/**
 * The Tour of Homes chauffeured BMW silent auction: /auction on
 * christmas.enjoysenoia.com, /christmas/auction on enjoysenoia.com.
 *
 * Anyone can see the cars and the current high bids (live from Firestore).
 * To bid, a ticket holder asks for a bidding link; the link's token is kept in
 * this browser and sent with each bid. See functions/auction.js.
 */
export default function AuctionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const home = pathname.startsWith('/christmas') ? '/christmas' : '/';

  // A ?t= link is stored and then dropped from the address bar, so a shared
  // screenshot or copied URL doesn't hand someone else the bidder's link.
  const [token, setToken] = useState(() => {
    const fromUrl = params.get('t');
    if (isToken(fromUrl)) {
      saveToken(fromUrl);
      return fromUrl;
    }
    return loadToken();
  });
  useEffect(() => {
    if (params.has('t')) navigate(pathname, { replace: true });
  }, [params, navigate, pathname]);

  const [lots, setLots] = useState({ status: 'loading', items: [] }); // loading | ready | error
  const [bidder, setBidder] = useState(null);
  const [linkNotice, setLinkNotice] = useState(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Chauffeured BMW Silent Auction | Christmas in Senoia';
    const previousBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#fbf6ec';
    return () => {
      document.title = previousTitle;
      document.body.style.backgroundColor = previousBg;
    };
  }, []);

  useEffect(
    () =>
      watchLots(
        (items) => setLots({ status: 'ready', items }),
        (err) => {
          console.warn('Could not load the auction:', err);
          setLots({ status: 'error', items: [] });
        }
      ),
    []
  );

  const refreshBidder = useCallback(async () => {
    if (!token) return;
    try {
      setBidder(await getAuctionBidder(token));
    } catch (err) {
      console.warn('Bidder lookup failed:', err);
      if (err?.code === 'functions/unauthenticated') {
        saveToken(null);
        setToken(null);
        setBidder(null);
        setLinkNotice(err.message);
      }
    }
  }, [token]);

  useEffect(() => {
    refreshBidder();
  }, [refreshBidder]);

  const notReady = lots.status === 'error' || (lots.status === 'ready' && lots.items.length === 0);

  const signOut = () => {
    saveToken(null);
    setToken(null);
    setBidder(null);
  };

  return (
    <div className="xmas">
      <header className="xmas-hero xmas-hero-compact">
        <div className="xmas-wrap">
          <Link to={home} className="xmas-back">
            <ArrowLeft size={16} aria-hidden="true" /> Christmas in Senoia
          </Link>
          <p className="xmas-eyebrow">{auction.eventLine}</p>
          <h1 className="xmas-display xmas-auction-title">Ride the Tour in a BMW</h1>
          <p className="xmas-tagline">{auction.tagline}</p>
          <div className="xmas-presented">
            <span className="xmas-presented-label">Cars courtesy of</span>
            <img src={bmwLogo} alt={sponsor.name} width="889" height="217" />
          </div>
        </div>
      </header>

      <main>
        <section className="xmas-section" aria-labelledby="auction-experience">
          <div className="xmas-wrap xmas-auction-intro">
            <h2 id="auction-experience" className="xmas-display">The Evening</h2>
            <ul className="xmas-perks">
              <li>
                <GlassWater size={22} aria-hidden="true" />
                <span>{auction.reception}</span>
              </li>
              <li>
                <Car size={22} aria-hidden="true" />
                <span>{auction.ride}</span>
              </li>
              <li>
                <Ticket size={22} aria-hidden="true" />
                <span>{auction.proceeds}</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="xmas-section xmas-band" aria-labelledby="auction-how">
          <div className="xmas-wrap">
            <h2 id="auction-how" className="xmas-display">How It Works</h2>
            <ol className="xmas-steps">
              {auction.steps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="xmas-center">
              <a className="xmas-btn xmas-btn-inline" href={auction.ticketsUrl} target="_blank" rel="noreferrer">
                Buy Tour of Homes tickets <ExternalLink size={16} aria-hidden="true" />
              </a>
            </p>
          </div>
        </section>

        <section className="xmas-section" aria-labelledby="auction-cars">
          <div className="xmas-wrap">
            <h2 id="auction-cars" className="xmas-display">The Cars</h2>
            {bidder && (
              <p className="xmas-bidder" role="status">
                Bidding as <strong>{bidder.name}</strong> ({bidder.email}).{' '}
                <button type="button" className="xmas-linkbtn" onClick={signOut}>
                  Not you?
                </button>
              </p>
            )}
            {lots.status === 'loading' && <p className="xmas-center" role="status">Loading the cars…</p>}
            {/* An error here is most likely the page going live before the
                rules that let it read the cars, so it says the same as no cars. */}
            {notReady && (
              <p className="xmas-center">
                Bidding opens soon. Get your Tour of Homes tickets now, and check back here for the cars.
              </p>
            )}
            <ul className="xmas-cards xmas-lots">
              {lots.items.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  token={bidder ? token : null}
                  mine={bidder?.bids?.[lot.id]}
                  onBid={refreshBidder}
                />
              ))}
            </ul>
          </div>
        </section>

        {!bidder && lots.status === 'ready' && lots.items.length > 0 && (
          <section className="xmas-section xmas-band" id="bidding-link" aria-labelledby="auction-link">
            <div className="xmas-wrap">
              <h2 id="auction-link" className="xmas-display">Get Your Bidding Link</h2>
              <LinkForm notice={linkNotice} />
            </div>
          </section>
        )}

        <section className="xmas-section xmas-fine" aria-labelledby="auction-terms">
          <div className="xmas-wrap">
            <h2 id="auction-terms" className="xmas-display">The Fine Print</h2>
            <ul>
              {auction.terms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p>
              Questions? <a href="mailto:info@enjoysenoia.com">info@enjoysenoia.com</a>
            </p>
          </div>
        </section>
      </main>

      <footer className="xmas-footer">
        <div className="xmas-wrap">
          <p>
            A{' '}
            <a href="https://www.enjoysenoia.com" target="_blank" rel="noreferrer">
              Senoia Downtown Development Authority
            </a>{' '}
            fundraiser
          </p>
        </div>
      </footer>
    </div>
  );
}

function LotCard({ lot, token, mine, onBid }) {
  const open = isLotOpen(lot);
  const min = minimumBid(lot);
  const closes = formatClose(lot);
  const hasBids = typeof lot.highBid === 'number';
  const leading = mine?.leading && mine.amount === lot.highBid;

  return (
    <li className="xmas-card xmas-lot">
      {lot.image && <img className="xmas-lot-img" src={lot.image} alt="" loading="lazy" decoding="async" />}
      <h3 className="xmas-display">{lot.title}</h3>
      {lot.subtitle && <p className="xmas-when">{lot.subtitle}</p>}
      {lot.description && <p className="xmas-lot-desc">{lot.description}</p>}

      <dl className="xmas-lot-stats">
        <div>
          <dt>{hasBids ? 'Current bid' : 'Opening bid'}</dt>
          <dd>{money(hasBids ? lot.highBid : lot.openingBid)}</dd>
        </div>
        <div>
          <dt>Bids</dt>
          <dd>{lot.bidCount ?? 0}</dd>
        </div>
      </dl>

      {mine && (
        <p className={`xmas-standing ${leading ? 'is-leading' : 'is-outbid'}`} role="status">
          {leading ? "You're the high bidder." : `You've been outbid. Your best bid: ${money(mine.amount)}.`}
        </p>
      )}

      {open ? (
        <>
          {closes && <p className="xmas-closes">Bidding closes {closes}</p>}
          {token ? (
            leading ? null : <BidForm lot={lot} min={min} token={token} onBid={onBid} />
          ) : (
            <a className="xmas-btn" href="#bidding-link">
              Get your bidding link to bid
            </a>
          )}
        </>
      ) : (
        <p className="xmas-closes">
          {lot.closesAt?.toMillis && Date.now() >= lot.closesAt.toMillis()
            ? 'Bidding has closed.'
            : 'Bidding opens soon.'}
        </p>
      )}
    </li>
  );
}

function BidForm({ lot, min, token, onBid }) {
  const [amount, setAmount] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState({ status: 'idle', message: null }); // idle | sending | done
  const value = Number(amount);
  const valid = Number.isInteger(value) && value >= min;

  // The minimum moves as others bid; a typed amount below it is flagged.
  useEffect(() => setConfirming(false), [min]);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setState({ status: 'sending', message: null });
    try {
      await placeAuctionBid(token, lot.id, value);
      setState({ status: 'done', message: `Your ${money(value)} bid is in. We've emailed you a confirmation.` });
      setAmount('');
      setConfirming(false);
      onBid();
    } catch (err) {
      console.warn('Bid failed:', err);
      setConfirming(false);
      setState({ status: 'idle', message: ownMessage(err, 'Your bid did not go through. Please try again.') });
    }
  };

  const id = `bid-${lot.id}`;
  return (
    <form className="xmas-bid" onSubmit={submit}>
      <label htmlFor={id}>Your bid (at least {money(min)})</label>
      <div className="xmas-bid-row">
        <span aria-hidden="true">$</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          step="1"
          placeholder={String(min)}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setConfirming(false);
          }}
          disabled={state.status === 'sending'}
        />
      </div>
      {amount !== '' && !valid && <p className="xmas-bid-error">Bids on this car start at {money(min)}, in whole dollars.</p>}
      {confirming && (
        <p className="xmas-bid-confirm">
          Bid {money(value)} on {lot.title}? A bid is a promise to pay if you win.
        </p>
      )}
      <div className="xmas-bid-actions">
        <button type="submit" className="xmas-btn" disabled={!valid || state.status === 'sending'}>
          {state.status === 'sending' ? 'Placing bid…' : confirming ? `Confirm ${money(value)} bid` : 'Place bid'}
        </button>
        {confirming && (
          <button type="button" className="xmas-linkbtn" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        )}
      </div>
      {state.message && (
        <p className={state.status === 'done' ? 'xmas-bid-ok' : 'xmas-bid-error'} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

function LinkForm({ notice }) {
  const openedAt = useRef(Date.now());
  const [fields, setFields] = useState({ name: '', email: '', phone: '', website: '' });
  const [state, setState] = useState({ status: 'idle', error: null, fieldErrors: {} }); // idle | sending | sent
  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'sending', error: null, fieldErrors: {} });
    try {
      await requestAuctionLink({ ...fields, elapsedMs: Date.now() - openedAt.current });
      setState({ status: 'sent', error: null, fieldErrors: {} });
    } catch (err) {
      console.warn('Auction link request failed:', err);
      setState({
        status: 'idle',
        error: ownMessage(err, 'Something went wrong. Please try again in a moment.'),
        fieldErrors: err?.details?.fields || {},
      });
    }
  };

  if (state.status === 'sent') {
    return (
      <div className="xmas-linkform xmas-center" role="status">
        <Mail size={28} aria-hidden="true" />
        <p className="xmas-sent-head">Check your email.</p>
        <p>
          We're checking <strong>{fields.email.trim()}</strong> against Tour of Homes ticket orders. If we find yours,
          your bidding link is on its way. If not, we'll email you what to do next. It can take a few minutes, so check
          spam too.
        </p>
      </div>
    );
  }

  const fe = state.fieldErrors;
  return (
    <form className="xmas-linkform" onSubmit={submit} noValidate>
      {notice && <p className="xmas-bid-error" role="alert">{notice}</p>}
      <p>
        Use the email address you bought your Tour of Homes tickets with. We'll check it with our ticket system and email
        you a link to bid.
      </p>
      <label htmlFor="al-name">Name</label>
      <input id="al-name" autoComplete="name" required value={fields.name} onChange={set('name')} />
      {fe.name && <p className="xmas-bid-error">{fe.name}</p>}
      <label htmlFor="al-email">Email you bought tickets with</label>
      <input id="al-email" type="email" autoComplete="email" required value={fields.email} onChange={set('email')} />
      {fe.email && <p className="xmas-bid-error">{fe.email}</p>}
      <label htmlFor="al-phone">Mobile phone</label>
      <input id="al-phone" type="tel" autoComplete="tel" required value={fields.phone} onChange={set('phone')} />
      {fe.phone && <p className="xmas-bid-error">{fe.phone}</p>}
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div hidden aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={fields.website} onChange={set('website')} />
      </div>
      {state.error && <p className="xmas-bid-error" role="alert">{state.error}</p>}
      <button type="submit" className="xmas-btn" disabled={state.status === 'sending'}>
        {state.status === 'sending' ? 'Checking…' : 'Email me a bidding link'}
      </button>
    </form>
  );
}
