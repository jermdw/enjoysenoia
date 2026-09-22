import React, { useId, useState } from 'react';
import { decoratingContest } from '../data/halloweenDetails';
import { submitSignup, validateSignup } from '../../services/halloweenService';

const EMPTY = { name: '', address: '', email: '', category: 'residential' };

/**
 * Decorating contest sign-up.
 *
 * Writes to `halloween_signups`, which is create-only for the public: this form
 * cannot read back what it or anyone else submitted. A residential entry is not
 * on the map until an admin publishes the address (and only the address) to
 * `halloween_map_points`. See src/services/halloweenService.js.
 *
 * HEADS UP: this needs a Firestore database to exist in the project. One does
 * not yet — see README-halloween.md. Until then every submit lands in the error
 * branch, which is the honest outcome; it must never report success for an
 * entry that was not stored.
 */
export default function SignupForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | saving | done | error
  const [message, setMessage] = useState('');
  const ids = useId();

  const field = (key) => `${ids}-${key}`;

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    // Clear a field's error as soon as it is edited, not on the next submit.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateSignup(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus('saving');
    setMessage('');
    try {
      await submitSignup(values);
      setStatus('done');
      setValues(EMPTY);
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
        setStatus('idle');
        return;
      }
      console.warn('Halloween sign-up failed:', err);
      setStatus('error');
      setMessage('We could not save your entry. Please try again later.');
    }
  };

  if (status === 'done') {
    return (
      <div className="hallo-card" role="status">
        <h3>You&rsquo;re on the list.</h3>
        <p>
          Thanks for signing up. Residential entries are added to the trick-or-treat
          map once an organizer reviews them.
        </p>
        <button type="button" className="hallo-btn hallo-btn-ghost" onClick={() => setStatus('idle')}>
          Sign up another address
        </button>
      </div>
    );
  }

  return (
    <form className="hallo-card hallo-form" onSubmit={onSubmit} noValidate>
      <div className="hallo-form-row">
        <label htmlFor={field('name')}>Name</label>
        <input
          id={field('name')}
          type="text"
          value={values.name}
          onChange={update('name')}
          autoComplete="name"
          maxLength={120}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? field('name-err') : undefined}
        />
        {errors.name && <p className="hallo-error" id={field('name-err')}>{errors.name}</p>}
      </div>

      <div className="hallo-form-row">
        <label htmlFor={field('address')}>Address</label>
        <input
          id={field('address')}
          type="text"
          value={values.address}
          onChange={update('address')}
          autoComplete="street-address"
          maxLength={200}
          aria-invalid={Boolean(errors.address)}
          aria-describedby={`${field('address-note')}${errors.address ? ` ${field('address-err')}` : ''}`}
        />
        <p className="hallo-field-note" id={field('address-note')}>
          {decoratingContest.addressNote}
        </p>
        {errors.address && <p className="hallo-error" id={field('address-err')}>{errors.address}</p>}
      </div>

      <div className="hallo-form-row">
        <label htmlFor={field('email')}>Email address</label>
        <input
          id={field('email')}
          type="email"
          value={values.email}
          onChange={update('email')}
          autoComplete="email"
          maxLength={254}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? field('email-err') : undefined}
        />
        {errors.email && <p className="hallo-error" id={field('email-err')}>{errors.email}</p>}
      </div>

      <fieldset className="hallo-form-row hallo-fieldset">
        <legend>This entry is a&hellip;</legend>
        {decoratingContest.categories.map((cat) => (
          <label key={cat.id} className="hallo-radio">
            <input
              type="radio"
              name={field('category')}
              value={cat.id}
              checked={values.category === cat.id}
              onChange={update('category')}
            />
            <span>
              <strong>{cat.label}</strong>
              <span className="hallo-field-note">{cat.hint}</span>
            </span>
          </label>
        ))}
        {errors.category && <p className="hallo-error">{errors.category}</p>}
      </fieldset>

      {/* The brief does not include a disclosure, but residential addresses are
          published on a public map — entrants are told before they submit. */}
      <p className="hallo-field-note hallo-privacy">{decoratingContest.privacyNote}</p>

      <button type="submit" className="hallo-btn" disabled={status === 'saving'}>
        {status === 'saving' ? 'Sending…' : 'Sign up'}
      </button>

      {status === 'error' && <p className="hallo-error" role="alert">{message}</p>}
    </form>
  );
}
