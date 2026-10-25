// NASA satellite heat spots: used only outside the US, grouped into fires, lone spots left out
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'public/map/index.html', 'utf8');
const errs = [], check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
const now = Date.now(), h = 3600e3;
// a group of 4 spots near Valle de Guadalupe (Mexico), a lone spot near Ensenada, 3 spots in San Diego County (US)
const spots = [[32.090, -116.600, 12, now - 3 * h, 1], [32.095, -116.605, 8, now - 4 * h, 1], [32.100, -116.598, 20, now - 5 * h, 0], [32.092, -116.590, 5, now - 2 * h, 1],
  [31.87, -116.62, 3, now - 2 * h, 1], [32.80, -116.80, 10, now - h, 1], [32.805, -116.80, 10, now - h, 1], [32.81, -116.80, 10, now - h, 1]];
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
p.on('pageerror', e => errs.push('PAGE ' + e));
const asked = [];
await p.route('**/*', async r => {
  const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o) });
  if(/\/api\/fires\b/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify({at:Date.now(),per:{features:[]},loc:{features:[]}})});
  if(/\/api\/valhalla\/status/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:false})});
  if(/\/api\/(places|valhalla\/)/.test(u)) return r.fulfill({status:503,contentType:'application/json',body:'{}'});
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('maplibre-gl.min.css')) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.css') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (u.includes('/api/firms')) { asked.push(new URL(u).searchParams.get('bbox')); return J({ at: now, spots }); }
  if (u.includes('arcgis.com')) return J({ type: 'FeatureCollection', features: [] });
  return r.abort();
});
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);
const res = await p.evaluate(async () => {
  prefs.fires = true; fires = []; fireBoxes = []; fireAt = 0;
  await loadFires([-117.2, 31.7, -116.4, 33.0]); await new Promise(r => setTimeout(r, 600));   // satellite fires arrive on their own
  return { us: [inUS(32.72, -117.16), inUS(32.50, -117.03), inUS(31.79, -106.42), inUS(31.69, -106.42), inUS(25.9, -97.5), inUS(45, -93)],
    fires: fires.map(f => ({ sat: !!f.sat, active: f.active, r: Math.round(f.r), c: f.c.map(n => +n.toFixed(3)), info: f.info })), msg: $('fireMsg').textContent };
});
console.log(JSON.stringify(res, null, 1));
check(JSON.stringify(res.us) === JSON.stringify([true, false, true, false, false, true]), 'US / Mexico split along the border (San Diego, Tijuana, El Paso, Juarez, Matamoros, Minnesota)');
check(JSON.stringify(asked.slice().sort()) === JSON.stringify(['-118,30,-116,32', '-118,32,-116,34']), 'one request per 2-degree square the trip touches (shared at the edge)');
check(res.fires.length === 1 && res.fires[0].sat && res.fires[0].active && Math.abs(res.fires[0].c[0] - 32.094) < 0.01, 'the Mexican group is one active fire; the lone spot and the US spots are left out');
check(/4 heat spots/.test(res.fires[0].info) && /farm burn/.test(res.fires[0].info), 'the info says how many spots and that it is not confirmed');
check(/1 active fire/.test(res.msg), 'settings line counts it');
console.log('errors', errs); await b.close(); if (errs.length) process.exit(1);
