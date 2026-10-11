// Builds www/ for the iPhone app from the same page the website serves (public/map/index.html).
// The map library is bundled so the app opens with no connection; everything else in the page is unchanged.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
const here = new URL('..', import.meta.url).pathname, src = here + '../public/map/', out = here + 'www/';
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
let html = readFileSync(src + 'index.html', 'utf8');
const swap = (from, to) => { if (!html.includes(from)) throw new Error('copy-web: expected to find ' + from); html = html.replace(from, to); };
swap('https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css', 'maplibre-gl.css');
swap('<script src="https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js"></script>', '<script src="capacitor-core.js"></script>\n<script src="maplibre-gl.js"></script>');
swap('<link rel="manifest" href="/map/manifest.webmanifest">', '');
swap('href="/map/icon-180.png"', 'href="icon-180.png"');
writeFileSync(out + 'index.html', html);
const lib = here + '../node_modules/maplibre-gl/dist/';
copyFileSync(lib + 'maplibre-gl.js', out + 'maplibre-gl.js');
copyFileSync(lib + 'maplibre-gl.css', out + 'maplibre-gl.css');
copyFileSync(here + 'node_modules/@capacitor/core/dist/capacitor.js', out + 'capacitor-core.js');
copyFileSync(src + 'icon-180.png', out + 'icon-180.png');
console.log('www/ built from public/map');
