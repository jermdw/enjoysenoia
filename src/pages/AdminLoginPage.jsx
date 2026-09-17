import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import SEO from '../components/common/SEO';
import { auth } from '../services/firebase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Accounts live in Firebase Authentication. The portal has no credentials of
  // its own, and Firestore rules decide what an account may write.
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/admin/dashboard');
    } catch (err) {
      console.warn('Admin sign-in failed:', err?.code);
      setError(
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found'
          ? 'That email and password combination was not recognized.'
          : 'Sign-in is unavailable right now. Please try again, or contact the webmaster.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-stone-100 min-h-screen flex items-center justify-center">
      <SEO
        title="Admin Portal Login"
        description="Senoia DDA staff and volunteer content administration portal."
      />

      <div className="max-w-md w-full mx-4 bg-white p-8 sm:p-10 rounded-3xl shadow-lg border border-stone-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-senoia-red/10 flex items-center justify-center text-senoia-red mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            DDA Volunteer Portal
          </h1>
          <p className="text-xs text-stone-500">
            Authorized content management for Senoia DDA board & staff
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@enjoysenoia.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-senoia-gold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Password / Access Key
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-senoia-gold"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred disabled:opacity-60 text-white text-sm font-semibold shadow-md transition-all hover:scale-101 flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Signing in…' : 'Log In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-400">
          For access inquiries, contact <a href="mailto:webmaster@enjoysenoia.com" className="text-senoia-red hover:underline">webmaster@enjoysenoia.com</a>
        </div>
      </div>
    </div>
  );
}
