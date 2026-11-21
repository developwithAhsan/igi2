import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('engine/OpenIGI/apps/OpenIGI.Web/wwwroot');
const indexPath = resolve(root, 'index.html');
const mainPath = resolve(root, 'main.js');
const gameFilesPath = resolve(root, 'game-files.js');
const programPath = resolve('engine/OpenIGI/apps/OpenIGI.Web/Program.cs');
const siteIndex = await readFile(resolve('site/index.html'), 'utf8');
const favicon = await readFile(resolve('site/favicon.svg'), 'utf8');
let gameFiles = await readFile(gameFilesPath, 'utf8');
let program = await readFile(programPath, 'utf8');

let js = await readFile(mainPath, 'utf8');

// Keep the IGI 2 brand separate from the title supported by the browser runtime.
// Default to the same first-game data endpoint used by the OpenIGI browser build; a site owner can override it with ?data-host=.
js = js.replace(
  /const HOSTED_DATA = new URL\([\s\S]*?\);/,
  "const HOSTED_DATA = new URL(query.get('data-host') || 'https://data.openigi.com/igi1/', location.href).href.replace(/\\/?$/, '/');"
);
if (!js.includes("const HOSTED_DATA = new URL(query.get('data-host') || 'https://data.openigi.com/igi1/'")) throw new Error('Hosted IGI 1 data source was not configured.');
js = js.replace(
  'const hosted = await files.hostedStatus(HOSTED_DATA);',
  'const hosted = HOSTED_DATA ? await files.hostedStatus(HOSTED_DATA) : null;'
);
js = js.replace(
  "const HINT = 'The folder with IGI.exe in it, usually pc inside the installation.';",
  "const HINT = 'Select your supported game folder.';"
);
js = js.replace(
  "  $('status').textContent = status;\\n  $('status').dataset.tone = tone;",
  "  $('status').textContent = status;\\n  $('status').title = status;\\n  $('status').dataset.tone = tone;"
);
js = js.replace(
  [
    "        if (picked) {",
    "          ready = picked;",
    "          if (picked.handle) await files.rememberFolder(picked.handle);",
    "          offer('Play IGI2', `Found the game in /${picked.name}. Ready.`, 'ok', true);",
    "        }"
  ].join('\n'),
  [
    "        if (picked) {",
    "          if (picked.handle) await files.rememberFolder(picked.handle);",
    "          resolve(picked);",
    "          return;",
    "        }"
  ].join('\n')
);


js = js.replace(/else offer\('Choose game folder', hosted === null \? .+ : HINT\);/, "else offer('Play Game', HINT);");
js = js.split("'Play game'").join("'Play IGI2'");
js = js.split("'Play now'").join("'Play IGI2'");
js = js.split("'Choose game folder'").join("'Play IGI2'");
js = js.replace("else offer('Play Game', HINT);", "else offer('Play IGI2', HINT);");

// Keep the full homepage visible while the browser game runs inside its framed display.
js = js.replace(
  'function showLanding() {\n  canvas.hidden = true;\n  landing.hidden = false;\n}',
  "function showLanding() {\n  canvas.hidden = true;\n  landing.hidden = false;\n  $('game-frame').classList.remove('is-running');\n  $('game-prompt').hidden = false;\n  $('engine-overlay').hidden = true;\n  window.dispatchEvent(new Event('igi2-game-returned'));\n}"
);
js = js.replace(
  '  landing.hidden = true;\n  canvas.hidden = false;\n  canvas.focus();\n  game.Boot(args);',
  "  landing.hidden = false;\n  canvas.hidden = false;\n  $('game-frame').classList.add('is-running');\n  $('game-prompt').hidden = true;\n  $('engine-overlay').hidden = false;\n  canvas.focus();\n  game.Boot(args);"
);

// Remove the upstream installer promotion and Discord/GitHub community widgets.
js = js.replace(
  /\n\/\/ The macOS and Linux install command,[\s\S]*?\n\/\/ --- The community[\s\S]*?\n\/\/ What the header says about the browser, as soon as it is known\./,
  '\n// Player display controls. Settings remain informational until runtime settings are exposed.\n'
);

// The player chooses fullscreen explicitly; do not force the whole page into fullscreen on touch devices.
js = js.replace(
  /function takeTheScreen\(\) \{[\s\S]*?\n\}/,
  'function takeTheScreen() { /* Use the framed Fullscreen control when requested. */ }'
);

