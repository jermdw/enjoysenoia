import React from 'react';
import { ShieldCheck } from 'lucide-react';
import SEO from '../components/common/SEO';

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Privacy Policy"
        description="Privacy policy and data practices for the Senoia Downtown Development Authority (enjoysenoia.com)."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-senoia-gold" />
            <span>Legal Notice</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
            Privacy Policy
          </h1>
          <p className="text-xs text-stone-500">Last updated: August 2026</p>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-stone-200 prose prose-stone text-stone-700 text-sm leading-relaxed space-y-4">
          <h2 className="text-lg font-bold font-serif text-stone-900">Information We Collect</h2>
          <p>
            The Senoia Downtown Development Authority ("DDA", "we", "us") respects your privacy. We collect information you voluntarily provide, such as your email address when subscribing to our municipal newsletter or submitting event registration forms.
          </p>

          <h2 className="text-lg font-bold font-serif text-stone-900">How We Use Information</h2>
          <p>
            Information collected is strictly used to communicate official Senoia DDA announcements, upcoming events, and community updates. We do not sell, rent, or trade your personal information to third parties.
          </p>

          <h2 className="text-lg font-bold font-serif text-stone-900">Analytics & Cookies</h2>
          <p>
            We use standard web analytics (Google Analytics) to measure aggregate website traffic and optimize user experience. You can disable cookies in your browser settings at any time.
          </p>

          <h2 className="text-lg font-bold font-serif text-stone-900">Contact</h2>
          <p>
            For questions regarding this privacy notice, please contact the Senoia DDA at <a href="mailto:info@enjoysenoia.com" className="text-senoia-red hover:underline">info@enjoysenoia.com</a> or by mail at PO Box 310, Senoia, GA 30276.
          </p>
        </div>
      </div>
    </div>
  );
}
