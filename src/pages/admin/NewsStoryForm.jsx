import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, ImagePlus, Lock, X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import {
  SLUG_PATTERN,
  isSlugLocked,
  saveStory,
  setStoryStatus,
  slugify,
  uploadNewsImage,
} from '../../services/newsService';

// Dates are picked as calendar days and stored at 17:00 UTC, midday in
// Senoia year-round, so they never read as the previous day (same convention
// as scripts/seed_news.py).
const EASTERN_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
});
const toDateInput = (date) => EASTERN_DAY.format(date);
const fromDateInput = (value) => new Date(`${value}T17:00:00Z`);

function initialForm(story) {
  return {
    title: story?.title || '',
    summary: story?.summary || '',
    bodyHtml: story?.bodyHtml || '',
    image: story?.image || '',
    imageAlt: story?.imageAlt || '',
    day: toDateInput(story?.publishedAt?.toDate?.() || new Date()),
    showDate: story ? Boolean(story.showDate) : true,
  };
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-senoia-red/30 focus:border-senoia-red';
const labelClass = 'block text-xs font-semibold text-stone-700 mb-1';

/**
 * Create or edit one story. `story` is null for a new one. Calls onDone(true)
 * after a save so the list reloads, onDone(false) on cancel.
 */
export default function NewsStoryForm({ story, onDone }) {
  const [form, setForm] = useState(() => initialForm(story));
  const [slug, setSlug] = useState(story?.slug || '');
  // A new story's address follows its title until someone edits it by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(story));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const locked = isSlugLocked(story);
  const isPublished = story?.status === 'published';
  const effectiveSlug = slugTouched ? slug : slugify(form.title);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const uploadImage = (file) => uploadNewsImage(effectiveSlug || 'untitled', file);

  const uploadMainImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setBusy('image');
    try {
      update({ image: await uploadImage(file) });
    } catch (err) {
      setError(err.message || 'The image could not be uploaded.');
    } finally {
      setBusy('');
    }
  };

  const validate = () => {
    if (!form.title.trim()) return 'Give the story a title.';
    if (!SLUG_PATTERN.test(effectiveSlug)) {
      return 'The web address may use only lowercase letters, numbers and hyphens.';
    }
    if (!form.day) return 'Choose a publish date.';
    return '';
  };

  const save = async (intent) => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (intent === 'publish' && !window.confirm('Publish this story? It will appear on the public News page right away.')) {
      return;
    }
    setError('');
    setBusy(intent);
    try {
      const values = { ...form, publishedAt: fromDateInput(form.day) };
      const saved = await saveStory({
        originalSlug: story?.slug || null,
        slug: effectiveSlug,
        form: values,
        status: intent === 'publish' ? 'published' : story?.status,
      });
      if (intent === 'publish' && story && !isPublished) {
        await setStoryStatus({ ...story, slug: saved }, 'published');
      }
      onDone(true);
    } catch (err) {
      console.warn('Saving the story failed:', err);
      setError(err.code === 'permission-denied'
        ? 'Your account is not allowed to edit News. Ask the site administrator for access.'
        : err.message || 'The story could not be saved.');
      setBusy('');
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return;
    onDone(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={cancel} className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-senoia-red">
          <ArrowLeft className="mr-1.5 w-4 h-4" />
          Back to all stories
        </button>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {story ? (isPublished ? 'Published' : 'Draft') : 'New story'}
        </span>
      </div>

      <div>
        <label htmlFor="story-title" className={labelClass}>Title</label>
        <input
          id="story-title"
          className={`${inputClass} text-lg font-serif font-bold`}
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Senoia PorchFest 2026 Highlights"
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="story-slug" className={labelClass}>Web address</label>
        <div className="flex items-center gap-1 text-sm text-stone-500">
          <span className="shrink-0">enjoysenoia.com/news/</span>
          {locked ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-800">
              {story.slug}
              <Lock className="w-3.5 h-3.5 text-stone-400" aria-label="Locked" />
            </span>
          ) : (
            <input
              id="story-slug"
              className={inputClass}
              value={effectiveSlug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); setDirty(true); }}
            />
          )}
        </div>
        {locked && (
          <p className="mt-1 text-xs text-stone-500">Fixed once a story has been published, so links to it keep working.</p>
        )}
      </div>

      <div>
        <label htmlFor="story-summary" className={labelClass}>Summary</label>
        <textarea
          id="story-summary"
          rows={2}
          className={inputClass}
          value={form.summary}
          onChange={(e) => update({ summary: e.target.value })}
          placeholder="One or two sentences shown on the News page and in search results."
        />
      </div>

      <div className="space-y-2">
        <span className={labelClass}>Main photo</span>
        {form.image ? (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <img src={form.image} alt="" className="w-full sm:w-56 aspect-[16/10] object-cover rounded-xl border border-stone-200" />
            <div className="flex-1 w-full space-y-2">
              <label htmlFor="story-image-alt" className={labelClass}>Photo description (for screen readers)</label>
              <input
                id="story-image-alt"
                className={inputClass}
                value={form.imageAlt}
                onChange={(e) => update({ imageAlt: e.target.value })}
                placeholder="Crowd gathered on Main Street for the parade"
              />
              <button type="button" onClick={() => update({ image: '', imageAlt: '' })} className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-red-700">
                <X className="w-3.5 h-3.5 mr-1" /> Remove photo
              </button>
            </div>
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-stone-300 text-sm text-stone-600 hover:border-senoia-red hover:text-senoia-red cursor-pointer">
            <ImagePlus className="w-4 h-4" />
            {busy === 'image' ? 'Uploading…' : 'Upload a photo'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadMainImage} disabled={busy === 'image'} />
          </label>
        )}
      </div>

      <div className="space-y-1">
        <span className={labelClass}>Story</span>
        <RichTextEditor
          initialHtml={form.bodyHtml}
          onChange={(bodyHtml) => update({ bodyHtml })}
          onUploadImage={uploadImage}
        />
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label htmlFor="story-date" className={labelClass}>Publish date</label>
          <input
            id="story-date"
            type="date"
            className={inputClass}
            value={form.day}
            onChange={(e) => update({ day: e.target.value })}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-stone-700 pb-2">
          <input type="checkbox" checked={form.showDate} onChange={(e) => update({ showDate: e.target.checked })} className="rounded" />
          Show the date on the story
        </label>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-stone-200">
        {isPublished ? (
          <button type="button" onClick={() => save('save')} disabled={Boolean(busy)} className="px-5 py-2.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred disabled:opacity-50 text-white text-sm font-semibold shadow-xs">
            {busy === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        ) : (
          <>
            <button type="button" onClick={() => save('publish')} disabled={Boolean(busy)} className="px-5 py-2.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred disabled:opacity-50 text-white text-sm font-semibold shadow-xs">
              {busy === 'publish' ? 'Publishing…' : 'Publish'}
            </button>
            <button type="button" onClick={() => save('save')} disabled={Boolean(busy)} className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 text-sm font-semibold">
              {busy === 'save' ? 'Saving…' : 'Save draft'}
            </button>
          </>
        )}
        <button type="button" onClick={cancel} disabled={Boolean(busy)} className="px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-stone-800">
          Cancel
        </button>
        {isPublished && (
          <a href={`/news/${story.slug}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center text-xs font-semibold text-stone-500 hover:text-senoia-red">
            View on site <ExternalLink className="ml-1 w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
