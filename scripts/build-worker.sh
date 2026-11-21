#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE_DIR="$ROOT/engine/OpenIGI"
ENGINE_PROJECT="$ENGINE_DIR/apps/OpenIGI.Web/OpenIGI.Web.csproj"
ENGINE_COMMIT="719938d4413a9f7ffd408519c066091edcedf906"
DOTNET_DIR="${DOTNET_INSTALL_DIR:-$HOME/.dotnet}"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

for command in git curl bash node; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Required command not found: $command" >&2
    exit 1
  }
done

echo "==> Preparing the pinned OpenIGI engine ($ENGINE_COMMIT)"
if [[ ! -f "$ENGINE_PROJECT" ]]; then
  echo "Submodule content is unavailable; cloning the pinned upstream source."
  rm -rf "$ENGINE_DIR"
  mkdir -p "$(dirname "$ENGINE_DIR")"
  git clone --filter=blob:none https://github.com/developwithAhsan/OpenIGI.git "$ENGINE_DIR"
fi

git -C "$ENGINE_DIR" fetch --depth 1 origin "$ENGINE_COMMIT"
git -C "$ENGINE_DIR" checkout --force --detach "$ENGINE_COMMIT"
test -f "$ENGINE_PROJECT" || {
  echo "OpenIGI browser project was not found at the pinned revision." >&2
  exit 1
}

echo "==> Installing the .NET 10 SDK"
mkdir -p "$DOTNET_DIR"
curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$TEMP_DIR/dotnet-install.sh"
bash "$TEMP_DIR/dotnet-install.sh" --channel 10.0 --install-dir "$DOTNET_DIR" --no-path
export DOTNET_ROOT="$DOTNET_DIR"
export PATH="$DOTNET_DIR:$PATH"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1

echo "==> Installing the WebAssembly build workload"
(cd "$ENGINE_DIR" && dotnet workload install wasm-tools)

echo "==> Applying the local game-folder picker overlay"
node "$ROOT/scripts/patch-web.mjs"

echo "==> Publishing the browser runtime to a staging directory"
PUBLISH_STAGE="$ROOT/.cloudflare-publish-stage"
rm -rf "$ROOT/publish" "$PUBLISH_STAGE"
mkdir -p "$PUBLISH_STAGE" "$ROOT/publish"
(
  cd "$ENGINE_DIR"
  # Workers Static Assets reject any individual file larger than 25 MiB.
  # Keep the Emscripten/WebGPU runtime native, but interpret managed .NET IL
  # so it is emitted as small individual assemblies instead of one 35+ MiB AOT wasm.
  dotnet publish apps/OpenIGI.Web/OpenIGI.Web.csproj \
    --configuration Release \
    --output "$PUBLISH_STAGE" \
    --nologo \
    -p:RunAOTCompilation=false
)

echo "==> Flattening the actual browser web root into ./publish"
# Microsoft.NET.Sdk.WebAssembly publishes the website under wwwroot/. Cloudflare's
# assets.directory must point to the directory whose direct child is index.html.
if [[ -s "$PUBLISH_STAGE/wwwroot/index.html" ]]; then
  WEB_ROOT="$PUBLISH_STAGE/wwwroot"
elif [[ -s "$PUBLISH_STAGE/index.html" ]]; then
  # Defensive fallback for a future SDK that emits the web root directly.
  WEB_ROOT="$PUBLISH_STAGE"
else
  echo "Publish did not contain index.html in either wwwroot/ or its root." >&2
  find "$PUBLISH_STAGE" -maxdepth 3 -type f | head -80 >&2 || true
  exit 1
fi
cp -a "$WEB_ROOT/." "$ROOT/publish/"

# Publish the website pages, styles, images, audio and SEO files alongside the game runtime.
# site/index.html and site/favicon.svg are the same files already patched into the engine web root.
echo "==> Copying the IGI 2 website pages and static assets"
cp -a "$ROOT/site/." "$ROOT/publish/"

# The engine build patches the homepage with the WebGPU-ready Play gate and live download bridge.
# Restore that patched homepage after copying the source site, which would otherwise overwrite it.
cp "$WEB_ROOT/index.html" "$ROOT/publish/index.html"
grep -Fq "igi2-download-progress" "$ROOT/publish/index.html" || {
  echo "The published homepage is missing the live game-download progress bridge." >&2
  exit 1
}
grep -Fq "igi2-rotate-hint" "$ROOT/publish/index.html" || { echo "The player orientation hint is missing." >&2; exit 1; }
grep -Fq "Rotate your phone" "$ROOT/publish/index.html" || { echo "The player rotation guidance is missing." >&2; exit 1; }
grep -Fq "Checking GPU compatibility" "$ROOT/publish/index.html" || {
  echo "The published homepage is missing the inline GPU readiness message." >&2
  exit 1
}
if grep -Fq "Game engine is still preparing" "$ROOT/publish/index.html"; then
  echo "The old homepage readiness message was copied over the patched Play flow." >&2
  exit 1
fi

# Rebuild the exact original menu soundtrack from small, Git-tracked base64 chunks.
AUDIO_PARTS="$ROOT/audio_chunks/menu-background"
if [[ -d "$AUDIO_PARTS" ]]; then
  mkdir -p "$ROOT/publish/assets/audio"
  cat "$AUDIO_PARTS"/part-*.b64 | base64 --decode > "$ROOT/publish/assets/audio/menu-background.m4a"
  test -s "$ROOT/publish/assets/audio/menu-background.m4a"
fi

echo "==> Verifying the static asset output"
test -s "$ROOT/publish/index.html" || {
  echo "Flattening failed: publish/index.html is missing." >&2
  exit 1
}
test -s "$ROOT/publish/main.js" || {
  echo "Flattening failed: publish/main.js is missing." >&2
  exit 1
}
test -d "$ROOT/publish/_framework" || {
  echo "Flattening failed: publish/_framework is missing." >&2
  exit 1
}

FILE_COUNT="$(find "$ROOT/publish" -type f | wc -l | tr -d ' ')"
if [[ "$FILE_COUNT" -lt 5 ]]; then
  echo "Build output looks incomplete: only $FILE_COUNT files were produced." >&2
  exit 1
fi

# Fail here with a clear message rather than letting Wrangler fail later.
TOO_LARGE="$(find "$ROOT/publish" -type f -size +26214400c -print)"
if [[ -n "$TOO_LARGE" ]]; then
  echo "Cloudflare Workers Static Assets has a 25 MiB per-file limit; these files exceed it:" >&2
  printf '%s\\n' "$TOO_LARGE" >&2
  exit 1
fi

echo "==> Worker assets ready: $FILE_COUNT files in $ROOT/publish (all files <= 25 MiB)"
du -sh "$ROOT/publish"
