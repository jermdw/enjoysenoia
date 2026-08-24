import React, { useEffect } from 'react';
import { Instagram, ExternalLink } from 'lucide-react';

export default function InstagramEmbed() {
  useEffect(() => {
    // EmbedSocial widget loader
    if (!document.getElementById('EmbedSocialHashtagScript')) {
      const script = document.createElement('script');
      script.id = 'EmbedSocialHashtagScript';
      script.src = 'https://embedsocial.com/cdn/ht.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <section id="instagram" className="py-16 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
              <Instagram className="w-4 h-4 text-senoia-gold" />
              <span>Follow Along</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              The Latest from @enjoysenoia
            </h2>
          </div>
          <div className="mt-4 sm:mt-0">
            <a
              href="https://www.instagram.com/enjoysenoia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-senoia-red hover:text-senoia-darkred"
            >
              <span>View on Instagram</span>
              <ExternalLink className="ml-1.5 w-4 h-4" />
            </a>
          </div>
        </div>

        {/* EmbedSocial Container with Fallback Grid */}
        <div className="rounded-2xl overflow-hidden bg-white p-4 shadow-sm border border-stone-200/80">
          <div className="embedsocial-hashtag" data-ref="014c45b467e1ba7e5670c3275d86b128c35438da">
            {/* Fallback Instagram Teaser Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <a href="https://www.instagram.com/enjoysenoia" target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden bg-stone-200">
                <img src="https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/6778a2b806669ece4ad44466_IMG_6746.JPG" alt="Instagram 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Instagram className="w-6 h-6" />
                </div>
              </a>
              <a href="https://www.instagram.com/enjoysenoia" target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden bg-stone-200">
                <img src="https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/6778a2a90307872d8e18eb39_IMG_6744.JPG" alt="Instagram 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Instagram className="w-6 h-6" />
                </div>
              </a>
              <a href="https://www.instagram.com/enjoysenoia" target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden bg-stone-200">
                <img src="https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/6778a295d9caa54fa2900a09_IMG_6740.JPG" alt="Instagram 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Instagram className="w-6 h-6" />
                </div>
              </a>
              <a href="https://www.instagram.com/enjoysenoia" target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden bg-stone-200">
                <img src="https://cdn.prod.website-files.com/62c89378d6e1292fdfcdd98a/6778a273acc77e915403cebc_IMG_6743.JPG" alt="Instagram 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Instagram className="w-6 h-6" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
