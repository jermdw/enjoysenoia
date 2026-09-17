import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Calendar, Building2, Newspaper, Mail, Plus, Trash2, Download, LogOut, AlertTriangle } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import SEO from '../components/common/SEO';
import { getEvents, getBusinesses, getNews } from '../services/dataService';
import { auth, db } from '../services/firebase';
import { isAuthorizedAdmin } from '../services/adminAccess';

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState(getEvents());
  const [businesses, setBusinesses] = useState(getBusinesses());
  const [news, setNews] = useState(getNews());
  const [subscribers, setSubscribers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Being signed in is not enough: the account must carry the admin claim (or
  // be on the allowlist the Firebase Rules accept). Anyone else is signed out
  // and sent back to the login page.
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserEmail(null);
        setCheckingAuth(false);
        navigate('/admin', { replace: true });
        return;
      }

      const authorized = await isAuthorizedAdmin(user);
      setCheckingAuth(false);

      if (authorized) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        await signOut(auth).catch(() => {});
        navigate('/admin?denied=1', { replace: true });
      }
    });
  }, [navigate]);

  // Subscribers come from Firestore, which only administrators may read.
  useEffect(() => {
    if (!userEmail) return;

    let cancelled = false;
    (async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'newsletter_subscribers'), orderBy('subscribedAt', 'desc')));
        if (cancelled) return;
        setSubscribers(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              email: data.email,
              date: data.subscribedAt?.toDate?.().toISOString().slice(0, 10) || '',
            };
          })
        );
      } catch (err) {
        console.warn('Could not load newsletter subscribers:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign-out failed:', err);
    }
    navigate('/admin');
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (modalType === 'event') {
      setEvents([{ ...formData, is_recurring: false }, ...events]);
    } else if (modalType === 'business') {
      setBusinesses([{ ...formData, slug: formData.name.toLowerCase().replace(/\s+/g, '-') }, ...businesses]);
    } else if (modalType === 'news') {
      setNews([{ ...formData, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }, ...news]);
    }
    setShowModal(false);
    setFormData({});
  };

  const exportSubscribersCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + ["Email,Date Subscribed", ...subscribers.map(s => `${s.email},${s.date}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "enjoysenoia_newsletter_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Nothing about the portal renders for a visitor who is not signed in.
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 text-sm text-stone-500">
        Checking your access…
      </div>
    );
  }

  if (!userEmail) {
    return null;
  }

  return (
    <div className="py-10 bg-stone-100 min-h-screen">
      <SEO title="DDA Content Dashboard" description="Admin dashboard for Senoia DDA volunteers." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/*
          Events, businesses and news are read from the static JSON in /data and
          held in component state; nothing here writes back yet. Say so plainly
          rather than let a volunteer type up an event, refresh, and find it
          gone. The subscriber list below is real — it is read from Firestore.
        */}
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <span className="font-semibold">Changes here are not saved yet.</span>{' '}
            Events, businesses and news added or removed below last only until you
            reload the page — publishing them still means editing the site&rsquo;s data
            files. The newsletter subscriber list is live.
          </p>
        </div>

        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-senoia-red/10 flex items-center justify-center text-senoia-red">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-stone-900">DDA Volunteer Portal</h1>
              <p className="text-xs text-stone-500">Logged in as: <span className="font-semibold text-stone-700">{userEmail}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'events', label: `Events (${events.length})`, icon: Calendar },
            { id: 'businesses', label: `Merchant Directory (${businesses.length})`, icon: Building2 },
            { id: 'news', label: `News & Stories (${news.length})`, icon: Newspaper },
            { id: 'subscribers', label: `Newsletter (${subscribers.length})`, icon: Mail }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-senoia-red text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panels */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-stone-200">
          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif text-stone-900">Manage Events</h2>
                  <p className="text-xs text-stone-500">Add or edit community and DDA signature events</p>
                </div>
                <button
                  onClick={() => { setModalType('event'); setFormData({}); setShowModal(true); }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Event</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600">
                  <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="p-3">Event Title</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {events.map((evt, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/80">
                        <td className="p-3 font-semibold text-stone-900">{evt.title}</td>
                        <td className="p-3 text-xs">{evt.date_time}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                            {evt.category || 'Event'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button 
                            onClick={() => setEvents(events.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" 
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BUSINESSES TAB */}
          {activeTab === 'businesses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif text-stone-900">Merchant Directory</h2>
                  <p className="text-xs text-stone-500">Manage downtown Senoia storefronts and service listings</p>
                </div>
                <button
                  onClick={() => { setModalType('business'); setFormData({}); setShowModal(true); }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Business</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600">
                  <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="p-3">Business Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email / Website</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {businesses.map((b, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/80">
                        <td className="p-3 font-semibold text-stone-900">{b.name}</td>
                        <td className="p-3 text-xs">{b.category}</td>
                        <td className="p-3 text-xs">{b.phone || '—'}</td>
                        <td className="p-3 text-xs truncate max-w-[150px]">{b.email || b.website || '—'}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => setBusinesses(businesses.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif text-stone-900">News & Announcements</h2>
                  <p className="text-xs text-stone-500">Publish community updates and event recaps</p>
                </div>
                <button
                  onClick={() => { setModalType('news'); setFormData({}); setShowModal(true); }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Story</span>
                </button>
              </div>

              <div className="space-y-3">
                {news.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm font-serif">{item.title}</h3>
                      <p className="text-xs text-stone-500 line-clamp-1">{item.summary}</p>
                    </div>
                    <button
                      onClick={() => setNews(news.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBSCRIBERS TAB */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif text-stone-900">Newsletter Subscribers</h2>
                  <p className="text-xs text-stone-500">Captured through homepage newsletter form</p>
                </div>
                <button
                  onClick={exportSubscribersCSV}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600">
                  <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="p-3">Subscriber Email</th>
                      <th className="p-3">Date Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {subscribers.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/80">
                        <td className="p-3 font-medium text-stone-900">{sub.email}</td>
                        <td className="p-3 text-xs text-stone-500">{sub.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-stone-200">
            <h3 className="text-xl font-bold font-serif text-stone-900 capitalize">
              Add New {modalType}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title / Name</label>
                <input
                  type="text"
                  required
                  value={formData.title || formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, [modalType === 'business' ? 'name' : 'title']: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-senoia-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Category / Tag</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Dining, DDA Event, Retail"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-senoia-gold focus:outline-none"
                />
              </div>

              {modalType === 'event' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Date & Time</label>
                  <input
                    type="text"
                    value={formData.date_time || ''}
                    onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                    placeholder="e.g. October 15, 2026 5:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-senoia-gold focus:outline-none"
                  />
                </div>
              )}

              {modalType === 'business' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="770-555-0199"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@shop.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description / Summary</label>
                <textarea
                  rows={3}
                  value={formData.description || formData.summary || ''}
                  onChange={(e) => setFormData({ ...formData, [modalType === 'news' ? 'summary' : 'description']: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-senoia-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