js += [
  "const settingsButton = $('settings');",
  "const settingsPanel = $('settings-panel');",
  "const settingsClose = $('settings-close');",
  "settingsButton.addEventListener('click', () => {",
  "  const open = settingsPanel.hidden;",
  "  settingsPanel.hidden = !open;",
  "  settingsButton.setAttribute('aria-expanded', String(open));",
  "});",
  "settingsClose.addEventListener('click', () => {",
  "  settingsPanel.hidden = true;",
  "  settingsButton.setAttribute('aria-expanded', 'false');",
  "});",
  "document.addEventListener('keydown', event => {",
  "  if (event.key === 'Escape' && !settingsPanel.hidden) {",
  "    settingsPanel.hidden = true;",
  "    settingsButton.setAttribute('aria-expanded', 'false');",
  "  }",
  "});",
  "const fullscreenButton = $('fullscreen');",
  "fullscreenButton.addEventListener('click', async () => {",
  "  try {",
  "    if (document.fullscreenElement) await document.exitFullscreen();",
  "    else await $('player-shell').requestFullscreen({ navigationUI: 'hide' });",
  "  } catch (error) { console.warn('Fullscreen is unavailable:', error); }",
  "});",
  "document.addEventListener('fullscreenchange', () => {",
  "  const label = fullscreenButton.querySelector('span');",
  "  if (label) label.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';",
  "});"
].join('\n') + '\n';


// Play the menu music and interface sounds supplied with the IGI 2 website package.
js = js.replace(
  "  landing.hidden = true;\\n  canvas.hidden = false;",
  "  window.igi2MenuMusic?.pause();\\n  landing.hidden = true;\\n  canvas.hidden = false;"
);
js = js.replace(
  "  showLanding();\\n  offer(label, status, tone);",
  "  showLanding();\\n  window.igi2MenuMusic?.play().catch(() => {});\\n  offer(label, status, tone);"
);

js += [
  "// IGI 2 menu choices outside Play: explain unavailable actions instead of faking game behavior.",
  "const mainMenu = $('mm');",
  "const creditsMenu = $('cr');",
  "const menuTitle = $('ttl');",
  "const showMenuNotice = (message, tone = 'neutral') => {",
  "  if (!$('loading').hidden) return;",
  "  $('action').hidden = false;",
  "  $('loading').hidden = true;",
  "  $('status').textContent = message;",
  "  $('status').dataset.tone = tone;",
  "};",
  "mainMenu.querySelectorAll('[data-menu-action]').forEach(button => {",
  "  button.addEventListener('click', () => {",
  "    if (!$('loading').hidden) return;",
  "    const action = button.dataset.menuAction;",
  "    if (action === 'multiplayer') showMenuNotice('Multiplayer sessions are not configured in this browser build.', 'error');",
  "    else if (action === 'configuration') {",
  "      settingsPanel.hidden = false;",
  "      settingsButton.setAttribute('aria-expanded', 'true');",
  "      showMenuNotice('Display settings opened below the game screen.');",
  "    }",
  "    else if (action === 'player') showMenuNotice('Choose your game folder and start the game before selecting a player profile.');",
  "    else if (action === 'credits') { mainMenu.hidden = true; creditsMenu.hidden = false; menuTitle.textContent = 'Credits'; }",
  "    else if (action === 'quit') showMenuNotice('To exit, close this browser tab.');",
  "  });",
  "});",
  "$('back').addEventListener('click', () => {",
  "  creditsMenu.hidden = true;",
  "  mainMenu.hidden = false;",
  "  menuTitle.textContent = 'Main Menu';",
  "});",
  "for (const button of mainMenu.querySelectorAll('.igi2-menu-choice')) {",
  "  button.addEventListener('mouseenter', () => {",
  "    mainMenu.querySelectorAll('.igi2-menu-choice').forEach(item => item.classList.remove('is-active'));",
  "    button.classList.add('is-active');",
  "  });",
  "  button.addEventListener('focus', () => {",
  "    mainMenu.querySelectorAll('.igi2-menu-choice').forEach(item => item.classList.remove('is-active'));",
  "    button.classList.add('is-active');",
  "  });",
  "}",
  "document.addEventListener('keydown', event => {",
  "  if (event.key === 'Escape' && !creditsMenu.hidden && !menuRootHidden()) {",
  "    creditsMenu.hidden = true;",
  "    mainMenu.hidden = false;",
  "    menuTitle.textContent = 'Main Menu';",
  "  }",
  "});",
  "function menuRootHidden() { return $('game-prompt').hidden; }"
].join('\n') + '\n';

