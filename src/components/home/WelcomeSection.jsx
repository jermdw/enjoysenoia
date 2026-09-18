import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Building, Coffee, ShoppingBag, Landmark } from 'lucide-react';
import { webflowAsset } from '../../utils/webflowAsset';

const SLIDES = [
  {
    url: webflowAsset('site/6778a2b806669ece4ad44466_IMG_6746.JPG'),
    caption: 'Historic Downtown Senoia Main Street'
  },
  {
    url: webflowAsset('site/6778a2a90307872d8e18eb39_IMG_6744.JPG'),
    caption: 'Charming Boutiques & Walkable Sidewalks'
  },
  {
    url: webflowAsset('site/6778a295d9caa54fa2900a09_IMG_6740.JPG'),
    caption: 'Dining & Southern Hospitality'
  },
  {
    url: webflowAsset('site/6778a273acc77e915403cebc_IMG_6743.JPG'),
    caption: 'Vibrant Community Celebrations'
  }
];

export default function WelcomeSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="about" className="py-16 lg:py-24 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
              <Sparkles className="w-4 h-4 text-senoia-gold" />
              <span>Historic Senoia, Georgia</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-stone-900 leading-tight">
              The Perfect Setting. <br className="hidden sm:block" />
              <span className="text-senoia-red italic">For Life.</span>
            </h2>

            <div className="prose prose-stone text-stone-600 text-base sm:text-lg leading-relaxed space-y-4">
              <p className="font-semibold text-stone-800">
                Senoia is the perfect setting for living, and for business and commerce!
              </p>
              <p>
                The historic downtown Senoia area is a thriving small business community featuring restaurants, bars, boutiques, hair and nail stylists, dentists, doctors, furniture, antiques, and more—all nestled within our walkable downtown and historic residential district.
              </p>
              <p>
                Our downtown has grown dramatically in recent years with an influx of new businesses, yet retains that timeless small-town look, feel, and above all, the warmth and hospitality Senoia is renowned for.
              </p>
              <p>
                There is always something happening in Senoia—from the weekly Saturday Farmer's Market and monthly <em>Alive After Five</em> celebrations to the beloved Light Up Senoia Christmas parade, Senoia PorchFest, and the world-famous Annual Senoia Car Show.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center space-x-2 p-3 bg-white rounded-xl shadow-xs border border-stone-200/70 text-xs sm:text-sm font-medium text-stone-700">
                <Coffee className="w-4 h-4 text-senoia-red" />
                <span>Dining & Bars</span>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-white rounded-xl shadow-xs border border-stone-200/70 text-xs sm:text-sm font-medium text-stone-700">
                <ShoppingBag className="w-4 h-4 text-senoia-gold" />
                <span>Local Boutiques</span>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-white rounded-xl shadow-xs border border-stone-200/70 text-xs sm:text-sm font-medium text-stone-700">
                <Landmark className="w-4 h-4 text-senoia-red" />
                <span>Historic Charm</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/about-the-dda"
                className="inline-flex items-center px-5 py-3 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white font-medium text-sm shadow-sm transition-all hover:translate-x-0.5"
              >
                More About the DDA
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                to="/downtown-businesses"
                className="inline-flex items-center px-5 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-medium text-sm border border-stone-300 shadow-xs transition-colors"
              >
                Browse Business Directory
              </Link>
            </div>
          </div>

          {/* Photo Carousel & Visual Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-stone-200">
              {SLIDES.map((slide, idx) => (
                <div
                  key={slide.url}
                  className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <img
                    src={slide.url}
                    alt={slide.caption}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                    <p className="text-white text-sm sm:text-base font-medium drop-shadow">
                      {slide.caption}
                    </p>
                  </div>
                </div>
              ))}

              {/* Slider Dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-20">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-senoia-gold w-6' : 'bg-white/60 hover:bg-white'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Decorative Badge */}
            <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center space-x-3 bg-stone-900 text-white p-4 rounded-2xl shadow-xl border border-stone-700">
              <Building className="w-8 h-8 text-senoia-gold" />
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">Downtown Senoia</p>
                <p className="text-sm font-semibold font-serif">65+ Local Businesses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
