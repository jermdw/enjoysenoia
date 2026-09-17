import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Calendar, Building2, FileText, Info, Shield, Landmark } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [aboutDropdown, setAboutDropdown] = useState(false);
  const [eventsDropdown, setEventsDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    setAboutDropdown(false);
    setEventsDropdown(false);
  }, [location.pathname]);

  // Escape closes whichever dropdown is open, wherever focus sits.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setAboutDropdown(false);
      setEventsDropdown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Closes a dropdown once focus leaves it entirely, so tabbing past the last
  // link behaves like moving the pointer away.
  const closeOnBlur = (setter) => (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setter(false);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white py-4 border-b border-stone-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="https://cdn.prod.website-files.com/62c89378d6e12946d6cdd965/6362a03acb8c6b389861e276_enjoy%20senoia%20site%20logo.svg" 
              alt="Enjoy Senoia" 
              className="h-10 sm:h-12 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
            >
              Home
            </Link>

            {/* About Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setAboutDropdown(true)}
              onMouseLeave={() => setAboutDropdown(false)}
              onBlur={closeOnBlur(setAboutDropdown)}
            >
              <button 
                type="button"
                onClick={() => setAboutDropdown((open) => !open)}
                aria-haspopup="true" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/about') || location.pathname.includes('senoia-history') || location.pathname.includes('files-forms') || location.pathname.includes('business-portal') ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
                aria-expanded={aboutDropdown}
              >
                <span>About</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {aboutDropdown && (
                <div className="absolute left-0 mt-1 w-64 rounded-xl shadow-xl bg-white ring-1 ring-black/5 py-2 z-50 border border-stone-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link to="/about-the-dda" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                    <Landmark className="w-4 h-4 mr-3 text-stone-400" />
                    <span>About the DDA</span>
                  </Link>
                  <Link to="/about-the-veterans-memorial" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                    <Shield className="w-4 h-4 mr-3 text-stone-400" />
                    <span>Senoia Veterans Memorial</span>
                  </Link>
                  <Link to="/files-forms-and-downloads" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                    <FileText className="w-4 h-4 mr-3 text-stone-400" />
                    <span>Files, Forms & Downloads</span>
                  </Link>
                  <Link to="/senoia-history" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                    <Info className="w-4 h-4 mr-3 text-stone-400" />
                    <span>Senoia History</span>
                  </Link>
                  <Link to="/dda-business-portal" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                    <Building2 className="w-4 h-4 mr-3 text-stone-400" />
                    <span>DDA Business Portal</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Events Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setEventsDropdown(true)}
              onMouseLeave={() => setEventsDropdown(false)}
              onBlur={closeOnBlur(setEventsDropdown)}
            >
              <button 
                type="button"
                onClick={() => setEventsDropdown((open) => !open)}
                aria-haspopup="true" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/events') || location.pathname.startsWith('/past-events') ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
                aria-expanded={eventsDropdown}
              >
                <span>Events</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {eventsDropdown && (
                <div className="absolute left-0 mt-1 w-52 rounded-xl shadow-xl bg-white ring-1 ring-black/5 py-2 z-50 border border-stone-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link to="/events" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                    <Calendar className="w-4 h-4 mr-3 text-stone-400" />
                    <span>Upcoming Events</span>
                  </Link>
                  <Link to="/past-events" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                    <Calendar className="w-4 h-4 mr-3 text-stone-400" />
                    <span>Past Events</span>
                  </Link>
                </div>
              )}
            </div>

            <Link 
              to="/downtown-businesses" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/downtown-businesses' ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
            >
              Businesses
            </Link>

            <Link 
              to="/media" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/media' ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
            >
              Media
            </Link>

            <Link 
              to="/news" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/news' ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
            >
              News
            </Link>
          </nav>

          {/* Right Action */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link 
              to="/events" 
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-senoia-red hover:bg-senoia-darkred rounded-lg shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              Explore Events
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-stone-700 hover:text-senoia-red hover:bg-stone-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in fade-in duration-200">
          <Link to="/" className="block px-3 py-2.5 rounded-lg text-base font-medium text-stone-800 hover:bg-stone-50">
            Home
          </Link>
          
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-stone-400">About Senoia & DDA</div>
            <Link to="/about-the-dda" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              About the DDA
            </Link>
            <Link to="/about-the-veterans-memorial" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Veterans Memorial
            </Link>
            <Link to="/files-forms-and-downloads" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Files, Forms & Downloads
            </Link>
            <Link to="/senoia-history" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Senoia History
            </Link>
            <Link to="/dda-business-portal" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              DDA Business Portal
            </Link>
          </div>

          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-stone-400">Events & Directory</div>
            <Link to="/events" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Upcoming Events
            </Link>
            <Link to="/past-events" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Past Events
            </Link>
            <Link to="/downtown-businesses" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Downtown Businesses
            </Link>
            <Link to="/media" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Media & Galleries
            </Link>
            <Link to="/news" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              DDA News
            </Link>
          </div>

          <div className="pt-3">
            <Link 
              to="/events" 
              className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-senoia-red hover:bg-senoia-darkred rounded-lg"
            >
              Explore Upcoming Events
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
