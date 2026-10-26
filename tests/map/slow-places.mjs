// A slow place-list database never makes search slow: after 2.5 s search goes on without it, and skips it for 2 minutes
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'brinamaps/public/map/index.html', 'utf8');
let asked = 0; const errs = [], check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['geolocation'], geolocation: { latitude: 32.05, longitude: -116.88 } })).newPage();
p.on('pageerror', e => errs.push('PAGE ' + e.message));
await p.route('**/*', async r => { const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o) });
  if(/\/api\/(fires|firms)\b/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify(/firms/.test(u)?{features:[]}:{at:Date.now(),per:{features:[]},loc:{features:[]}})});
  if(/\/api\/valhalla\/status/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:false})});
  if(/\/api\/places\?health/.test(u)) return r.fulfill({contentType:'application/json',body:'{"ok":true}'});
  if(/\/api\/places/.test(u)) { asked++; await new Promise(z => setTimeout(z, 6000)); return r.fulfill({contentType:'application/json',body:'{"places":[]}'}).catch(()=>{}); }
  if(/\/api\/valhalla\//.test(u)) return r.fulfill({status:503,contentType:'application/json',body:'{}'});
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (u.includes('photon') || u.includes('nominatim') || u.includes('/api/')) return J({ features: [], places: [] });
  return r.abort(); });
await p.goto('http://localhost/map'); await p.waitForTimeout(1200);
const first = await p.evaluate(async () => { const t = performance.now(); const o = await ownSearch('walmart', [32.05, -116.88]); return { ms: Math.round(performance.now() - t), n: o.length, down: dbDownUntil > Date.now() }; });
const second = await p.evaluate(async () => { const t = performance.now(); await ownSearch('oxxo', [32.05, -116.88]); return Math.round(performance.now() - t); });
console.log(first, second, 'asked', asked);
check(first.ms >= 2400 && first.ms < 3500 && first.down, 'a slow place list is given up after 2.5 s');
check(second < 200 && asked === 1, 'and skipped for the next searches');
console.log('errors', errs); await b.close(); process.exit(errs.length ? 1 : 0);
