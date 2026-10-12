import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import SEO from '../components/common/SEO';
import { auth } from '../services/firebase';
import { ADMIN_SUPPORT_EMAIL, isAuthorizedAdmin } from '../services/adminAccess';

const RESET_COOLDOWN_SECONDS = 30;
const RESET_NEUTRAL_MESSAGE =
  'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(
    searchParams.get('denied') ? 'That account is not authorized for the admin portal.' : ''
  );
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // 'login' or 'reset' (forgot password); both share the same card and email field.
  const [mode, setMode] = useState('login');
  const [cooldown, setCooldown] = useState(0);
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const resetMode = mode === 'reset';

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
    setTimeout(() => emailRef.current?.focus(), 0);
  };

  // Accounts live in Firebase Authentication. The portal has no credentials of
  // its own, and Firestore rules decide what an account may write.
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

      // A valid account is not automatically an administrator.
      if (!(await isAuthorizedAdmin(credential.user))) {
        await signOut(auth).catch(() => {});
        setError('That account is not authorized for the admin portal.');
        return;
      }

      navigate('/admin/dashboard');
    } catch (err) {
      console.warn('Admin sign-in failed:', err?.code);
      setError(
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found'
          ? 'That email and password combination was not recognized.'
          : 'Sign-in is unavailable right now. Please try again in a moment.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Always the same neutral outcome, so the form cannot be used to discover
  // which addresses have accounts.
  const handleReset = async (e) => {
    e.preventDefault();
    if (submitting || cooldown > 0) return;
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(RESET_NEUTRAL_MESSAGE);
      setCooldown(RESET_COOLDOWN_SECONDS);
    } catch (err) {
      console.warn('Password reset request failed:', err?.code);
      if (err?.code === 'auth/user-not-found') {
        setNotice(RESET_NEUTRAL_MESSAGE);
        setCooldown(RESET_COOLDOWN_SECONDS);
      } else if (err?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err?.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes and try again.');
        setCooldown(RESET_COOLDOWN_SECONDS);
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Network problem. Check your connection and try again.');
      } else {
        setError('We could not send the reset email right now. Please try again shortly.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  let submitLabel = 'Log In to Dashboard';
  if (resetMode) {
    if (submitting) submitLabel = 'Sending…';
    else if (cooldown > 0) submitLabel = `Link sent (resend in ${cooldown}s)`;
    else submitLabel = 'Send Reset Link';
  } else if (submitting) {
    submitLabel = 'Signing in…';
  }

  return (
    <div className="py-16 sm:py-24 bg-stone-100 min-h-screen flex items-center justify-center">
      <SEO
        title="EnjoySenoia Admin Portal"
        description="Content administration portal for EnjoySenoia."
      />

      <div className="max-w-md w-full mx-4 bg-white p-8 sm:p-10 rounded-3xl shadow-lg border border-stone-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-senoia-red/10 flex items-center justify-center text-senoia-red mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            EnjoySenoia Admin Portal
          </h1>
          <p className="text-xs text-stone-500">
            {resetMode
              ? 'Enter your email and we will send you a link to reset your password.'
              : 'Authorized content management for Senoia DDA board & staff'}
          </p>
        </div>

        <div aria-live="polite" role="status">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {error}
            </div>
          )}
          {notice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
              {notice}
            </div>
          )}
        </div>

        <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="admin-email"
                ref={emailRef}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@enjoysenoia.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-senoia-gold"
                required
              />
            </div>
          </div>

          {!resetMode && (
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-stone-700 mb-1">
                Password / Access Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-senoia-gold"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (resetMode && cooldown > 0)}
            className="w-full py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred disabled:opacity-60 text-white text-sm font-semibold shadow-md transition-all hover:scale-101 flex items-center justify-center space-x-2"
          >
            <span>{submitLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => switchMode(resetMode ? 'login' : 'reset')}
              className="text-xs font-semibold text-senoia-red hover:underline"
            >
              {resetMode ? 'Back to log in' : 'Forgot password?'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-400">
          {ADMIN_SUPPORT_EMAIL ? (
            <>
              Need help? Contact{' '}
              <a href={`mailto:${ADMIN_SUPPORT_EMAIL}`} className="text-senoia-red hover:underline">
                {ADMIN_SUPPORT_EMAIL}
              </a>
            </>
          ) : (
            'Forgot your password? Use the reset link above.'
          )}
        </div>
      </div>
    </div>
  );
}
