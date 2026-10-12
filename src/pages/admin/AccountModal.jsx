import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, X, CheckCircle2 } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

const MIN_LENGTH = 8;

function messageFor(code) {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Your current password was not correct.';
    case 'auth/weak-password':
      return `Choose a stronger password (at least ${MIN_LENGTH} characters).`;
    case 'auth/requires-recent-login':
      return 'For security, please log out, sign in again, and then change your password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection and try again.';
    default:
      return 'Your password could not be changed right now. Please try again.';
  }
}

export default function AccountModal({ email, onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const firstField = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus the first field on open, close on Escape, and hand focus back.
  useEffect(() => {
    const returnTo = document.activeElement;
    firstField.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnTo?.focus?.();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDone(false);

    if (next.length < MIN_LENGTH) {
      setError(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError('The new password and confirmation do not match.');
      return;
    }
    if (next === current) {
      setError('Choose a new password that is different from your current one.');
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) {
      setError('You are no longer signed in. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
      await updatePassword(user, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      // Log only the error code, never any password material.
      console.warn('Password change failed:', err?.code);
      setError(messageFor(err?.code));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-senoia-gold';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-stone-200 p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-senoia-red/10 flex items-center justify-center text-senoia-red">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 id="account-title" className="text-xl font-bold font-serif text-stone-900">Your account</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <dl className="text-xs text-stone-600 space-y-1">
          <div className="flex gap-2"><dt className="font-semibold text-stone-700">Signed in as</dt><dd>{email}</dd></div>
          <div className="flex gap-2"><dt className="font-semibold text-stone-700">Access</dt><dd>Administrator</dd></div>
        </dl>

        <div aria-live="polite" role="status">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {error}
            </div>
          )}
          {done && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Your password has been changed.</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm font-semibold text-stone-800">Change password</p>
          <div>
            <label htmlFor="current-password" className="block text-xs font-semibold text-stone-700 mb-1">Current password</label>
            <input
              id="current-password" ref={firstField} type="password" autoComplete="current-password"
              value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} required
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold text-stone-700 mb-1">New password</label>
            <input
              id="new-password" type="password" autoComplete="new-password" minLength={MIN_LENGTH}
              value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} required
            />
            <p className="mt-1 text-[11px] text-stone-500">At least {MIN_LENGTH} characters.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-stone-700 mb-1">Confirm new password</label>
            <input
              id="confirm-password" type="password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred disabled:opacity-60 text-white text-sm font-semibold shadow-md transition-all"
          >
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
