#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "This repository now deploys as a Cloudflare Worker. Use: npm run build:worker"
exec bash "$SCRIPT_DIR/build-worker.sh"
