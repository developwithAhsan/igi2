# IGI 2 Online

An IGI 2: Covert Strike-themed website shell deployed as a Cloudflare Worker.

## Website

- The landing page is branded **IGI 2 Online** with a tactical, military-inspired interface.
- OpenIGI branding, Discord links, upstream Project I.G.I. 1 hosted-data flow, and the IGI 1 browser play button are removed from the visible website.
- The central 16:9 mission display is a visual game frame only. It does not pretend to run IGI 2.
- The local folder picker inspects filenames in the browser and does not upload the selected files.

## Important engine limitation

The pinned OpenIGI upstream revision documents browser support only for the first six missions of Project I.G.I. 1. I.G.I. 2 browser support is not available. The IGI 2 desktop engine is still in development and does not have a released desktop build. Therefore this repository intentionally does not launch the IGI 1 runtime, does not present an IGI 2 game-data auto-download button, and does not claim that selecting a folder runs the game.

A real IGI 2 download-and-run workflow requires a released IGI 2-compatible desktop runtime and game data that the user is legally entitled to use. This site does not redistribute the original copyrighted game files. Do not add an unverified download URL or mirror.

## Build and Cloudflare deployment

This repository uses Cloudflare Workers Builds + Workers Static Assets (not Pages). Worker name: `igi2`.

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build:worker`
- Deploy command: `npm run deploy`

The build script fetches the pinned OpenIGI source for its existing .NET WebAssembly build pipeline, then applies `scripts/patch-web.mjs` to replace the upstream landing page and JavaScript with the IGI 2 Online interface. The browser runtime artifacts are still built and validated, but the new landing page does not load or launch the unsupported IGI 1 browser runtime.

For local validation run `npm install`, `npm run build:worker`, then `npx wrangler deploy --dry-run`.

## Legal

The OpenIGI engine is GPL-3.0; see `engine/OpenIGI/LICENSE` and `engine/OpenIGI/THIRD-PARTY-NOTICES.md`. The engine repository contains no original game assets. Players must use game data they legally own. This repository does not include or redistribute proprietary game files.
