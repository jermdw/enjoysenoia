// Files migrated off Webflow's CDN, by path under webflow/ (e.g. 'site/logo.svg').
// They live in Firebase Storage (uploaded by scripts/upload_webflow_assets.sh);
// with no bucket configured, as in local dev, the copies downloaded to
// public/assets/webflow/ by scripts/webflow_pull.py are served instead.
const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

export const webflowAsset = (path) =>
  bucket
    ? `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(`webflow/${path}`)}?alt=media`
    : `/assets/webflow/${path}`;
