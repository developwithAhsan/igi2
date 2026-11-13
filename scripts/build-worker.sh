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

echo "==> Publishing the browser runtime to ./publish"
rm -rf "$ROOT/publish"
mkdir -p "$ROOT/publish"
(
  cd "$ENGINE_DIR"
  dotnet publish apps/OpenIGI.Web/OpenIGI.Web.csproj \
    --configuration Release \
    --output "$ROOT/publish" \
    --nologo
)

echo "==> Verifying the static asset output"
test -s "$ROOT/publish/index.html" || {
  echo "Build did not produce publish/index.html." >&2
  exit 1
}
test -s "$ROOT/publish/main.js" || {
  echo "Build did not produce publish/main.js." >&2
  exit 1
}
test -d "$ROOT/publish/_framework" || {
  echo "Build did not produce the .NET WebAssembly framework directory." >&2
  exit 1
}

FILE_COUNT="$(find "$ROOT/publish" -type f | wc -l | tr -d ' ')"
if [[ "$FILE_COUNT" -lt 5 ]]; then
  echo "Build output looks incomplete: only $FILE_COUNT files were produced." >&2
  exit 1
fi

echo "==> Worker assets ready: $FILE_COUNT files in $ROOT/publish"
du -sh "$ROOT/publish"
