#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
ENGINE_DIR="$ROOT/engine/OpenIGI"
ENGINE_COMMIT="719938d4413a9f7ffd408519c066091edcedf906"
DOTNET_DIR="$ROOT/.dotnet"

echo "==> Preparing pinned OpenIGI engine"
if [[ ! -f "$ENGINE_DIR/apps/OpenIGI.Web/OpenIGI.Web.csproj" ]]; then
  mkdir -p "$ROOT/engine"
  git clone --filter=blob:none https://github.com/developwithAhsan/OpenIGI.git "$ENGINE_DIR"
fi
git -C "$ENGINE_DIR" fetch --depth 1 origin "$ENGINE_COMMIT"
git -C "$ENGINE_DIR" checkout --detach "$ENGINE_COMMIT"

echo "==> Installing .NET 10 SDK"
mkdir -p "$DOTNET_DIR"
curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$ROOT/dotnet-install.sh"
bash "$ROOT/dotnet-install.sh" --channel 10.0 --install-dir "$DOTNET_DIR"
export DOTNET_ROOT="$DOTNET_DIR"
export PATH="$DOTNET_DIR:$PATH"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1

echo "==> Installing WebAssembly build workload"
dotnet workload install wasm-tools

echo "==> Applying website upload-folder control"
node "$ROOT/scripts/patch-web.mjs"

echo "==> Publishing OpenIGI browser website"
dotnet publish "$ENGINE_DIR/apps/OpenIGI.Web/OpenIGI.Web.csproj" \
  --configuration Release \
  --output "$ROOT/publish"

echo "==> Adding Cloudflare Pages response headers"
cat > "$ROOT/publish/_headers" <<'HEADERS'
/_framework/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=31536000, immutable

/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=3600

/*.css
  Cache-Control: public, max-age=3600
HEADERS

test -f "$ROOT/publish/index.html"
echo "==> Cloudflare Pages output is ready: $ROOT/publish"
