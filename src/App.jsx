import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AboutDDAPage from './pages/AboutDDAPage';
import VeteransMemorialPage from './pages/VeteransMemorialPage';
import FilesFormsPage from './pages/FilesFormsPage';
import SenoiaHistoryPage from './pages/SenoiaHistoryPage';
import BusinessPortalPage from './pages/BusinessPortalPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import PastEventsPage from './pages/PastEventsPage';
import BusinessesPage from './pages/BusinessesPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import MediaPage from './pages/MediaPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import SponsorLogoPage from './pages/SponsorLogoPage';
import VolunteerPage from './pages/VolunteerPage';
import VolunteerCancelPage from './pages/VolunteerCancelPage';
// The admin pages, and the story editor they carry, load only when someone
// opens /admin, so visitors never download them.
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage'));
import MasqueradePage from './masquerade/MasqueradePage';
import HalloweenPage from './halloween/HalloweenPage';
import ChristmasPage from './christmas/ChristmasPage';

/**
 * The Masquerade has its own domain, served from the same build. There the page
 * lives at the root, so the address reads thehalloweenmasquerade.com rather than
 * .../masquerade; every other path folds back to it. Includes the Firebase
 * default hostnames of the `thehalloweenmasquerade` Hosting site and its
 * preview channels (thehalloweenmasquerade--<channel>.web.app).
 */
const MASQUERADE_HOST = /(^|\.)thehalloweenmasquerade(\.com|\.firebaseapp\.com|(--[\w-]+)?\.web\.app)$/;

/**
 * The Senoia Halloween site works the same way: its own domain, served from the
 * same build, page at the root so the address stays clean. Changing the domain
 * means changing this pattern and `seo.url` in
 * src/halloween/data/halloweenDetails.js together.
 */
const HALLOWEEN_HOST = /(^|\.)senoiahalloween(\.com|\.firebaseapp\.com|(--[\w-]+)?\.web\.app)$/;

/**
 * Christmas in Senoia lives on a subdomain of the DDA's own domain rather than
 * a domain of its own, so there is nothing to register or renew. It is still a
 * separate Hosting site (`senoiachristmas`), because only a separate site can
 * serve an index.html whose static head names the sponsor for link unfurlers
 * (scripts/build-microsite-html.mjs). Also matches that site's Firebase default
 * hostnames and preview channels (senoiachristmas--<channel>.web.app).
 * Changing the domain means changing this pattern and `seo.url` in
 * src/christmas/data/christmasDetails.js together.
 */
const CHRISTMAS_HOST = /^christmas\.enjoysenoia\.com$|(^|\.)senoiachristmas(\.firebaseapp\.com|(--[\w-]+)?\.web\.app)$/;

/**
 * The DDA chrome (navbar + footer) as a layout route, so routes that carry
 * their own branding — the Masquerade micro-site — can opt out of it.
 */
function AdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 text-sm text-stone-500" role="status">
      Loading the portal…
    </div>
  );
}

function DDALayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  if (HALLOWEEN_HOST.test(window.location.hostname)) {
    return (
      <Routes>
        <Route path="/" element={<HalloweenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (CHRISTMAS_HOST.test(window.location.hostname)) {
    return (
      <Routes>
        <Route path="/" element={<ChristmasPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (MASQUERADE_HOST.test(window.location.hostname)) {
    return (
      <Routes>
        <Route path="/" element={<MasqueradePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Standalone micro-site: no Enjoy Senoia navbar or footer. */}
      <Route path="/masquerade" element={<MasqueradePage />} />
      <Route path="/halloween" element={<HalloweenPage />} />
      <Route path="/christmas" element={<ChristmasPage />} />

      <Route element={<DDALayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-the-dda" element={<AboutDDAPage />} />
        <Route path="/about-the-veterans-memorial" element={<VeteransMemorialPage />} />
        <Route path="/files-forms-and-downloads" element={<FilesFormsPage />} />
        <Route path="/senoia-history" element={<SenoiaHistoryPage />} />
        <Route path="/dda-business-portal" element={<BusinessPortalPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/sponsor-logo" element={<SponsorLogoPage />} />
        <Route path="/volunteer/:eventSlug" element={<VolunteerPage />} />
        <Route path="/volunteer-cancel" element={<VolunteerCancelPage />} />
        
        {/* Events Routes */}
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
        <Route path="/past-events" element={<PastEventsPage />} />
        
        {/* Business Directory Routes */}
        <Route path="/downtown-businesses" element={<BusinessesPage />} />
        <Route path="/downtown-business/:slug" element={<BusinessDetailPage />} />
        
        {/* Media & News Routes */}
        <Route path="/media" element={<MediaPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        
        {/* Legal & Governance */}
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        
        {/* Admin Portal */}
        <Route path="/admin" element={<Suspense fallback={<AdminLoading />}><AdminLoginPage /></Suspense>} />
        <Route path="/admin/dashboard" element={<Suspense fallback={<AdminLoading />}><AdminPortalPage /></Suspense>} />

        {/* Legacy Fallbacks / Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
