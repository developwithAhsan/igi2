#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISH="$ROOT/publish"

echo "==> Preparing the standalone IGI 2 Online website"
rm -rf "$PUBLISH"
mkdir -p "$PUBLISH"

echo "==> Generating the branded static website"
node "$ROOT/scripts/patch-web.mjs"

test -s "$PUBLISH/index.html" || { echo "publish/index.html is missing" >&2; exit 1; }
test -s "$PUBLISH/main.js" || { echo "publish/main.js is missing" >&2; exit 1; }

echo "==> Checking static assets"
FILE_COUNT="$(find "$PUBLISH" -type f | wc -l | tr -d ' ')"
if [[ "$FILE_COUNT" -lt 2 ]]; then
  echo "Build output is incomplete: $FILE_COUNT files" >&2
  exit 1
fi

echo "==> Worker assets ready: $FILE_COUNT files in $PUBLISH"
du -sh "$PUBLISH"
