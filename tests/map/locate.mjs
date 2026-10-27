// The locate button: on screen it glides to you; off screen it pulls back only as far as needed, then zooms in on you
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'brinamaps/public/map/index.html', 'utf8');
const errs = [], check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: { latitude: 32.05, longitude: -116.88 } })).newPage();
p.on('pageerror', e => errs.push('PAGE ' + e.message));
await p.route('**/*', r => { const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o) });
  if(/\/api\/(fires|firms)\b/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify(/firms/.test(u)?{features:[]}:{at:Date.now(),per:{features:[]},loc:{features:[]}})});
  if(/\/api\/valhalla\/status/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:false})});
  if(/\/api\/(places|valhalla\/)/.test(u)) return r.fulfill({status:503,contentType:'application/json',body:'{}'});
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (u.includes('photon') || u.includes('nominatim') || u.includes('/api/')) return J({ features: [] });
  return r.abort(); });
await p.goto('http://localhost/map'); await p.waitForTimeout(2000);
const run = async (center, zoom) => p.evaluate(async ([c, z]) => {
  map.jumpTo({ center: c, zoom: z }); await new Promise(r => setTimeout(r, 300));
  const zs = []; const on = () => zs.push(map.getZoom()); map.on('move', on);
  $('locate').click(); await new Promise(r => setTimeout(r, 3300)); map.off('move', on);
  const ce = map.getCenter(); return { minZ: Math.min(...zs, map.getZoom()), endZ: map.getZoom(), dist: meters([ce.lat, ce.lng], here) };
}, [center, zoom]);
const near = await run([-116.8790, 32.0512], 15);
console.log('on screen', JSON.stringify(near));
check(near.minZ >= 14.9 && near.endZ >= 15, 'on screen: no zooming out');
const town = await run([-117.06, 32.37], 14);   // Rosarito, about 40 km away
console.log('40 km away', JSON.stringify(town));
check(town.minZ > 6 && town.minZ < 13.5 && town.endZ >= 15, 'off screen nearby: one flight out and back in on you');
const far = await run([-99.1, 19.4], 12);   // Mexico City
console.log('far away', JSON.stringify(far));
check(far.minZ >= 3 && far.endZ >= 15, 'very far: never the whole world, ends on you');
console.log('errors', errs); await b.close(); if (errs.length) process.exit(1);
