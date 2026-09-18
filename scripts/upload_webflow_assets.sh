#!/usr/bin/env bash
# Upload the files downloaded from Webflow to Firebase Storage under webflow/.
#
#   scripts/upload_webflow_assets.sh [bucket]    # default: enjoysenoia.firebasestorage.app
#
# Needs the files locally first (python3 scripts/webflow_pull.py --download-assets)
# and a gcloud account with write access to the bucket. Safe to re-run: rsync
# only uploads what is missing or changed, and never deletes from the bucket.
#
# Afterwards, point the app data at the bucket:
#   python3 scripts/webflow_transform.py --storage-bucket <bucket>
set -euo pipefail

BUCKET="${1:-enjoysenoia.firebasestorage.app}"
SRC="$(cd "$(dirname "$0")/.." && pwd)/public/assets/webflow"

if [ ! -d "$SRC" ]; then
  echo "No $SRC - run: python3 scripts/webflow_pull.py --download-assets" >&2
  exit 1
fi

# Every file name starts with its unique Webflow file id, so a given URL's
# content never changes and can be cached indefinitely.
gcloud storage rsync --recursive \
  --cache-control="public, max-age=31536000, immutable" \
  "$SRC" "gs://$BUCKET/webflow"

echo
echo "Uploaded to gs://$BUCKET/webflow. Next:"
echo "  python3 scripts/webflow_transform.py --storage-bucket $BUCKET"
