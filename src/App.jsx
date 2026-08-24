import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPortalPage from './pages/AdminPortalPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-the-dda" element={<AboutDDAPage />} />
        <Route path="/about-the-veterans-memorial" element={<VeteransMemorialPage />} />
        <Route path="/files-forms-and-downloads" element={<FilesFormsPage />} />
        <Route path="/senoia-history" element={<SenoiaHistoryPage />} />
        <Route path="/dda-business-portal" element={<BusinessPortalPage />} />
        
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
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminPortalPage />} />
        
        {/* Legacy Fallbacks / Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
