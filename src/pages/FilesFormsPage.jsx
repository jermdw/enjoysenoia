import React, { useState } from 'react';
import { Download, FolderOpen, ExternalLink } from 'lucide-react';
import SEO from '../components/common/SEO';

const DOCUMENTS = [
  {
    title: 'DDA Façade Grant Application & Guidelines',
    category: 'Grants & Applications',
    type: 'PDF',
    description: 'Grant guidelines and application form for downtown commercial building façade improvements.',
    url: 'https://app.box.com/embed/s/63v9fiw5gpuoj43ltxvcj7042iqbwlix'
  },
  {
    title: 'Downtown Event Vendor Application',
    category: 'Grants & Applications',
    type: 'PDF',
    description: 'Application for artisans, merchants, and food vendors participating in DDA-sponsored festivals.',
    url: 'https://app.box.com/embed/s/63v9fiw5gpuoj43ltxvcj7042iqbwlix'
  },
  {
    title: 'Senoia DDA Bylaws & Enabling Legislation',
    category: 'Governance & Bylaws',
    type: 'PDF',
    description: 'Official bylaws, charter, and operational governance policies for the Senoia DDA.',
    url: 'https://app.box.com/embed/s/63v9fiw5gpuoj43ltxvcj7042iqbwlix'
  },
  {
    title: 'Recent DDA Meeting Agendas & Minutes Archive',
    category: 'Meeting Records',
    type: 'Folder',
    description: 'Official meeting records, agendas, and adopted minutes from regular monthly board meetings.',
    url: 'https://app.box.com/embed/s/63v9fiw5gpuoj43ltxvcj7042iqbwlix'
  }
];

export default function FilesFormsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredDocs = activeTab === 'all' 
    ? DOCUMENTS 
    : DOCUMENTS.filter(d => d.category.toLowerCase().includes(activeTab.toLowerCase()));

  return (
    <div className="py-12 sm:py-16 bg-stone-50 min-h-screen">
      <SEO
        title="Files, Forms & Downloads"
        description="Access Senoia DDA meeting agendas, approved minutes, vendor applications, and façade grant guidelines."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 text-senoia-red font-semibold text-sm tracking-wide uppercase">
            <FolderOpen className="w-4 h-4 text-senoia-gold" />
            <span>Public Document Repository</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
            Files, Forms & Downloads
          </h1>
          <p className="text-stone-600 text-base sm:text-lg">
            Download official DDA meeting minutes, agendas, merchant grant applications, and public records.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'Grants', 'Governance', 'Meeting'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-senoia-red text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {tab === 'all' ? 'All Documents' : tab}
            </button>
          ))}
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc, idx) => (
            <div
              key={doc.title + idx}
              className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                    {doc.category}
                  </span>
                  <span className="text-xs font-bold text-senoia-gold uppercase tracking-wider">
                    {doc.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  {doc.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-senoia-red hover:text-senoia-darkred"
                >
                  <Download className="mr-1.5 w-4 h-4" />
                  <span>Access Document</span>
                </a>
                <span className="text-xs text-stone-400">Box Archive</span>
              </div>
            </div>
          ))}
        </div>

        {/* Embedded Box Document Browser */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-stone-900">
                Official Document Archive Browser
              </h2>
              <p className="text-xs text-stone-500">
                Live document browser for DDA agendas, minutes, and administrative files.
              </p>
            </div>
            <a
              href="https://app.box.com/s/63v9fiw5gpuoj43ltxvcj7042iqbwlix"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center text-xs font-semibold text-senoia-red hover:underline"
            >
              <span>Open in Box</span>
              <ExternalLink className="ml-1 w-3.5 h-3.5" />
            </a>
          </div>

          <div className="w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
            <iframe
              src="https://app.box.com/embed/s/63v9fiw5gpuoj43ltxvcj7042iqbwlix?sortColumn=date&showParentPath=false"
              width="100%"
              height="500"
              frameBorder="0"
              allowFullScreen
              title="Senoia DDA Box Document Library"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
