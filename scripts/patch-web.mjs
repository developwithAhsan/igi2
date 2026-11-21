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
// Hosted data can only be enabled explicitly by the site owner with a data-host URL.
js = js.replace(
  /const HOSTED_DATA = new URL\([\s\S]*?\);/,
  "const HOSTED_DATA = query.get('data-host') ? new URL(query.get('data-host'), location.href).href.replace(/\\/?$/, '/') : null;"
);
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
  "function showLanding() {\n  canvas.hidden = true;\n  landing.hidden = false;\n  $('game-frame').classList.remove('is-running');\n  $('game-prompt').hidden = false;\n}"
);
js = js.replace(
  '  landing.hidden = true;\n  canvas.hidden = false;\n  canvas.focus();\n  game.Boot(args);',
  "  landing.hidden = false;\n  canvas.hidden = false;\n  $('game-frame').classList.add('is-running');\n  $('game-prompt').hidden = true;\n  canvas.focus();\n  game.Boot(args);"
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

// The ZIP's audio is stored as cacheable files, not a multi-megabyte base64 string in the homepage.
js += [
  "const menuMusic = new Audio('/assets/audio/menu-background.m4a');",
  "menuMusic.loop = true;",
  "menuMusic.volume = 0.22;",
  "menuMusic.preload = 'auto';",
  "window.igi2MenuMusic = menuMusic;",
  "const menuSounds = {",
  "  hover: new Audio('/assets/audio/menu-hover.mp3'),",
  "  select: new Audio('/assets/audio/menu-select.mp3'),",
  "  back: new Audio('/assets/audio/menu-back.mp3')",
  "};",
  "for (const sound of Object.values(menuSounds)) { sound.preload = 'auto'; sound.volume = 0.7; }",
  "const playMenuSound = name => {",
  "  const sound = menuSounds[name];",
  "  if (!sound) return;",
  "  try { sound.currentTime = 0; sound.play().catch(() => {}); } catch {}",
  "};",
  "let menuAudioUnlocked = false;",
  "const unlockMenuAudio = () => {",
  "  if (menuAudioUnlocked) return;",
  "  menuAudioUnlocked = true;",
  "  menuMusic.play().catch(() => { menuAudioUnlocked = false; });",
  "};",
  "for (const eventName of ['pointerdown', 'keydown', 'touchstart']) {",
  "  window.addEventListener(eventName, unlockMenuAudio, { once: true, capture: true, passive: true });",
  "}",
  "for (const item of document.querySelectorAll('#mm .igi2-menu-choice, #cr .igi2-menu-choice, #back')) {",
  "  item.addEventListener('pointerenter', () => playMenuSound('hover'));",
  "  item.addEventListener('focus', () => playMenuSound('hover'));",
  "  item.addEventListener('click', () => playMenuSound(item.id === 'back' ? 'back' : 'select'));",
  "}",
  "menuMusic.addEventListener('error', () => console.warn('IGI 2 menu music could not be loaded from /assets/audio/menu-background.m4a'));"
].join('\\n') + '\\n';

await writeFile(gameFilesPath, gameFiles);
await writeFile(programPath, program);
await writeFile(indexPath, siteIndex);
await writeFile(resolve(root, 'favicon.svg'), favicon);
await writeFile(mainPath, js);
console.log('Applied the IGI 2 Online homepage shell and framed browser-game interface.');