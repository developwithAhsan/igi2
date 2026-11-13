# IGI 2 Online

An IGI 2: Covert Strike-themed website shell deployed as a Cloudflare Worker.

## Website

- The landing page is branded **IGI 2 Online** with a tactical, military-inspired interface.
- OpenIGI branding, Discord links, upstream Project I.G.I. 1 hosted-data flow, and the IGI 1 browser play button are removed from the visible website.
- The central 16:9 mission display is a visual game frame only. It does not pretend to run IGI 2.
- The local folder picker inspects filenames in the browser and does not upload selected files.

## Engine and download status

The OpenIGI upstream project currently documents browser support only for the first six missions of Project I.G.I. 1. I.G.I. 2 browser support is not available, and the IGI 2 desktop engine is still in development without a released desktop build. This website therefore does not launch the IGI 1 runtime, does not advertise an IGI 2 game-data auto-download, and does not claim that selecting a folder runs the game.

A genuine IGI 2 download-and-run workflow requires a released IGI 2-compatible desktop runtime and game data the user is legally entitled to use. This site does not redistribute the original copyrighted game files or link to unverified mirrors.

## Build and Cloudflare deployment

This repository uses Cloudflare Workers Builds + Workers Static Assets (not Pages). Worker name: `igi2`.

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build:worker`
- Deploy command: `npm run deploy`

The build is a lightweight static-site build: `scripts/patch-web.mjs` generates the branded `publish/index.html` and `publish/main.js`, and Wrangler deploys `publish/` as Worker static assets. It no longer compiles the unused, unsupported IGI 1 browser runtime.

For local validation run `npm install`, `npm run build:worker`, then `npx wrangler deploy --dry-run`.

## Legal

The OpenIGI engine source is GPL-3.0; see `engine/OpenIGI/LICENSE` and `engine/OpenIGI/THIRD-PARTY-NOTICES.md`. The engine repository contains no original game assets. Players must use game data they legally own. This repository does not include or redistribute proprietary game files.
