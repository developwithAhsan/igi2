# IGI 2 Online

A fan-made IGI 2 themed website shell deployed as a Cloudflare Worker at https://igi2.online/.

## Website

- The public brand is **IGI 2 Online**. The header, page title, favicon, footer, visual design and SEO metadata use the IGI 2 identity.
- The homepage has a framed browser-game area, Play Game flow, a working fullscreen control, an informational Settings panel, About, PC controls, FAQ, comments placeholder and footer.
- Discord cards, upstream social widgets, desktop installer promotions and external upstream branding are not shown on the public site.
- The browser game runtime is preserved and loaded inside the new frame. The page clearly notes that the available browser runtime does not currently verify I.G.I. 2 game-data support.
- Players select game files they are legally entitled to use. The site does not host or redistribute original proprietary game files.

## Browser runtime status

The current web runtime in the pinned engine source has limited browser compatibility and is documented upstream for the first Project I.G.I. title. I.G.I. 2 campaign support is still in development and no released I.G.I. 2 browser build is available at this pinned revision. The interface is branded for IGI 2, but the actual game that can run depends on the compatible runtime and files supplied by the player.

## Build and Cloudflare deployment

This repository uses Cloudflare Workers Builds + Workers Static Assets (not Pages). Worker name: igi2.

- Production branch: main
- Root directory: /
- Build command: npm run build:worker
- Deploy command: npm run deploy

The build downloads the pinned engine submodule, applies the site/index.html presentation shell through scripts/patch-web.mjs, builds the web runtime and deploys the generated publish/ assets.

For local validation run npm install, npm run build:worker, then npx wrangler deploy --dry-run.

## SEO

- Canonical URL: https://igi2.online/
- Open Graph and Twitter URL/title/description are set for the new domain.
- Structured data describes the website, the I.G.I. 2 game and the FAQ content.
- Page title and description are written for the IGI 2 Online homepage.

## Legal

The browser engine source is licensed under GPL-3.0; see the engine license and third-party notices. This website is an independent fan-made project and is not affiliated with or endorsed by the game's publisher. Players must provide game data they are legally entitled to use.
