import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Calendar, MapPin } from 'lucide-react';
import { webflowAsset } from '../../utils/webflowAsset';

export default function Hero() {
  return (
    <section className="relative h-[85vh] min-h-[550px] max-h-[850px] w-full flex items-center justify-center overflow-hidden bg-stone-900">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={webflowAsset('site/63591d0e6197414d4ebc7427_enjoysenoia-hero-r2-poster-00001.jpg')}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
      >
        <source
          src={webflowAsset('site/63591d0e6197414d4ebc7427_enjoysenoia-hero-r2-transcode.mp4')}
          type="video/mp4"
        />
        <source
          src={webflowAsset('site/63591d0e6197414d4ebc7427_enjoysenoia-hero-r2-transcode.webm')}
          type="video/webm"
        />
      </video>

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30 backdrop-blur-[0.5px]" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium tracking-wide uppercase text-amber-200">
          <MapPin className="w-3.5 h-3.5" />
          <span>Historic Senoia, Georgia</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-serif drop-shadow-lg text-white">
          Enjoy Senoia
        </h1>

        <p className="text-lg sm:text-2xl font-light text-stone-200 max-w-2xl mx-auto tracking-wide drop-shadow">
          Senoia Downtown Development Authority
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#about"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white font-semibold text-base shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Discover Senoia
            <ArrowDown className="ml-2 w-4 h-4" />
          </a>
          <Link
            to="/events"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-semibold text-base shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Calendar className="mr-2 w-4 h-4 text-senoia-gold" />
            Upcoming Events
          </Link>
        </div>
      </div>
    </section>
  );
}
