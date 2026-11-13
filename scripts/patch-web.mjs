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

await writeFile(indexPath, html);
await writeFile(mainPath, js);
console.log('Added the explicit local game-folder upload/picker control.');
