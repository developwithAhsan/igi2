# Deploy IGI2 on Cloudflare Workers

This repository is configured for **Cloudflare Workers Builds + Workers Static Assets**. It is not a Cloudflare Pages project. The Worker name is `igi2`, and Wrangler reads the built website from `./publish` using `wrangler.jsonc`.

## Cloudflare Workers Builds settings

The GitHub repository is `developwithAhsan/igi2`, production branch `main`, root directory `/`.

Set these values under **Workers & Pages → igi2 → Settings → Builds**:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build:worker` |
| Deploy command | `npm run deploy` |

No manual output-directory field is required. The root `wrangler.jsonc` explicitly declares `assets.directory = "./publish"`; Wrangler uploads that directory as the Worker's static assets.

## What the build does

1. Cloudflare installs the pinned Wrangler dependency from `package.json`.
2. `scripts/build-worker.sh` ensures the OpenIGI source at pinned commit `719938d4413a9f7ffd408519c066091edcedf906` is available. If the Git submodule was not initialized by the Git provider, the script clones the upstream repository and checks out that exact commit.
3. It installs .NET 10 and the `wasm-tools` workload.
4. It applies the local game-folder picker overlay.
5. It publishes the browser runtime to `publish/` and checks that `index.html`, `main.js`, and the .NET framework assets exist.
6. The deploy command runs Wrangler. Wrangler reads `wrangler.jsonc` and deploys the files in `publish/` as Worker static assets.

This is the fix for the previous error, **“Could not detect a directory containing static files”**: the Worker now has an explicit static-assets directory, and its build command creates that directory before Wrangler deploys.

## First deployment or retry

1. Open the `igi2` Worker in the Cloudflare dashboard.
2. Confirm the Builds settings match the table above.
3. Go to **Deployments** and select the latest build on `main`. A push to `main` also starts a new production build automatically.
4. Open the production `workers.dev` URL after the deployment reports success.

## Build validation

GitHub Actions runs the same build script and then runs `wrangler deploy --dry-run` to validate the static-assets configuration without publishing. Check the [GitHub Actions runs](https://github.com/developwithAhsan/igi2/actions) if a build fails.

## Runtime and game-data limitations

- The upstream browser runtime requires HTTPS and a browser/device with WebGPU.
- Upstream currently documents browser support for the first six Project I.G.I. missions. I.G.I. 2 browser support is not yet available.
- The upstream hosted-data URL is used by the engine. Only use game data you are authorized to access or distribute. This repository does not include proprietary game assets.
- The local folder picker reads the selected game files in the visitor's browser; it does not upload them to this GitHub repository.

## Troubleshooting

For Cloudflare failures, open **Workers & Pages → igi2 → Builds → failed build → Logs**. The build log should show the separate build and deploy commands. If the .NET step fails, copy the first .NET error and the final 30 log lines.
