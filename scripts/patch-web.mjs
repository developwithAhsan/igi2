import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('engine/OpenIGI/apps/OpenIGI.Web/wwwroot');
const indexPath = resolve(root, 'index.html');
const mainPath = resolve(root, 'main.js');
const gameFilesPath = resolve(root, 'game-files.js');
const programPath = resolve('engine/OpenIGI/apps/OpenIGI.Web/Program.cs');
let siteIndex = await readFile(resolve('site/index.html'), 'utf8');
if (!siteIndex.includes('id="play-status"')) {
  const playButtonEnd = siteIndex.indexOf('</button>', siteIndex.indexOf('id="play"'));
  if (playButtonEnd < 0) throw new Error('Could not find the original Play button.');
  const insertAt = playButtonEnd + '</button>'.length;
  siteIndex = siteIndex.slice(0, insertAt) + '<span class="play-status" id="play-status" role="status" aria-live="polite" hidden></span>' + siteIndex.slice(insertAt);
}
if (!siteIndex.includes('id="progress-meta"')) siteIndex = siteIndex.replace('<span class="pc" id="pc">0%</span>', '<span class="pc-stack"><span class="pc" id="pc">0%</span><small class="progress-meta" id="progress-meta"></small></span>');
const oldOuterGate = "if(!window.igi2EngineReady){say('Game engine is still preparing. Please select Play again in a moment.',2200);return;}";
const newOuterGate = "if(!window.igi2EngineReady){const s=document.getElementById('play-status');if(s){s.textContent=window.igi2EngineError||'Checking GPU compatibility…';s.hidden=false;}return;}";
if (!siteIndex.includes(oldOuterGate)) throw new Error('The homepage WebGPU Play gate is missing.');
siteIndex = siteIndex.replace(oldOuterGate, newOuterGate);
const oldOuterProgress = "li.classList.add('loading');f.style.width='100%';p.textContent='OPENING';";
const newOuterProgress = "const s=document.getElementById('play-status'),meta=document.getElementById('progress-meta'),screen=document.getElementById('igi2-download-screen');if(s){s.hidden=true;s.textContent='';}if(meta)meta.textContent='';if(screen){screen.hidden=false;screen.dataset.error='false';}li.classList.add('loading');f.style.width='0%';p.textContent='CHECKING';";
if (!siteIndex.includes(oldOuterProgress)) throw new Error('The homepage fake 100% progress indicator is missing.');
siteIndex = siteIndex.replace(oldOuterProgress, newOuterProgress);
const outerReadyAnchor = "window.igi2EngineReady=false;";
const outerReadyBridge = [
  "window.igi2EngineReady=false;",
  "window.igi2EngineError='';",
  "window.addEventListener('igi2-download-progress',event=>{",
  "  if(!busy)return;",
  "  const detail=event.detail||{};",
  "  const fill=document.getElementById('fill'),pc=document.getElementById('pc'),meta=document.getElementById('progress-meta');",
  "  const screen=document.getElementById('igi2-download-screen'),screenFill=document.getElementById('igi2-download-fill'),screenPercent=document.getElementById('igi2-download-percent'),screenDetail=document.getElementById('igi2-download-detail'),screenHeading=document.getElementById('igi2-download-heading'),screenStage=document.getElementById('igi2-download-stage');",
  "  if(screen){screen.hidden=false;screen.dataset.error='false';if(screenHeading)screenHeading.textContent=detail.label||'Preparing your game';if(screenStage)screenStage.textContent=detail.label==='Downloading game files'?'Downloading and verifying game data…':'Please wait while the game files are prepared';}",
  "  if(detail.fraction===null){if(pc)pc.textContent='…';if(meta)meta.textContent=detail.value||detail.label||'Connecting…';if(screenPercent)screenPercent.textContent='…';if(screenDetail)screenDetail.textContent=detail.value||'Connecting…';return;}",
  "  const percent=Math.max(0,Math.min(100,Math.round(detail.fraction*100)));",
  "  if(fill)fill.style.width=percent+'%';if(pc)pc.textContent=percent+'%';",
  "  if(meta)meta.textContent=(detail.value||'').replace(/^\\d+%\\s*·\\s*/,'');",
  "  if(screenFill)screenFill.style.width=percent+'%';if(screenPercent)screenPercent.textContent=percent+'%';if(screenDetail)screenDetail.textContent=detail.value||String(percent)+'%';",
  "});",
  "window.addEventListener('igi2-game-started',()=>{const screen=document.getElementById('igi2-download-screen');if(screen)screen.hidden=true;});",
  "window.addEventListener('igi2-download-failed',()=>{",
  "  busy=false;items[0].classList.remove('loading');",
  "  document.getElementById('fill').style.width='0';",
  "  document.getElementById('pc').textContent='0%';",
  "});"
].join('\n');
if (!siteIndex.includes(outerReadyAnchor)) throw new Error('The homepage readiness bridge is missing.');
siteIndex = siteIndex.replace("say('The browser game engine is not available on this device.',2200);return;", "const s=document.getElementById('play-status');if(s){s.textContent=window.igi2EngineError||'The browser game engine is not available on this device.';s.hidden=false;}return;");

