# Deploy IGI 2 Online on Cloudflare Workers

This repository is configured for **Cloudflare Workers Builds + Workers Static Assets** (not Pages). The Worker is named `igi2`; Wrangler deploys the generated `./publish` directory.

## Production build settings

Under **Workers & Pages → igi2 → Settings → Builds**, use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build:worker` |
| Deploy command | `npm run deploy` |

The root `wrangler.jsonc` declares `assets.directory = "./publish"`.

## What the build does

1. Installs the pinned Wrangler CLI from `package.json`.
2. Runs `scripts/build-worker.sh`.
3. Generates the standalone IGI 2 Online landing page and local-folder inspection UI into `publish/`.
4. Checks that `index.html` and `main.js` exist.
5. Runs Wrangler to deploy `publish/` as Worker static assets.

The site build is intentionally static and lightweight. It does not compile or launch the unsupported IGI 1 browser runtime.

## Deploy

A push to `main` that changes a path included by the Worker Builds trigger starts a production build and deploy automatically. The configured included paths are `scripts/**`, `engine/**`, `package.json`, `wrangler.jsonc`, and `.gitmodules`.

Monitor **Workers & Pages → igi2 → Builds** for the latest build and deployment result. The GitHub Actions workflow separately runs the same static build and `npx wrangler deploy --dry-run` validation.

## Game and download limitations

- The 16:9 mission frame is currently a branded visual placeholder, not live gameplay.
- The folder picker inspects the user's selected local folder; it does not upload or execute those files.
- Upstream currently documents no IGI 2 browser support and no released IGI 2 desktop build. Do not claim the game can be played until a compatible engine build exists.
- The website does not host proprietary game files or provide an unauthorized game-data download. Any future download must use game data the site owner is legally authorized to distribute.

## Troubleshooting

For deployment failures, open **Workers & Pages → igi2 → Builds → failed build → Logs**. The build should show the static-site generation step followed by Wrangler deployment.
