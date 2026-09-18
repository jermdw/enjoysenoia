import React from 'react';
import { Camera } from 'lucide-react';
import SEO from '../components/common/SEO';
import { webflowAsset } from '../utils/webflowAsset';

const GALLERIES = [
  {
    title: '20th Annual Senoia Car Show',
    date: '2026',
    count: '600+ Cars',
    image: webflowAsset('site/68dc80e9d1020c52e7067256_Fat_tuesday__1920_x_1080_px___7_.jpg')
  },
  {
    title: 'Senoia PorchFest Community Highlights',
    date: '2025 / 2026',
    count: '30+ Bands',
    image: webflowAsset('site/68c08419a41638d40641ae2a_IMG_3519.JPG')
  },
  {
    title: 'America 250 & Memorial Celebrations',
    date: '2026',
    count: 'Community Gala',
    image: webflowAsset('site/6a5439e045b14bcbce351050_Fat_tuesday__1200_x_628_px___25_.jpg')
  },
  {
    title: 'Historic Downtown Senoia Streetscapes',
    date: 'Scenic Collection',
    count: 'Architecture & Dining',
    image: webflowAsset('site/6778a2b806669ece4ad44466_IMG_6746.JPG')
  }
];

export default function MediaPage() {
  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Media & Photo Galleries"
        description="Browse photo galleries, scenic streetscapes, car show highlights, and media resources for Senoia, GA."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <Camera className="w-4 h-4 text-senoia-gold" />
            <span>Photography & Assets</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
            Media & Photo Galleries
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            High-resolution visual archives celebrating downtown Senoia's signature festivals, parades, and scenic charm.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {GALLERIES.map((gal, idx) => (
            <div
              key={gal.title + idx}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-stone-900 aspect-[16/10]"
            >
              <img
                src={gal.image}
                alt={gal.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-senoia-gold uppercase tracking-wider">
                  <span>{gal.date}</span>
                  <span>•</span>
                  <span>{gal.count}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
                  {gal.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Press & Media Inquiries */}
        <div className="p-8 sm:p-10 rounded-2xl bg-white shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-serif text-stone-900">Media & Press Inquiries</h2>
            <p className="text-sm text-stone-600 max-w-xl">
              Journalists, filmmakers, and photographers seeking media credentials, official logos, or historical context may contact the DDA.
            </p>
          </div>
          <a
            href="mailto:info@enjoysenoia.com?subject=Press%20and%20Media%20Inquiry"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-sm font-semibold shadow-xs shrink-0 transition-colors"
          >
            <span>Contact Media Relations</span>
          </a>
        </div>
      </div>
    </div>
  );
}
