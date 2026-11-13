import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('engine/OpenIGI/apps/OpenIGI.Web/wwwroot');
const indexPath = resolve(root, 'index.html');
const mainPath = resolve(root, 'main.js');

let html = await readFile(indexPath, 'utf8');
let js = await readFile(mainPath, 'utf8');

const buttonMarker = 'id="upload-game-folder"';
if (!html.includes(buttonMarker)) {
  const ownButton = '<button class="change" id="own" type="button" hidden>Play from my own game folder</button>';
  if (!html.includes(ownButton)) throw new Error('Could not find the upstream own-folder button; review upstream page changes before applying this overlay.');
  html = html.replace(
    ownButton,
    ownButton + '\n                <button class="change" id="upload-game-folder" type="button">Upload / choose game folder</button>\n                <input id="upload-game-input" type="file" webkitdirectory directory multiple hidden aria-label="Choose your Project I.G.I. game folder">'
  );
}

const declarations = "const change = $('change');";
if (!js.includes("const uploadFolder = $('upload-game-folder');")) {
  if (!js.includes(declarations)) throw new Error('Could not find the upstream landing-page element declarations.');
  js = js.replace(
    declarations,
    declarations + "\nconst uploadFolder = $('upload-game-folder');\nconst uploadInput = $('upload-game-input');"
  );
}

const listenerMarker = "    own.addEventListener('click', () => {";
if (!js.includes("uploadFolder.addEventListener('click'")) {
  if (!js.includes(listenerMarker)) throw new Error('Could not find the upstream folder-mode listener.');
  const listener = `    uploadFolder.addEventListener('click', () => uploadInput.click(), { signal: listening.signal });
    uploadInput.addEventListener('change', async () => {
      try {
        if (!uploadInput.files?.length) return;
        const picked = await files.fromFileList(uploadInput.files);
        ready = picked;
        folderMode = true;
        clear.hidden = true;
        offer('Play game', \`Found the game in /\${picked.name}. Ready.\`, 'ok', true);
      } catch (error) {
        if (error instanceof files.InstallationError) {
          offer('Choose game folder', error.message, 'error');
        } else {
          reject(error);
        }
      } finally {
        uploadInput.value = '';
      }
    }, { signal: listening.signal });

`;
  js = js.replace(listenerMarker, listener + listenerMarker);
}

if (!html.includes('IGI 2 Online visual refresh')) {
  if (!html.includes('</style>')) throw new Error('Could not find the landing page style block.');
  html = html.replace('</style>', "\n/* IGI 2 Online visual refresh: presentation only; original runtime and controls stay intact. */\n:root {\n  --bg: #10130f;\n  --text: #f0f0e8;\n  --soft: #d4d5c8;\n  --note: #c9cbbd;\n  --muted: #a8ad99;\n  --dim: #8c927f;\n  --faint: #777e6c;\n  --ok: #b2bd76;\n  --error: #df806b;\n}\n#landing {\n  background:\n    radial-gradient(90% 80% at 0% 100%, rgba(16, 19, 15, .82) 0%, rgba(16, 19, 15, .48) 42%, transparent 76%),\n    linear-gradient(to bottom, rgba(12, 15, 11, .48), transparent 24%, transparent 78%, rgba(12, 15, 11, .68)),\n    url(\"landing/bg.webp\") center / cover no-repeat,\n    radial-gradient(120% 90% at 85% 10%, #343b2b 0%, #1a2016 48%, #10130f 82%);\n}\n.path, .link-card {\n  border-color: rgba(178, 189, 118, .22);\n  background: rgba(15, 19, 13, .70);\n  border-radius: 12px;\n}\n.path { box-shadow: 0 12px 34px rgba(0, 0, 0, .16); }\n.link-card:hover {\n  border-color: rgba(194, 205, 135, .48);\n  background: rgba(24, 29, 19, .82);\n}\n.play {\n  background: #b2bd76;\n  color: #15190f;\n  border-radius: 8px;\n}\n.play:hover { background: #c4ce8c; }\n.play:disabled {\n  background: rgba(178, 189, 118, .28);\n  color: rgba(15, 19, 13, .78);\n}\n.change:hover { color: #e3e9c5; }\n.badge { background: rgba(178, 189, 118, .12); }\nfooter { border-top-color: rgba(178, 189, 118, .18); }\n" + '\n</style>');
}

await writeFile(indexPath, html);
await writeFile(mainPath, js);
console.log('Added the explicit local game-folder upload/picker control.');
