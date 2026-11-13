# Deploy IGI2 to Cloudflare Pages

This repository is prepared for **Cloudflare Pages Git integration**. You create the Cloudflare project yourself; no Cloudflare token or account credentials are stored in this repository.

## Cloudflare Pages dashboard settings

Open https://dash.cloudflare.com/ and go to **Workers & Pages → Create application → Pages → Connect to Git**. Select GitHub repository `developwithAhsan/igi2`.

Use these exact settings:

| Setting | Value |
| --- | --- |
| Project name | `igi2-web` (or another available name) |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `/` (repository root) |
| Build command | `bash scripts/cloudflare-pages-build.sh` |
| Build output directory | `publish` |

No environment variables are required. The build script clones the pinned OpenIGI source revision, installs the .NET 10 SDK and WebAssembly workload, applies the local-folder picker overlay, and publishes the actual upstream browser app to `publish/`.

## First deployment

1. Connect the repository using the settings above and select **Save and Deploy**.
2. Wait for the build to finish. The first build may take several minutes because it installs the .NET SDK and WebAssembly workload and compiles the engine.
3. Open the generated `*.pages.dev` URL and test the page over HTTPS.
4. In Cloudflare Pages, open **Settings → Builds & deployments** to confirm the production branch is `main`.

## Later updates

Every push to `main` triggers a new production build. Pull requests and other branches can be used for preview deployments.

## Important runtime requirements

- The upstream browser runtime requires a modern browser with WebGPU and a secure HTTPS origin. Devices/browsers without WebGPU cannot start the game.
- Upstream currently documents browser support for the first six Project I.G.I. missions. I.G.I. 2 browser support is not yet available.
- The upstream automatic game-data endpoint is used by the browser app. Only use game data you are authorized to access/distribute. The repository does not include proprietary game assets.
- The folder picker reads selected files locally in the visitor's browser; it does not upload the game folder to this repository.

## Build troubleshooting

Open **Workers & Pages → your project → Deployments → failed deployment → Build log**.

If the build fails, copy the first actual error (not just the final exit-code line). The most likely failure points are the .NET SDK/workload install or an upstream engine change that no longer matches the pinned UI overlay.
