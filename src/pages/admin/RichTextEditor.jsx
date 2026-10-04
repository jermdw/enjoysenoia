import React, { useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
  ImagePlus, Undo2, Redo2,
} from 'lucide-react';

/**
 * The story body editor. Produces plain semantic HTML (paragraphs, headings,
 * lists, links, images) that RichText renders on the public site; the content
 * area carries the same `rich-text` class, so what an editor sees is what
 * visitors get.
 *
 * Images are uploaded through `onUploadImage` and inserted by URL. Pasted
 * base64 images are refused: a story is one Firestore document, capped at
 * 1 MiB, and an inline photo would blow straight through it.
 */
export default function RichTextEditor({ initialHtml, onChange, onUploadImage }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Image.configure({ allowBase64: false }),
    ],
    content: initialHtml || '',
    editorProps: {
      attributes: {
        class: 'rich-text min-h-[320px] px-5 py-4 text-stone-700 leading-relaxed focus:outline-none',
        'aria-label': 'Story text',
      },
    },
    // TipTap keeps an empty paragraph after a closing list or image so the
    // cursor has somewhere to go; it isn't content, so it isn't saved.
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML().replace(/(<p><\/p>)+$/, '')),
  });

  // TipTap 3 no longer re-renders on every keystroke; the toolbar subscribes
  // to just the states it shows.
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive('bold') ?? false,
      italic: e?.isActive('italic') ?? false,
      h2: e?.isActive('heading', { level: 2 }) ?? false,
      h3: e?.isActive('heading', { level: 3 }) ?? false,
      bullet: e?.isActive('bulletList') ?? false,
      ordered: e?.isActive('orderedList') ?? false,
      quote: e?.isActive('blockquote') ?? false,
      link: e?.isActive('link') ?? false,
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
    }),
  });

  if (!editor) return null;

  const run = (fn) => () => fn(editor.chain().focus()).run();

  const setLink = () => {
    const current = editor.getAttributes('link').href || '';
    const url = window.prompt('Link to (leave empty to remove the link):', current);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const insertImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const src = await onUploadImage(file);
      const alt = window.prompt('Briefly describe the photo for visitors using screen readers:', '') || '';
      editor.chain().focus().setImage({ src, alt }).run();
    } catch (err) {
      setUploadError(err.message || 'The image could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const tools = [
    { label: 'Bold', icon: Bold, on: active.bold, action: run((c) => c.toggleBold()) },
    { label: 'Italic', icon: Italic, on: active.italic, action: run((c) => c.toggleItalic()) },
    { label: 'Heading', icon: Heading2, on: active.h2, action: run((c) => c.toggleHeading({ level: 2 })) },
    { label: 'Subheading', icon: Heading3, on: active.h3, action: run((c) => c.toggleHeading({ level: 3 })) },
    { label: 'Bulleted list', icon: List, on: active.bullet, action: run((c) => c.toggleBulletList()) },
    { label: 'Numbered list', icon: ListOrdered, on: active.ordered, action: run((c) => c.toggleOrderedList()) },
    { label: 'Quote', icon: Quote, on: active.quote, action: run((c) => c.toggleBlockquote()) },
    { label: 'Link', icon: LinkIcon, on: active.link, action: setLink },
  ];

  const buttonClass = (on) =>
    `p-2 rounded-lg transition-colors disabled:opacity-40 ${
      on ? 'bg-senoia-red text-white' : 'text-stone-600 hover:bg-stone-200'
    }`;

  return (
    <div className="border border-stone-300 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-senoia-red/30">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-stone-200 bg-stone-50" role="toolbar" aria-label="Formatting">
        {tools.map(({ label, icon: Icon, on, action }) => (
          <button key={label} type="button" onClick={action} className={buttonClass(on)} title={label} aria-label={label} aria-pressed={on}>
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className={buttonClass(false)}
          title="Insert photo"
          aria-label="Insert photo"
        >
          <ImagePlus className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-stone-300 mx-1" aria-hidden="true" />
        <button type="button" onClick={run((c) => c.undo())} disabled={!active.canUndo} className={buttonClass(false)} title="Undo" aria-label="Undo">
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={run((c) => c.redo())} disabled={!active.canRedo} className={buttonClass(false)} title="Redo" aria-label="Redo">
          <Redo2 className="w-4 h-4" />
        </button>
        {uploading && <span className="ml-2 text-xs text-stone-500" role="status">Uploading photo…</span>}
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={insertImage} />
      </div>
      {uploadError && <p className="px-4 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100">{uploadError}</p>}
      <EditorContent editor={editor} />
    </div>
  );
}