// Download the full hosted first-game data set before launching, with one accurate combined progress bar.
const prefetchGuard = [
  "      const connection = navigator.connection;",
  "      if (connection?.saveData || /(^|-)(2g|3g)$/.test(connection?.effectiveType ?? '')) return;"
].join('\n');
if (!gameFiles.includes(prefetchGuard)) throw new Error('Could not enable full hosted game download before launch.');
gameFiles = gameFiles.replace(prefetchGuard, "      // Play is an explicit request to download the complete hosted game before launch.\n");

const oldDownloadBlock = [
  "  if (source.hosted) {",
  "    // The bundle read before the game starts comes in first, with how fast; a mission's comes in when the",
  "    // mission is chosen, with the game's own wait for it on the screen.",
  "    const began = performance.now();",
  "    source.onDownload = (name, got, size) => {",
  "      if (name !== 'base') return;",
  "      const rate = got / Math.max(0.001, (performance.now() - began) / 1000);",
  "      progress('Downloading game files', got / size, `${mb(got)} of ${mb(size)} MB · ${(rate / 1048576).toFixed(1)} MB/s`);",
  "    };",
  "  }",
  "  const read = await files.load(source, fs, GAME_ROOT, (done, total) =>",
  "    progress(source.hosted ? 'Unpacking game files' : 'Reading game files', total ? done / total : 0, `${mb(done)} of ${mb(total)} MB`));",
  "  console.log(`Read ${read.files} files; ${read.deferred} wait for their missions.`);",
  "  if (source.hosted) source.onDownload = null;"
].join('\n');
const newDownloadBlock = [
  "  const pendingDownload = source.hosted ? await files.hostedStatus(HOSTED_DATA) : null;",
  "  const downloadedByBundle = new Map();",
  "  if (source.hosted) {",
  "    const began = performance.now();",
  "    source.onDownload = (name, got, size) => {",
  "      downloadedByBundle.set(name, Math.min(got, size));",
  "      const received = [...downloadedByBundle.values()].reduce((sum, value) => sum + value, 0);",
  "      const total = pendingDownload?.all || size;",
  "      const fraction = total > 0 ? Math.min(received / total, 1) : 1;",
  "      const rate = received / Math.max(0.001, (performance.now() - began) / 1000);",
  "      progress('Downloading all game files', fraction, `${Math.round(fraction * 100)}% · ${mb(received)} of ${mb(total)} MB · ${(rate / 1048576).toFixed(1)} MB/s`);",
  "    };",
  "  }",
  "  const read = await files.load(source, fs, GAME_ROOT, (done, total) =>",
  "    progress(source.hosted ? 'Preparing game files' : 'Reading game files', total ? done / total : 0, `${mb(done)} of ${mb(total)} MB`));",
  "  if (source.hosted && typeof source.prefetch === 'function') {",
  "    await source.prefetch();",
  "    progress('Game files ready', 1, `100% · ${mb(pendingDownload?.total ?? 0)} MB`);",
  "  }",
  "  console.log(`Read ${read.files} files; ${read.deferred} wait for their missions.`);",
  "  if (source.hosted) source.onDownload = null;"
].join('\n');
if (!js.includes(oldDownloadBlock)) throw new Error('Could not find the browser download progress block to upgrade.');
js = js.replace(oldDownloadBlock, newDownloadBlock);

