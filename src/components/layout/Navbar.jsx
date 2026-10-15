import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Calendar, Building2, FileText, Info, Shield, Landmark, HelpCircle, Mail } from 'lucide-react';
import { webflowAsset } from '../../utils/webflowAsset';

// How long a dropdown stays open after the pointer leaves it, so a slightly
// wobbly path from the trigger down into the menu doesn't close it.
const CLOSE_DELAY_MS = 150;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  // Which desktop dropdown is open ('about' | 'events' | null). One value keeps
  // them mutually exclusive, so a pending close never overlaps the next menu.
  const [openMenu, setOpenMenu] = useState(null);
  const closeTimer = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cancelClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const closeMenu = (name) => setOpenMenu((current) => (current === name ? null : current));

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    cancelClose();
    setOpenMenu(null);
  }, [location.pathname]);

  // Escape closes whichever dropdown is open, wherever focus sits.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      cancelClose();
      setOpenMenu(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => cancelClose, []);

  // Props for a dropdown's wrapper (trigger + menu). Hover only reacts to a
  // real mouse: on a touch screen a tap fires pointerenter and then click, and
  // the click toggle would immediately undo the hover open. Touch and keyboard
  // use the trigger's click toggle instead.
  const dropdownProps = (name) => ({
    onPointerEnter: (e) => {
      if (e.pointerType !== 'mouse') return;
      cancelClose();
      setOpenMenu(name);
    },
    onPointerLeave: (e) => {
      if (e.pointerType !== 'mouse') return;
      cancelClose();
      closeTimer.current = setTimeout(() => closeMenu(name), CLOSE_DELAY_MS);
    },
    // Closes once focus leaves the dropdown entirely, so tabbing past the last
    // link behaves like moving the pointer away.
    onBlur: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) closeMenu(name);
    },
  });

  const toggleMenu = (name) => {
    cancelClose();
    setOpenMenu((current) => (current === name ? null : name));
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white py-4 border-b border-stone-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={webflowAsset('site/6362a03acb8c6b389861e276_enjoy_senoia_site_logo.svg')} 
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
            <div className="relative" {...dropdownProps('about')}>
              <button 
                type="button"
                onClick={() => toggleMenu('about')}
                aria-haspopup="true" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/about') || location.pathname.includes('senoia-history') || location.pathname.includes('files-forms') || location.pathname.includes('business-portal') || location.pathname === '/faq' || location.pathname === '/contact' ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
                aria-expanded={openMenu === 'about'}
              >
                <span>About</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {openMenu === 'about' && (
                // pt-1 (padding, not margin) keeps the space between trigger
                // and panel inside the dropdown, so the pointer never leaves it.
                <div className="absolute left-0 top-full pt-1 z-50">
                  <div className="w-64 rounded-xl shadow-xl bg-white ring-1 ring-black/5 py-2 border border-stone-100 animate-in fade-in slide-in-from-top-2 duration-150">
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
                    <Link to="/faq" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                      <HelpCircle className="w-4 h-4 mr-3 text-stone-400" />
                      <span>FAQ</span>
                    </Link>
                    <Link to="/contact" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                      <Mail className="w-4 h-4 mr-3 text-stone-400" />
                      <span>Contact Us</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Events Dropdown */}
            <div className="relative" {...dropdownProps('events')}>
              <button 
                type="button"
                onClick={() => toggleMenu('events')}
                aria-haspopup="true" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith('/events') || location.pathname.startsWith('/past-events') ? 'text-senoia-red font-semibold bg-stone-100' : 'text-stone-700 hover:text-senoia-red hover:bg-stone-50'}`}
                aria-expanded={openMenu === 'events'}
              >
                <span>Events</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {openMenu === 'events' && (
                // pt-1 (padding, not margin) keeps the space between trigger
                // and panel inside the dropdown, so the pointer never leaves it.
                <div className="absolute left-0 top-full pt-1 z-50">
                  <div className="w-52 rounded-xl shadow-xl bg-white ring-1 ring-black/5 py-2 border border-stone-100 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link to="/events" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                      <Calendar className="w-4 h-4 mr-3 text-stone-400" />
                      <span>Upcoming Events</span>
                    </Link>
                    <Link to="/past-events" className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-senoia-red">
                      <Calendar className="w-4 h-4 mr-3 text-stone-400" />
                      <span>Past Events</span>
                    </Link>
                  </div>
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
            <Link to="/faq" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              FAQ
            </Link>
            <Link to="/contact" className="block pl-6 pr-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
              Contact Us
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
