import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('engine/OpenIGI/apps/OpenIGI.Web/wwwroot');

const html = String.raw\`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#11150f">
<meta name="description" content="IGI 2 Online — covert operations interface for I.G.I. 2: Covert Strike.">
<title>IGI 2 Online</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='%2311150f'/%3E%3Cpath d='M12 18h40M12 32h40M12 46h40' stroke='%23c5a45a' stroke-width='5'/%3E%3C/svg%3E">
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
:root{color-scheme:dark;--bg:#0b0e0a;--panel:#141a12;--line:rgba(197,164,90,.28);--gold:#c5a45a;--muted:#9ca18f;--white:#e9e9dc;--mono:'IBM Plex Mono',monospace;--display:'Barlow Condensed',Impact,sans-serif}
*{box-sizing:border-box}html{min-height:100%;background:var(--bg)}body{margin:0;min-height:100vh;color:var(--white);font-family:Arial,sans-serif;background:radial-gradient(ellipse at 50% -20%,#38402b 0%,#171e14 38%,#0b0e0a 76%);overflow-x:hidden}
body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.13;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 90%)}
.shell{width:min(1180px,calc(100% - 36px));margin:auto;position:relative}
.topbar{height:78px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);gap:16px}
.brand{display:flex;align-items:center;gap:13px}.mark{width:42px;height:42px;border:1px solid var(--gold);display:grid;place-items:center;color:var(--gold);font:800 19px var(--display);letter-spacing:-1px;transform:skew(-7deg)}.brand-name{font:800 25px var(--display);letter-spacing:1.8px;text-transform:uppercase}.brand-sub{font:10px var(--mono);color:var(--muted);letter-spacing:2px;margin-top:3px}
.navtag{font:10px var(--mono);letter-spacing:1.6px;color:var(--gold);border:1px solid var(--line);padding:9px 12px}
.hero{padding:54px 0 25px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:end}.eyebrow{font:11px var(--mono);color:var(--gold);letter-spacing:3px;text-transform:uppercase}.hero h1{font:900 clamp(54px,9vw,104px)/.82 var(--display);letter-spacing:1px;margin:16px 0 14px;text-transform:uppercase;text-shadow:0 8px 30px #000}.hero h1 span{color:var(--gold)}.hero p{color:#b8bdad;max-width:570px;line-height:1.65;margin:0;font-size:14px}.mission-code{text-align:right;font:10px/1.9 var(--mono);color:var(--muted);letter-spacing:1px}.mission-code strong{display:block;color:var(--gold);font-size:13px}
.console{border:1px solid var(--line);background:linear-gradient(135deg,rgba(26,34,21,.97),rgba(10,13,9,.98));box-shadow:0 22px 70px #0009;position:relative;padding:12px}
.console:before,.console:after{content:"";position:absolute;width:34px;height:34px;border-color:var(--gold);pointer-events:none}.console:before{top:-1px;left:-1px;border-top:2px solid;border-left:2px solid}.console:after{right:-1px;bottom:-1px;border-right:2px solid;border-bottom:2px solid}
.console-head{display:flex;align-items:center;justify-content:space-between;padding:4px 5px 12px;gap:10px;font:10px var(--mono);letter-spacing:1.7px;color:var(--muted)}.live{color:#c8b16f}.live:before{content:"";display:inline-block;width:6px;height:6px;background:#c5a45a;border-radius:50%;margin:0 8px 1px 0;box-shadow:0 0 10px #c5a45a}
.game-frame{aspect-ratio:16/9;min-height:220px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 55%,#283322 0%,#151d13 45%,#080b08 100%);border:1px solid #48513b;display:grid;place-items:center}
.frame-grid{position:absolute;inset:0;background:linear-gradient(90deg,transparent 49.9%,#b6a15a17 50%,transparent 50.1%),linear-gradient(transparent 49.9%,#b6a15a17 50%,transparent 50.1%);background-size:80px 80px;opacity:.5}
.scan{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c5a45a88,transparent);animation:scan 5s linear infinite}
@keyframes scan{0%{top:0;opacity:0}10%{opacity:.8}90%{opacity:.4}100%{top:100%;opacity:0}}
.target{position:absolute;width:min(34vw,230px);aspect-ratio:1;border:1px solid #c5a45a33;border-radius:50%;display:grid;place-items:center}.target:before,.target:after{content:"";position:absolute;background:#c5a45a66}.target:before{width:1px;height:120%}.target:after{height:1px;width:120%}.target-ring{width:65%;height:65%;border:1px dashed #c5a45a55;border-radius:50%;animation:rotate 28s linear infinite}@keyframes rotate{to{transform:rotate(360deg)}}
.frame-copy{position:relative;z-index:2;text-align:center;padding:20px}.frame-logo{font:900 clamp(42px,8vw,88px)/.85 var(--display);letter-spacing:4px;text-shadow:0 4px 25px #000}.frame-logo span{color:var(--gold)}.frame-caption{font:10px var(--mono);letter-spacing:3px;color:#b7b69a;margin-top:18px}.frame-state{display:inline-block;margin-top:24px;border:1px solid #c5a45a66;padding:9px 14px;color:var(--gold);font:10px var(--mono);letter-spacing:1.4px;background:#0b0e0ac9}
.frame-corner{position:absolute;font:9px var(--mono);letter-spacing:1px;color:#9ba18799}.tl{top:14px;left:16px}.tr{top:14px;right:16px;text-align:right}.bl{bottom:14px;left:16px}.br{bottom:14px;right:16px;text-align:right}
.below{display:grid;grid-template-columns:1.15fr .85fr;gap:16px;margin:18px 0 55px}.panel{border:1px solid var(--line);background:#11170f;padding:22px}.panel-title{font:700 22px var(--display);letter-spacing:1px;text-transform:uppercase;margin:0 0 8px}.panel-kicker{font:9px var(--mono);letter-spacing:2px;color:var(--gold);margin-bottom:9px}.panel p{color:#aeb4a3;font-size:13px;line-height:1.65;margin:0 0 17px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:var(--gold);color:#10130d;text-decoration:none;border:0;padding:13px 18px;font:700 13px var(--mono);letter-spacing:1px;text-transform:uppercase;cursor:pointer;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));transition:filter .2s,transform .2s}.btn:hover{filter:brightness(1.15);transform:translateY(-1px)}.btn.secondary{background:transparent;border:1px solid var(--line);color:var(--gold);clip-path:none}.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.file-status{font:10px/1.7 var(--mono);color:var(--muted);margin-top:12px;overflow-wrap:anywhere}.warning{color:#c9b77d}.small-note{font:9px/1.7 var(--mono);color:#737c6c;margin-top:14px}
.steps{display:grid;gap:12px}.step{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;color:#aeb4a3;font-size:12px;line-height:1.5}.num{font:13px var(--mono);color:var(--gold);border:1px solid var(--line);width:26px;height:26px;display:grid;place-items:center}
.footer{border-top:1px solid var(--line);padding:20px 0 28px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#77806e;font:9px var(--mono);letter-spacing:1px}
@media(max-width:700px){.hero{grid-template-columns:1fr;padding-top:38px}.mission-code{display:none}.below{grid-template-columns:1fr}.topbar{height:68px}.navtag{font-size:8px;padding:8px}.brand-name{font-size:21px}.game-frame{min-height:210px}.console{padding:8px}.console-head{font-size:8px}.shell{width:min(100% - 24px,1180px)}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="shell">
<header class="topbar">
<div class="brand"><div class="mark">IGI</div><div><div class="brand-name">IGI 2 Online</div><div class="brand-sub">COVERT STRIKE // WEB EDITION</div></div></div>
<div class="navtag">TACTICAL SYSTEMS // 2003</div>
</header>
<section class="hero">
<div><div class="eyebrow">Classified // Operation Covert Strike</div><h1>I'm going <span>in.</span></h1><p>Enter the mission control interface for I.G.I. 2: Covert Strike. Your operation files stay on your device. Choose your own legally obtained game folder for local preparation.</p></div>
<div class="mission-code">OPERATION STATUS<strong>ENGINE CHECK REQUIRED</strong>ACCESS LEVEL // FIELD AGENT</div>
</section>
<section class="console" aria-label="IGI 2 game display">
<div class="console-head"><span>MISSION DISPLAY // PRIMARY FEED</span><span class="live">SYSTEM STANDBY</span></div>
<div class="game-frame">
<div class="frame-grid"></div><div class="scan"></div><div class="target"><div class="target-ring"></div></div>
<span class="frame-corner tl">IGI-2 / COVERT STRIKE</span><span class="frame-corner tr">SECURE CHANNEL: LOCAL</span>
<div class="frame-copy"><div class="frame-logo">IGI <span>2</span></div><div class="frame-caption">COVERT STRIKE // MISSION INTERFACE</div><div class="frame-state">BROWSER GAME ENGINE NOT AVAILABLE</div></div>
<span class="frame-corner bl">RENDER MODE: STANDBY</span><span class="frame-corner br">16:9 DISPLAY // READY</span>
</div>
</section>
<section class="below">
<div class="panel">
<div class="panel-kicker">01 // LOCAL GAME FILES</div><h2 class="panel-title">Prepare your game folder</h2>
<p>Select the I.G.I. 2 folder from a copy you legally own. The browser will inspect the selected filenames locally; files are not uploaded to this website.</p>
<button class="btn" id="choose-folder" type="button">SELECT IGI 2 FOLDER <span>→</span></button>
<input id="game-folder" type="file" webkitdirectory directory multiple hidden>
<div class="file-status" id="file-status" aria-live="polite">No game folder selected.</div>
<div class="small-note">NOTE: This website does not host or distribute copyrighted game data. Selecting a folder does not launch the desktop game.</div>
</div>
<div class="panel">
<div class="panel-kicker">02 // DESKTOP OPERATION</div><h2 class="panel-title">Run outside the browser</h2>
<p>IGI 2 desktop support is still in development in the engine used by this project. A verified IGI 2 desktop installer is not currently available here.</p>
<div class="steps">
<div class="step"><span class="num">01</span><span>Keep your original I.G.I. 2 installation files on your computer.</span></div>
<div class="step"><span class="num">02</span><span>Use a compatible desktop engine build when an IGI 2 release is available.</span></div>
<div class="step"><span class="num">03</span><span>Do not download unknown game archives from unofficial mirrors.</span></div>
</div>
<a class="btn secondary" href="https://github.com/OpenIGI/OpenIGI/releases" target="_blank" rel="noopener" style="margin-top:18px">CHECK ENGINE RELEASES ↗</a>
</div>
</section>
<footer class="footer"><span>IGI 2 ONLINE // FAN-MADE INTERFACE</span><span>NOT AFFILIATED WITH THE GAME'S PUBLISHER</span></footer>
</div>
<script type="module" src="main.js"></script>
</body>
</html>\`;

const js = String.raw\`const choose = document.getElementById('choose-folder');
const input = document.getElementById('game-folder');
const status = document.getElementById('file-status');
choose.addEventListener('click', () => input.click());
input.addEventListener('change', () => {
  const files = Array.from(input.files || []);
  if (!files.length) {
    status.textContent = 'No game folder selected.';
    return;
  }
  const names = files.map(file => file.webkitRelativePath || file.name);
  const normalized = names.map(name => name.toLowerCase());
  const hasMission = normalized.some(name => name.includes('/mission/') || name.startsWith('mission/'));
  const hasExe = normalized.some(name => name.endsWith('.exe'));
  const hasData = normalized.some(name => /\\.res$|\\.dat$|\\.pak$|\\.bin$/.test(name));
  const folder = (files[0].webkitRelativePath || files[0].name).split('/')[0];
  status.textContent = folder + ' — ' + files.length + ' files selected. ' +
    (hasMission && (hasExe || hasData)
      ? 'Folder structure detected. Local files are ready for a compatible desktop runtime.'
      : 'Some expected game-folder content may be missing; check your original installation.');
  status.className = 'file-status ' + (hasMission && (hasExe || hasData) ? '' : 'warning');
});
\`;

await writeFile(resolve(root, 'index.html'), html);
await writeFile(resolve(root, 'main.js'), js);
console.log('Replaced upstream landing page with IGI 2 Online branding and a clearly gated IGI 2 game frame.');
