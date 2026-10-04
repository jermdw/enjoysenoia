import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import NewsStoryForm from './NewsStoryForm';
import { deleteStory, getAllStories, setStoryStatus } from '../../services/newsService';

const LIST_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
});

/**
 * The portal's News tab: every story, drafts included, with publishing
 * controls, and the editor for creating and changing them. Writes go straight
 * to Firestore, so a published change is live on the site immediately.
 */
export default function NewsAdmin() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // undefined: showing the list; null: a new story; otherwise the story being edited.
  const [editing, setEditing] = useState(undefined);
  const [busySlug, setBusySlug] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStories(await getAllStories());
    } catch (err) {
      console.warn('Could not load stories:', err);
      setError('The stories could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (story, fn, failure) => {
    setBusySlug(story.slug);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      console.warn(failure, err);
      setError(failure);
    } finally {
      setBusySlug('');
    }
  };

  const togglePublished = (story) => {
    const publish = story.status !== 'published';
    const question = publish
      ? `Publish "${story.title}"? It will appear on the public News page right away.`
      : `Unpublish "${story.title}"? It will disappear from the site until it is published again.`;
    if (!window.confirm(question)) return;
    act(story, () => setStoryStatus(story, publish ? 'published' : 'draft'),
      `"${story.title}" could not be ${publish ? 'published' : 'unpublished'}.`);
  };

  const remove = (story) => {
    if (!window.confirm(`Delete "${story.title}" permanently? This cannot be undone.`)) return;
    act(story, () => deleteStory(story.slug), `"${story.title}" could not be deleted.`);
  };

  if (editing !== undefined) {
    return (
      <div>
        <NewsStoryForm
          key={editing?.slug || 'new'}
          story={editing}
          onDone={(saved) => {
            setEditing(undefined);
            if (saved) load();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-serif text-stone-900">News &amp; Stories</h2>
          <p className="text-xs text-stone-500">Write, publish and update stories. Published changes go live immediately.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs">
            <Plus className="w-4 h-4" />
            <span>New story</span>
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">{error}</p>}

      {loading ? (
        <p className="text-sm text-stone-500" role="status">Loading stories…</p>
      ) : stories.length === 0 && !error ? (
        <p className="text-sm text-stone-500">No stories yet. Start one with “New story”.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {stories.map((story) => {
            const published = story.status === 'published';
            const busy = busySlug === story.slug;
            const when = story.publishedAt?.toDate?.();
            return (
              <li key={story.slug} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {published ? 'Published' : 'Draft'}
                    </span>
                    <h3 className="font-semibold text-stone-900 truncate">{story.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {when ? LIST_DATE.format(when) : 'No date'}
                    {story.updatedBy && story.updatedBy !== 'webflow-import' && <> · last edited by {story.updatedBy}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => setEditing(story)} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 disabled:opacity-50">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => togglePublished(story)} disabled={busy} className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 ${published ? 'bg-stone-100 hover:bg-stone-200 text-stone-800' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}`}>
                    {busy ? 'Working…' : published ? 'Unpublish' : 'Publish'}
                  </button>
                  {published && (
                    <a href={`/news/${story.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-stone-400 hover:text-senoia-red" title="View on site" aria-label={`View ${story.title} on the site`}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button type="button" onClick={() => remove(story)} disabled={busy} className="p-1.5 text-stone-400 hover:text-red-700 disabled:opacity-50" title="Delete" aria-label={`Delete ${story.title}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
