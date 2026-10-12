import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Calendar, Building2, Newspaper, Mail, Download, LogOut, Ghost, KeyRound } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import SEO from '../components/common/SEO';
import { getEvents, getBusinesses, useContentOverrides } from '../services/dataService';
import { auth, db } from '../services/firebase';
import { isAuthorizedAdmin } from '../services/adminAccess';
import HalloweenAdmin from './admin/HalloweenAdmin';
import NewsAdmin from './admin/NewsAdmin';
import ContentAdmin from './admin/ContentAdmin';
import AccountModal from './admin/AccountModal';

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState('events');
  // Tab counts follow the live (merged, hidden-excluded) listings.
  useContentOverrides();
  const events = getEvents();
  const businesses = getBusinesses();
  const [subscribers, setSubscribers] = useState([]);
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

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
      <SEO title="EnjoySenoia Admin Portal" description="Content administration dashboard for EnjoySenoia." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-senoia-red/10 flex items-center justify-center text-senoia-red">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-stone-900">EnjoySenoia Admin Portal</h1>
              <p className="text-xs text-stone-500">Logged in as: <span className="font-semibold text-stone-700">{userEmail}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>Account</span>
            </button>
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
            { id: 'news', label: 'News & Stories', icon: Newspaper },
            { id: 'subscribers', label: `Newsletter (${subscribers.length})`, icon: Mail },
            { id: 'halloween', label: 'Halloween', icon: Ghost }
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
          {activeTab === 'events' && <ContentAdmin kind="event" />}

          {/* BUSINESSES TAB */}
          {activeTab === 'businesses' && <ContentAdmin kind="business" />}

          {/* NEWS TAB */}
          {activeTab === 'news' && <NewsAdmin />}

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

          {/* HALLOWEEN TAB */}
          {activeTab === 'halloween' && <HalloweenAdmin />}
        </div>
      </div>

      {accountOpen && <AccountModal email={userEmail} onClose={() => setAccountOpen(false)} />}
    </div>
  );
}
