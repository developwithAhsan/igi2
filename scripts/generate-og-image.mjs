import sharp from 'sharp';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourcePath = resolve('site/assets/og-image.svg');
const outputPath = resolve('publish/assets/og-image-v2.jpg');
const sourceSvg = await readFile(sourcePath);
const logo = await sharp(sourceSvg, { density: 180 })
  .resize(500, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#071a31"/>
    <stop offset=".55" stop-color="#102b4d"/>
    <stop offset="1" stop-color="#06101d"/>
  </linearGradient>
  <radialGradient id="glow" cx="27%" cy="48%" r="60%">
    <stop offset="0" stop-color="#397cc0" stop-opacity=".42"/>
    <stop offset="1" stop-color="#397cc0" stop-opacity="0"/>
  </radialGradient>
  <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
    <path d="M36 0H0V36" fill="none" stroke="#9ac8f0" stroke-opacity=".07" stroke-width="1"/>
  </pattern>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#7bb7ee" stop-opacity="0"/>
    <stop offset=".5" stop-color="#b8dcff" stop-opacity=".9"/>
    <stop offset="1" stop-color="#7bb7ee" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<rect width="1200" height="630" fill="url(#glow)"/>
<rect width="1200" height="630" fill="url(#grid)"/>
<path d="M0 500L420 0H650L210 630H0Z" fill="#3b75ac" opacity=".08"/>
<rect x="24" y="24" width="1152" height="582" rx="22" fill="none" stroke="#83b6e7" stroke-opacity=".62" stroke-width="2"/>
<rect x="50" y="50" width="520" height="530" rx="20" fill="#071426" fill-opacity=".56" stroke="#86b9e8" stroke-opacity=".42" stroke-width="2"/>
<circle cx="310" cy="315" r="238" fill="none" stroke="#8fc4f4" stroke-opacity=".42" stroke-width="2"/>
<circle cx="310" cy="315" r="222" fill="none" stroke="#8fc4f4" stroke-opacity=".13" stroke-width="1"/>
<path d="M625 135H1120" stroke="url(#accent)" stroke-width="3"/>
<text x="640" y="254" fill="#f5f9ff" font-family="Arial, sans-serif" font-size="76" font-weight="800" letter-spacing="2">IGI 2 ONLINE</text>
<text x="646" y="323" fill="#a9ccef" font-family="Arial, sans-serif" font-size="36" font-weight="700" letter-spacing="7">COVERT STRIKE</text>
<path d="M646 360H1105" stroke="#7eb6e8" stroke-opacity=".42" stroke-width="2"/>
<text x="646" y="424" fill="#e4effb" font-family="Arial, sans-serif" font-size="26" font-weight="600">Game Menu  •  PC Controls</text>
<text x="646" y="468" fill="#e4effb" font-family="Arial, sans-serif" font-size="26" font-weight="600">Mission Guides  •  Multiplayer</text>
<text x="646" y="535" fill="#82b9eb" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="2">IGI2.ONLINE</text>
</svg>`;

await mkdir(dirname(outputPath), { recursive: true });
await sharp(Buffer.from(cardSvg))
  .composite([{ input: logo, left: 60, top: 65 }])
  .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:2:0' })
  .toFile(outputPath);

const info = await sharp(outputPath).metadata();
const file = await stat(outputPath);
if (info.width !== 1200 || info.height !== 630) throw new Error(`OG image has unexpected dimensions: ${info.width}x${info.height}`);
if (file.size > 300 * 1024) console.warn(`OG image is ${Math.round(file.size / 1024)} KB; consider reducing quality for WhatsApp previews.`);
console.log(`Created ${outputPath} (${info.width}x${info.height}, ${Math.round(file.size / 1024)} KB) from the uploaded SVG artwork.`);