siteIndex = siteIndex.replace(outerReadyAnchor, outerReadyBridge);
const rotateMarkup = '<div class="igi2-rotate-hint" id="rotate-hint" hidden role="status"><span class="rotate-phone" aria-hidden="true">▱ ↻</span><span><strong>Rotate your phone</strong><small>Landscape mode mein phone ko ghumayein</small></span></div>';
if (!siteIndex.includes('id="rotate-hint"')) {
  const close = siteIndex.lastIndexOf('</section></div>');
  if (close < 0) throw new Error('The player section closing markup is missing.');
  const afterSection = close + '</section>'.length;
  siteIndex = siteIndex.slice(0, afterSection) + rotateMarkup + siteIndex.slice(afterSection);
}
const downloadScreenMarkup = '<div id="igi2-download-screen" class="igi2-download-screen" hidden role="status" aria-live="polite"><div class="igi2-download-card"><div class="igi2-download-brand">IGI 2 <span>Covert Strike</span></div><div class="igi2-download-heading" id="igi2-download-heading">Preparing your game</div><div class="igi2-download-track"><div class="igi2-download-fill" id="igi2-download-fill"></div></div><div class="igi2-download-numbers"><strong id="igi2-download-percent">0%</strong><span id="igi2-download-detail">Connecting to game files…</span></div><div class="igi2-download-stage" id="igi2-download-stage">Please wait while the game files are prepared</div></div></div>';
if (!siteIndex.includes('id="igi2-download-screen"')) siteIndex = siteIndex.replace('</body>', downloadScreenMarkup + '\n</body>');
const playerStyles = `
#igi2-download-screen{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;width:100%;min-height:100vh;min-height:100dvh;padding:24px;background:#000;color:#f4f7fb;font-family:Arial,sans-serif;box-sizing:border-box}
#igi2-download-screen[hidden]{display:none!important}
#igi2-download-screen .igi2-download-card{width:min(760px,94vw);text-align:center}
#igi2-download-screen .igi2-download-brand{margin-bottom:clamp(28px,7vh,64px);color:#e7edf5;font:900 clamp(25px,5vw,42px)/1 Rajdhani,Arial,sans-serif;letter-spacing:.16em}
#igi2-download-screen .igi2-download-brand span{display:block;margin-top:8px;color:#8d9bad;font:700 clamp(10px,2vw,14px)/1 Arial,sans-serif;letter-spacing:.32em}
#igi2-download-screen .igi2-download-heading{margin-bottom:22px;color:#f4f7fb;font:700 clamp(19px,3.5vw,28px)/1.25 Rajdhani,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
#igi2-download-screen .igi2-download-track{height:clamp(22px,4vw,34px);padding:4px;overflow:hidden;border:1px solid #5d6877;border-radius:5px;background:#171b21}
#igi2-download-screen .igi2-download-fill{width:0;height:100%;border-radius:2px;background:linear-gradient(90deg,#1677c8,#48b7f5 65%,#b5eaff);transition:width .18s ease}
#igi2-download-screen .igi2-download-numbers{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-top:13px;text-align:left}
#igi2-download-screen .igi2-download-numbers strong{flex:none;color:#fff;font:800 clamp(22px,5vw,32px)/1 Rajdhani,Arial,sans-serif;font-variant-numeric:tabular-nums}
#igi2-download-screen .igi2-download-numbers span{color:#b8c5d3;font:600 clamp(11px,2vw,14px)/1.4 Arial,sans-serif;text-align:right;overflow-wrap:anywhere}
#igi2-download-screen .igi2-download-stage{margin-top:20px;color:#8795a5;font:12px/1.5 Arial,sans-serif}
#igi2-download-screen[data-error=true] .igi2-download-heading{color:#ff9388}
@media(max-width:520px){#igi2-download-screen{padding:18px}#igi2-download-screen .igi2-download-numbers{align-items:flex-start;flex-direction:column;gap:6px}#igi2-download-screen .igi2-download-numbers span{text-align:left}#igi2-download-screen .igi2-download-brand{margin-bottom:38px}}
#landing .igi2-play-row #action .play-status{position:absolute;left:calc(50% + 74 * var(--igi2-unit));top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;gap:7px;width:auto;max-width:calc(50% - 86 * var(--igi2-unit));padding:2px 5px;color:#d8efff;font:600 calc(12 * var(--igi2-unit))/1.15 "Rajdhani","Arial Narrow",sans-serif;text-shadow:0 1px 3px #000;white-space:normal;z-index:6}
#landing .play-status[hidden]{display:none!important}
#landing .play-status[data-tone="error"]{color:#ffb2a9}
#landing .play-status[data-tone="ok"]{color:#a9f0bf}
#landing .gpu-check-spinner{width:13px;height:13px;flex:0 0 13px;border:2px solid rgba(185,220,255,.28);border-top-color:#d8efff;border-right-color:#d8efff;border-radius:50%;animation:igi2GpuSpin .72s linear infinite}
@keyframes igi2GpuSpin{to{transform:rotate(360deg)}}
@media(max-width:600px){#landing .igi2-play-row #action .play-status{left:calc(50% + 54 * var(--igi2-unit));max-width:calc(50% - 60 * var(--igi2-unit));font-size:calc(10 * var(--igi2-unit))}#landing .gpu-check-spinner{width:11px;height:11px;flex-basis:11px}}
#landing .pc-stack{display:inline-flex;flex-direction:column;align-items:flex-start;min-width:calc(54*var(--u));line-height:1.05}
#landing .progress-meta{display:block;max-width:220px;color:#d8e8ff;font:600 9px/1.2 Arial,sans-serif;white-space:normal;text-shadow:0 1px 3px #000}
#engine-overlay #player-shell{position:relative}
#engine-overlay .frame-actions{position:absolute;right:18px;bottom:16px;z-index:20;width:auto;min-height:0;justify-content:flex-end;padding:0;background:transparent;gap:10px}
#engine-overlay .tool-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:112px;min-height:42px;padding:9px 15px;border:1px solid rgba(130,190,225,.65);border-radius:8px;background:rgba(5,22,38,.82);color:#eaf6ff;font:600 13px/1.1 Rajdhani,Arial,sans-serif;box-shadow:0 5px 22px rgba(0,0,0,.35);backdrop-filter:blur(8px);cursor:pointer;transition:background .18s,border-color .18s,transform .18s}
#engine-overlay .tool-btn:hover,#engine-overlay .tool-btn[aria-expanded=true]{background:rgba(24,74,108,.95);border-color:#9ddcff;transform:translateY(-1px)}
#engine-overlay .tool-btn svg{width:19px;height:19px;flex:none}
#engine-overlay .settings-panel{position:absolute;right:18px;bottom:70px;z-index:21;width:min(390px,calc(100% - 36px));max-height:min(52vh,440px);padding:15px;border:1px solid rgba(111,180,220,.55);border-radius:12px;background:rgba(4,17,30,.96);box-shadow:0 16px 48px rgba(0,0,0,.55);backdrop-filter:blur(14px);color:#e7f3fb}
#engine-overlay .settings-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;color:#9fd7f4;font:700 13px/1.2 Rajdhani,Arial,sans-serif;letter-spacing:.12em}
#engine-overlay .settings-close{border:1px solid rgba(130,190,225,.5);border-radius:6px;background:rgba(22,58,83,.8);color:#eaf6ff;padding:7px 10px;font:600 11px Rajdhani,Arial,sans-serif;cursor:pointer}
#engine-overlay .settings-grid{display:grid;grid-template-columns:1fr;gap:9px}
#engine-overlay .setting-chip{display:grid;gap:4px;padding:11px;border:1px solid rgba(116,164,194,.22);border-radius:8px;background:rgba(19,44,64,.58)}
#engine-overlay .setting-chip strong{color:#e8f6ff;font:700 13px Rajdhani,Arial,sans-serif}
#engine-overlay .setting-chip span{color:#a9bdca;font:400 12px/1.4 Arial,sans-serif}
#engine-overlay .igi2-rotate-hint{position:absolute;left:50%;top:50%;z-index:30;display:flex;align-items:center;gap:13px;transform:translate(-50%,-50%);padding:14px 18px;border:1px solid rgba(130,190,225,.6);border-radius:12px;background:rgba(2,13,24,.94);color:#eef8ff;box-shadow:0 12px 40px rgba(0,0,0,.6);font-family:Rajdhani,Arial,sans-serif;text-align:left}
#engine-overlay .igi2-rotate-hint[hidden]{display:none!important}
#engine-overlay .rotate-phone{font-size:34px;color:#9edcff;animation:igi2RotatePhone 1.8s ease-in-out infinite}
#engine-overlay .igi2-rotate-hint strong,#engine-overlay .igi2-rotate-hint small{display:block}
#engine-overlay .igi2-rotate-hint strong{font-size:15px;letter-spacing:.08em;text-transform:uppercase}
#engine-overlay .igi2-rotate-hint small{margin-top:3px;color:#b8cbd8;font:12px/1.35 Arial,sans-serif}
@keyframes igi2RotatePhone{0%,100%{transform:rotate(0)}50%{transform:rotate(90deg)}}
#player-shell:fullscreen .frame-actions{display:flex!important}
#player-shell:fullscreen .settings-panel{display:block}
@media(max-width:600px){#engine-overlay .frame-actions{right:10px;bottom:10px;gap:7px}#engine-overlay .tool-btn{min-width:0;min-height:39px;padding:8px 10px;font-size:12px}#engine-overlay .settings-panel{right:10px;bottom:58px;width:calc(100% - 20px)}#engine-overlay .igi2-rotate-hint{width:calc(100% - 34px);justify-content:center}}
`;
siteIndex = siteIndex.replace('</style><style id="igi2-engine-bridge">', playerStyles + '</style><style id="igi2-engine-bridge">');
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