// Route a verified game folder to the matching title runtime, including I.G.I. 2.
const replaceGameFiles = (before, after, label) => { if (!gameFiles.includes(before)) throw new Error("Could not patch " + label + " in game-files.js."); gameFiles = gameFiles.replace(before, after); };
replaceGameFiles("const TOP_LEVEL_FILE = /\\.(qvm|cfg|txt|ini|dat)$|^igi\\.exe$/i;", "const TOP_LEVEL_FILE = /\\.(qvm|cfg|txt|ini|dat)$|^igi2?\\.exe$/i;", "the game executable signature");
replaceGameFiles("async function locate(picked, candidates) {\n  let sequel = false;\n  for (const candidate of candidates) {\n    const verdict = judge(await candidate.kinds());\n    if (verdict === 'igi1') return candidate.name;\n    sequel ||= verdict === 'igi2';\n  }\n\n  throw new InstallationError(sequel\n    ? `/${picked} is I.G.I. 2: Covert Strike. Choose Project I.G.I.'s folder instead.`\n    : `No Project I.G.I. installation in /${picked}. Choose the folder with IGI.exe in it, usually pc.`);\n}", "async function locate(picked, candidates) {\n  for (const candidate of candidates) {\n    const verdict = judge(await candidate.kinds());\n    if (verdict) return { name: candidate.name, title: verdict };\n  }\n  throw new InstallationError(`No supported game installation in /${picked}. Choose the folder containing igi2.exe or config.qvm.`);\n}", "the game-folder detector");
replaceGameFiles("  const found = await locate(handle.name, candidates);\n  const root = found ? await handle.getDirectoryHandle(found) : handle;\n\n  return {\n    name: found ? `${handle.name}/${found}` : handle.name,", "  const found = await locate(handle.name, candidates);\n  const root = found.name ? await handle.getDirectoryHandle(found.name) : handle;\n\n  return {\n    name: found.name ? `${handle.name}/${found.name}` : handle.name,\n    title: found.title,", "the directory picker title");
replaceGameFiles("  const found = await locate(picked, candidates);\n  return found ? `${found}/` : '';", "  const found = await locate(picked, candidates);\n  return { prefix: found.name ? `${found.name}/` : '', title: found.title };", "the relative-path title detector");
replaceGameFiles("  const prefix = await locateInList(picked, all);\n  const files = rebase(all, prefix);\n  return {\n    name: prefix ? `${picked}/${prefix.slice(0, -1)}` : picked,", "  const location = await locateInList(picked, all);\n  const files = rebase(all, location.prefix);\n  return {\n    name: location.prefix ? `${picked}/${location.prefix.slice(0, -1)}` : picked,\n    title: location.title,", "the file-input title detector");
replaceGameFiles("  const prefix = await locateInList(base, all);\n  const files = rebase(all, prefix);\n  const at = base + prefix.split('/').filter(Boolean).map(part => `${encodeURIComponent(part)}/`).join('');\n  return {\n    name: at,", "  const location = await locateInList(base, all);\n  const files = rebase(all, location.prefix);\n  const at = base + location.prefix.split('/').filter(Boolean).map(part => `${encodeURIComponent(part)}/`).join('');\n  return {\n    name: at,\n    title: location.title,", "the URL title detector");
if (!gameFiles.includes("^igi2?\\.exe$/i") || !gameFiles.includes('title: found.title') || !gameFiles.includes('title: location.title')) throw new Error('I.G.I. 2 game-folder wiring is incomplete.');
js = js.replace("  game.Boot(args);", "  const gameArgs = source.title ? [...args, '-title', source.title] : args;\n  game.Boot(gameArgs);");
if (!js.includes("game.Boot(gameArgs)")) throw new Error('Could not route the selected game title to the browser runtime.');
const defaultRuntime = "        IGameTitleRuntime runtime = TitleCatalog.Default;";
const selectedRuntime = "        IGameTitleRuntime runtime = TitleCatalog.Default;\n        if (options.Title is { Length: > 0 } titleId)\n        {\n            if (!TitleCatalog.TryResolve(titleId, out IGameTitleRuntime? selectedRuntime))\n            {\n                throw new ArgumentException($\"Unknown game title '{titleId}'. Known titles: {TitleCatalog.KnownTitleIds}\");\n            }\n            runtime = selectedRuntime;\n        }";
if (!program.includes(defaultRuntime)) throw new Error('Could not find the browser runtime default selection in Program.cs.');
program = program.replace(defaultRuntime, selectedRuntime);



await writeFile(gameFilesPath, gameFiles);
await writeFile(programPath, program);
await writeFile(indexPath, siteIndex);
await writeFile(resolve(root, 'favicon.svg'), favicon);
js = js.replace(
  "    play.addEventListener('click', () => { takeTheScreen(); act(false); }, { signal: listening.signal });",
  "    play.addEventListener('click', () => { takeTheScreen(); act(false); }, { signal: listening.signal });\n    window.igi2EngineReady = true;\n    window.dispatchEvent(new Event('igi2-engine-ready'));"
);
await writeFile(mainPath, js);
console.log('Applied the IGI 2 Online homepage shell and framed browser-game interface.');