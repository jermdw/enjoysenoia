import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, Facebook, Instagram, ShieldCheck } from 'lucide-react';
import { webflowAsset } from '../../utils/webflowAsset';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo & About */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img 
                src={webflowAsset('site/6362abc02ae24e0e53b29093_enjoy_senoia_site_logo_footer.svg')} 
                alt="Enjoy Senoia" 
                className="h-12 w-auto brightness-110"
              />
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed">
              Senoia Downtown Development Authority. Revitalizing, enhancing, and promoting the historic charm and economic vitality of Senoia, Georgia.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a 
                href="https://www.facebook.com/enjoysenoia" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-stone-800 hover:bg-senoia-red text-stone-300 hover:text-white rounded-lg transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/enjoysenoia" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-stone-800 hover:bg-senoia-red text-stone-300 hover:text-white rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Welcome Center Info */}
          <div className="space-y-3">
            <h3 className="text-white text-base font-semibold tracking-wider uppercase font-serif">Welcome Center</h3>
            <div className="space-y-2 text-sm text-stone-400">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-senoia-gold shrink-0 mt-0.5" />
                <span>68 Main St, Senoia, GA 30276</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-senoia-gold shrink-0 mt-0.5" />
                <div>
                  <p>Mon – Thu: 11:00 AM – 3:00 PM</p>
                  <p>Fri & Sat: 11:00 AM – 4:00 PM</p>
                </div>
              </div>
              <div className="pt-2 text-xs text-stone-500">
                Mailing: PO Box 310, Senoia, GA 30276
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-white text-base font-semibold tracking-wider uppercase font-serif">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about-the-dda" className="hover:text-white transition-colors">About the DDA</Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">Upcoming Events</Link>
              </li>
              <li>
                <Link to="/downtown-businesses" className="hover:text-white transition-colors">Business Directory</Link>
              </li>
              <li>
                <Link to="/files-forms-and-downloads" className="hover:text-white transition-colors">Forms & Downloads</Link>
              </li>
              <li>
                <Link to="/senoia-history" className="hover:text-white transition-colors">Senoia History</Link>
              </li>
              <li>
                <Link to="/about-the-veterans-memorial" className="hover:text-white transition-colors">Veterans Memorial</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-white text-base font-semibold tracking-wider uppercase font-serif">Contact</h3>
            <div className="space-y-2 text-sm text-stone-400">
              <a href="tel:770-727-9173" className="flex items-center space-x-2.5 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-senoia-gold shrink-0" />
                <span>(770) 727-9173</span>
              </a>
              <a href="mailto:info@enjoysenoia.com" className="flex items-center space-x-2.5 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-senoia-gold shrink-0" />
                <span>info@enjoysenoia.com</span>
              </a>
              <a href="mailto:webmaster@enjoysenoia.com" className="flex items-center space-x-2.5 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs text-stone-500">webmaster@enjoysenoia.com</span>
              </a>
            </div>
            <div className="pt-3">
              <Link 
                to="/admin" 
                className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DDA Volunteer Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {currentYear} Senoia Downtown Development Authority. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/privacy-policy" className="hover:text-stone-300 transition-colors">Privacy Policy</Link>
            <Link to="/files-forms-and-downloads" className="hover:text-stone-300 transition-colors">Public Records</Link>
            <Link to="/admin" className="hover:text-stone-300 transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
