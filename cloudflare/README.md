# Deploy IGI 2 Online on Cloudflare Workers

This repository is configured for Cloudflare Workers Builds + Workers Static Assets (not Pages). The Worker is named igi2; Wrangler deploys the generated ./publish directory.

## Production build settings

| Setting | Value |
| --- | --- |
| Production branch | main |
| Root directory | / |
| Build command | npm run build:worker |
| Deploy command | npm run deploy |

The root wrangler.jsonc declares assets.directory = "./publish".

## Website and runtime

The build uses the branded page shell in site/index.html and applies it to the pinned browser engine using scripts/patch-web.mjs. The game engine is retained and loaded inside the homepage's 16:9 player frame. The page includes a working fullscreen control and an informational Settings panel.

The current browser runtime does not verify I.G.I. 2 game-data support. The site must not claim that unsupported I.G.I. 2 files are playable. Players select files they are legally entitled to use; proprietary game data is not hosted or redistributed by this site.

## Deploy

A push to main that changes a path included by the Worker Builds trigger starts a production build and deploy automatically. Monitor Workers & Pages > igi2 > Builds for the latest build and deployment result.

For local validation run npm install, npm run build:worker, then npx wrangler deploy --dry-run.
