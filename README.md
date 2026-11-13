# IGI2 Web Edition

Browser website built on the OpenIGI engine.

## What is included

- The complete OpenIGI source is pinned as a Git submodule at `engine/OpenIGI` (upstream commit `719938d4413a9f7ffd408519c066091edcedf906`).
- The browser application uses the upstream `.NET 10` WebAssembly + WebGPU runtime, game host, renderer, audio, input, virtual file system and mission-loading code. This is the real engine integration, not a mock canvas.
- The landing page offers the upstream hosted-data auto-download path first, plus a separate local game-folder picker. The added **Upload / choose game folder** control reads the selected folder locally in the browser; it does not upload the files to this repository or a server.
- Hosted game data is fetched from the upstream default endpoint `https://data.openigi.com/igi1/` and cached in the browser. It can be changed with the upstream `?data-host=<url>` option. Only use hosted data you are authorized to distribute.

## Browser support status

The upstream README currently reports browser support for the first six Project I.G.I. missions with original graphics. I.G.I. 2 missions can run in the upstream desktop engine, but I.G.I. 2 browser support is not currently available. The site must not advertise I.G.I. 2 as playable in-browser until upstream adds that capability.

A current browser with WebGPU and a secure HTTPS origin is required. WebGPU availability depends on the browser, operating system and GPU. A browser without WebGPU cannot start the game.

## Build and Cloudflare deployment

For Cloudflare Pages Git integration, use the dashboard settings in [cloudflare/README.md](cloudflare/README.md). The build command is `bash scripts/cloudflare-pages-build.sh` and the output directory is `publish`.

For local builds, clone with the engine submodule, install the .NET 10 SDK and `wasm-tools` workload, run `node scripts/patch-web.mjs`, then publish `engine/OpenIGI/apps/OpenIGI.Web/OpenIGI.Web.csproj` to `publish/`.

The GitHub Actions workflow separately checks the upstream browser build and uploads its output as an Actions artifact.

## Engine updates

The engine is pinned to a known upstream commit for reproducible builds. Update the gitlink only after reviewing upstream changes and re-testing the browser build.

## License and game data

OpenIGI is licensed under GPL-3.0; see `engine/OpenIGI/LICENSE` and `engine/OpenIGI/THIRD-PARTY-NOTICES.md`. The engine repository does not include original Project I.G.I. game assets. Players should use game data they legally own. This repository does not include or redistribute proprietary game files.
