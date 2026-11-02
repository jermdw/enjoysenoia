#!/usr/bin/env bash
# Upload the Masquerade's Red Carpet photos to the private/ prefix that the
# redCarpetPhotos function serves to guests with a magic link.
#
#   scripts/upload_red_carpet_photos.sh <photos-dir> [bucket]
#
# <photos-dir> is the photographer's download, holding
#   images-for-printing/high_res_red_carpet/     the print files (about 12 MB each)
#   images-for-web-or-mls/web_res_red_carpet/    the web set, used for thumbnails
# File names end in the photographer's number (mppmediadowntherabbithole123.JPG),
# which becomes the object name: full/123.jpg and thumb/123.jpg.
#
# Needs ImageMagick (magick) and a gcloud account with write access to the
# bucket. Before uploading anything it checks that storage.rules already keeps
# private/ closed, so deploy the rules first:
#   gh workflow run deploy-backend.yml --ref main -f only=rules
# Safe to re-run: rsync only uploads what is missing or changed.
set -euo pipefail

SRC="${1:?usage: $0 <photos-dir> [bucket]}"
BUCKET="${2:-enjoysenoia.firebasestorage.app}"
DEST="gs://$BUCKET/private/masquerade-2026/red-carpet"
FULL="$SRC/images-for-printing/high_res_red_carpet"
WEB="$SRC/images-for-web-or-mls/web_res_red_carpet"

[ -d "$FULL" ] || { echo "No $FULL" >&2; exit 1; }
command -v magick >/dev/null || { echo "Needs ImageMagick (brew install imagemagick)" >&2; exit 1; }

# The rules check: a probe object under private/ must NOT be publicly readable.
probe="private/rules-probe-$$.txt"
echo "probe" | gcloud storage cp - "gs://$BUCKET/$probe" --quiet
status=$(curl -s -o /dev/null -w '%{http_code}' \
  "https://firebasestorage.googleapis.com/v0/b/$BUCKET/o/${probe//\//%2F}?alt=media")
gcloud storage rm "gs://$BUCKET/$probe" --quiet
if [ "$status" = "200" ]; then
  echo "private/ is publicly readable: deploy storage.rules before uploading." >&2
  exit 1
fi
echo "Rules check: private/ answered $status to an anonymous read. Good."

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/full" "$STAGE/thumb"

count=0
for f in "$FULL"/*.[Jj][Pp][Gg]; do
  base="$(basename "$f")"
  n="$(echo "$base" | grep -oE '[0-9]+' | tail -1)"
  cp "$f" "$STAGE/full/$n.jpg"
  # Thumbnails come from the web set when it has the same photo; it is a
  # quarter of the size to read.
  src="$WEB/$base"; [ -f "$src" ] || src="$f"
  magick "$src" -auto-orient -resize '600x600>' -strip -quality 78 "$STAGE/thumb/$n.jpg"
  count=$((count + 1))
done
echo "Prepared $count photos. Uploading to $DEST ..."

gcloud storage rsync --recursive "$STAGE" "$DEST"

echo
echo "Uploaded $count photos to $DEST."