const progressOld = "function progress(label, fraction = null, value = '') {\n  $('action').hidden = true;\n  $('loading').hidden = false;\n  $('progress-label').textContent = label;\n  $('progress-value').textContent = value;\n  $('progress').classList.toggle('indeterminate', fraction === null);\n  $('progress').firstElementChild.style.width = fraction === null ? '' : `${Math.round(fraction * 100)}%`;\n}";
const progressNew = "function progress(label, fraction = null, value = '') {\n  $('action').hidden = true;\n  $('loading').hidden = false;\n  $('progress-label').textContent = label;\n  $('progress-value').textContent = value;\n  $('progress').classList.toggle('indeterminate', fraction === null);\n  $('progress').firstElementChild.style.width = fraction === null ? '' : `${Math.round(fraction * 100)}%`;\n  window.dispatchEvent(new CustomEvent('igi2-download-progress', { detail: { label, fraction, value } }));\n}";
if (!js.includes(progressOld)) throw new Error('The runtime progress function changed; refusing to apply an unverified progress patch.');
js = js.replace(progressOld, progressNew);
const startAnchor = "  const source = await chooseSource();\n\n  progress('Starting graphics');";
const newStart = "  const source = await chooseSource();\n  if (source.hosted) {\n    progress('Checking game download', null, 'Checking the hosted game file list…');\n    const pendingDownload = await source.downloadStatus();\n    const downloadedByBundle = new Map();\n    const began = performance.now();\n    source.onDownload = (name, got, size) => {\n      downloadedByBundle.set(name, Math.min(got, size));\n      const received = [...downloadedByBundle.values()].reduce((sum, value) => sum + value, 0);\n      const total = pendingDownload.all || size;\n      const fraction = total > 0 ? Math.min(received / total, 1) : 1;\n      const rate = received / Math.max(0.001, (performance.now() - began) / 1000);\n      progress('Downloading game files', fraction, `${Math.round(fraction * 100)}% · ${megabytes(received)} of ${megabytes(total)} MB · ${(rate / 1048576).toFixed(1)} MB/s`);\n    };\n    progress('Downloading game files', pendingDownload.all > 0 ? 0 : 1, `${pendingDownload.all > 0 ? '0%' : '100%'} · ${megabytes(pendingDownload.all)} MB remaining`);\n    await source.prefetch();\n    source.onDownload = null;\n    progress('Game files downloaded', 1, `100% · ${megabytes(pendingDownload.total)} MB total`);\n  }\n\n  progress('Starting graphics');";
if (!js.includes(startAnchor)) throw new Error('Could not move hosted download ahead of runtime initialization.');
js = js.replace(startAnchor, newStart);
// WebGPU is the only pre-Play gate; network and storage checks must not hold the readiness signal.
const newChooseSource = "async function chooseSource() {\n  const playStatus = $('play-status');\n  $('status').hidden = true;\n  const setPlayStatus = (message, tone = 'neutral', spinner = false) => {\n    if (!playStatus) return;\n    playStatus.replaceChildren();\n    if (spinner) {\n      const icon = document.createElement('span');\n      icon.className = 'gpu-check-spinner';\n      icon.setAttribute('aria-hidden', 'true');\n      playStatus.append(icon);\n    }\n    const label = document.createElement('span');\n    label.textContent = message;\n    playStatus.append(label);\n    playStatus.dataset.tone = tone;\n    playStatus.hidden = false;\n  };\n  play.disabled = true;\n  setPlayStatus('Checking WebGPU…', 'neutral', true);\n  const { adapter, reason } = await adapterReady;\n  if (!adapter) {\n    setPlayStatus('WebGPU not available', 'error');\n    if (playStatus) playStatus.title = reason || 'WebGPU is not available on this device.';\n    play.disabled = true;\n    offer('Play Game', reason, 'error');\n    window.igi2EngineReady = false;\n    $('gpu').dataset.state = 'no';\n    $('gpu').textContent = 'No WebGPU';\n    window.igi2EngineError = reason;\n    return new Promise(() => {});\n  }\n\n  try {\n    window.igi2PreparedGpu = await acquireDevice();\n    $('gpu').dataset.state = 'ok';\n    $('gpu').textContent = 'WebGPU ready';\n  } catch (error) {\n    const gpuError = `WebGPU device test failed: ${error.message}`;\n    setPlayStatus('WebGPU test failed', 'error');\n    if (playStatus) playStatus.title = gpuError;\n    play.disabled = true;\n    offer('Play Game', gpuError, 'error');\n    window.igi2EngineReady = false;\n    window.igi2EngineError = gpuError;\n    return new Promise(() => {});\n  }\n  window.igi2EngineError = '';\n  setPlayStatus('WebGPU ready', 'ok');\n  if (playStatus) playStatus.title = 'Your device supports WebGPU.';\n  play.disabled = false;\n  const own = $('own');\n  const clear = $('clear');\n  own.hidden = true;\n  clear.hidden = true;\n  change.hidden = true;\n  offer('Play Game', 'WebGPU ready. Press Play to download the game files.', 'ok');\n\n  return new Promise(settle => {\n    const listening = new AbortController();\n    let busy = false;\n    const beginDownload = async () => {\n      if (busy) return;\n      busy = true;\n      play.disabled = true;\n      setPlayStatus('Starting download…', 'neutral', true);\n      progress('Connecting to game files', null, 'Checking the hosted game manifest…');\n      try {\n        const source = await files.fromHosted(HOSTED_DATA);\n        listening.abort();\n        if (playStatus) playStatus.hidden = true;\n        settle(source);\n      } catch (error) {\n        busy = false;\n        play.disabled = false;\n        setPlayStatus(`Download error: ${error.message}`, 'error');\n        offer('Retry download', `Game download could not start: ${error.message}`, 'error');\n        window.dispatchEvent(new Event('igi2-download-failed'));\n      }\n    };\n    play.addEventListener('click', () => { takeTheScreen(); beginDownload(); }, { signal: listening.signal });\n    window.igi2EngineReady = true;\n    window.dispatchEvent(new Event('igi2-engine-ready'));\n  });\n}";
const chooserPattern = /async function chooseSource\(\) \{[\s\S]*?\n\}\n\n\/\/ --- Starting/;
if (!chooserPattern.test(js)) throw new Error('Could not locate the startup Play/WebGPU gate.');
js = js.replace(chooserPattern, () => newChooseSource + '\n\n// --- Starting');
// Run the browser game on its own clean player screen; hide the homepage menu behind it.
js = js.replace(
  'function showLanding() {\n  canvas.hidden = true;\n  landing.hidden = false;\n}',
  "function showLanding() {\n  canvas.hidden = true;\n  landing.hidden = false;\n  $('game-frame').classList.remove('is-running');\n  $('game-prompt').hidden = false;\n  $('engine-overlay').hidden = true;\n  window.dispatchEvent(new Event('igi2-game-returned'));\n}"
);
js = js.replace(
  '  landing.hidden = true;\n  canvas.hidden = false;\n  canvas.focus();\n  game.Boot(args);',
  "  landing.hidden = true;\n  canvas.hidden = false;\n  $('game-frame').classList.add('is-running');\n  $('game-prompt').hidden = true;\n  $('engine-overlay').hidden = false;\n  canvas.focus();\n  window.dispatchEvent(new Event(\"igi2-game-started\"));\n  game.Boot(args);"
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
  "    if (document.fullscreenElement) { await document.exitFullscreen(); return; }",
  "    await $('player-shell').requestFullscreen({ navigationUI: 'hide' });",
  "    if (matchMedia('(pointer: coarse)').matches) {",
  "      try { await screen.orientation?.lock?.('landscape'); $('rotate-hint').hidden = true; }",
  "      catch { $('rotate-hint').hidden = !matchMedia('(orientation: portrait)').matches; }",
  "    }",
  "  } catch (error) { console.warn('Fullscreen is unavailable:', error); $('rotate-hint').hidden = !matchMedia('(orientation: portrait)').matches; }",
  "});",
  "document.addEventListener('fullscreenchange', () => {",
  "  const label = fullscreenButton.querySelector('span');",
  "  if (label) label.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';",
  "  const mobile = matchMedia('(pointer: coarse)').matches;",
  "  const portrait = matchMedia('(orientation: portrait)').matches;",
  "  if (!document.fullscreenElement || !mobile || !portrait) $('rotate-hint').hidden = true;",
  "  else $('rotate-hint').hidden = false;",
  "});",
  "screen.orientation?.addEventListener?.('change', () => { if (screen.orientation.type.startsWith('landscape')) $('rotate-hint').hidden = true; });"
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

const sourceListMarker = "    async list() { return index.files; },";
const sourceListReplacement = "    async list() { return index.files; },\n    async downloadStatus() {\n      const cache = await dataCache();\n      let all = 0;\n      let total = 0;\n      for (const bundle of Object.values(index.bundles)) {\n        total += bundle.size;\n        if (!await cache?.match(new URL(bundle.url, base).href)) all += bundle.size;\n      }\n      return { all, total };\n    },";
if (!gameFiles.includes(sourceListMarker)) throw new Error('Hosted source status hook is missing.');
gameFiles = gameFiles.replace(sourceListMarker, sourceListReplacement);
// Download the full hosted first-game data set before launching, with one accurate combined progress bar.
const prefetchGuard = [
  "      const connection = navigator.connection;",
  "      // Complete all hosted game data before boot after Play is pressed."
].join('\n');
if (!gameFiles.includes(prefetchGuard)) throw new Error('Could not enable full hosted game download before launch.');
const oldPrefetchNames = "const names = Object.keys(index.bundles).filter(name => name !== 'base').sort((a, b) => order(a) - order(b));";
const newPrefetchNames = "const names = Object.keys(index.bundles).sort((a, b) => a === 'base' ? -1 : b === 'base' ? 1 : order(a) - order(b));";
if (!gameFiles.includes(oldPrefetchNames)) throw new Error('The hosted bundle list no longer matches the expected engine source.');
gameFiles = gameFiles.replace(oldPrefetchNames, newPrefetchNames);
const oldPrefetchCatch = "          console.warn(`Downloading ahead stopped: ${error.message}`);\n          return;";
const newPrefetchCatch = "          console.warn(`Downloading game files stopped: ${error.message}`);\n          throw error;";
if (!gameFiles.includes(oldPrefetchCatch)) throw new Error('The hosted bundle error handler changed unexpectedly.');
gameFiles = gameFiles.replace(oldPrefetchCatch, newPrefetchCatch);
gameFiles = gameFiles.replace(prefetchGuard, "      // Play is an explicit request to download the complete hosted game before launch.\n");

const oldDownloadBlock = [
  "  if (source.hosted) {",
  "    // The bundle read before the game starts comes in first, with how fast; a mission's comes in when the",
  "    // mission is chosen, with the game's own wait for it on the screen.",
  "    const began = performance.now();",
  "    source.onDownload = (name, got, size) => {",
  "      if (name !== 'base') return;",
  "      const rate = got / Math.max(0.001, (performance.now() - began) / 1000);",
  "      progress('Downloading game files', got / size, `${megabytes(got)} of ${megabytes(size)} MB · ${(rate / 1048576).toFixed(1)} MB/s`);",
  "    };",
  "  }",
  "  const read = await files.load(source, fs, GAME_ROOT, (done, total) =>",
  "    progress(source.hosted ? 'Unpacking game files' : 'Reading game files', total ? done / total : 0, `${megabytes(done)} of ${megabytes(total)} MB`));",
  "  console.log(`Read ${read.files} files; ${read.deferred} wait for their missions.`);",
  "  if (source.hosted) source.onDownload = null;"
].join('\n');
const newDownloadBlock = [
  "  const read = await files.load(source, fs, GAME_ROOT, (done, total) =>",
  "    progress(source.hosted ? 'Preparing downloaded game files' : 'Reading game files', source.hosted ? null : (total ? done / total : 0), `${megabytes(done)} of ${megabytes(total)} MB`));",
  "  console.log(`Read ${read.files} files; ${read.deferred} wait for their missions.`);"
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
if (!js.includes("window.igi2EngineReady = true;")) throw new Error('WebGPU-ready Play signal is missing.');
const oldDeviceAcquire = "  const { adapter, device } = await acquireDevice();";
const newDeviceAcquire = "  const { adapter, device } = window.igi2PreparedGpu ?? await acquireDevice();\n  window.igi2PreparedGpu = null;";
if (!js.includes(oldDeviceAcquire)) throw new Error('The runtime device-acquire call changed unexpectedly.');
js = js.replace(oldDeviceAcquire, newDeviceAcquire);
await writeFile(mainPath, js);
console.log('Applied the IGI 2 Online homepage shell and framed browser-game interface.');