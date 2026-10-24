// Search mode (instant feedback when the box is tapped), names printed on the map found by search, and tapping map names
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'public/map/index.html', 'utf8');
const errs = [], check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['geolocation'], geolocation: { latitude: 32.05, longitude: -116.88 } })).newPage();
p.on('pageerror', e => errs.push('PAGE ' + e.message));
await p.route('**/*', r => { const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o) });
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (u.includes('photon') || u.includes('nominatim') || u.includes('/api/')) return J({ features: [], places: [] });
  return r.abort(); });
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);
await p.click('#to');
check(await p.evaluate(() => document.body.classList.contains('searching')), 'tapping the box starts search mode at once');
check(await p.isVisible('#cancelSearch') && !(await p.isVisible('#openPrefs')), 'Cancel shows; settings button steps aside');

// names on the map: pretend the loaded tiles hold a camp and a street
const found = await p.evaluate(() => {
  map.getSource = id => id === 'openmaptiles' ? {} : null;
  map.querySourceFeatures = (src, o) => o.sourceLayer === 'poi' ? [{ properties: { name: 'Campo Ángeles', class: 'campsite' }, geometry: { type: 'Point', coordinates: [-116.86, 32.06] } }]
    : o.sourceLayer === 'place' ? [{ properties: { name: 'La Salina', class: 'village' }, geometry: { type: 'Point', coordinates: [-116.88, 32.05] } }] : [];
  return { es: mapNames('campo angeles', [32.05, -116.88]).map(x => x.main + '|' + x.sub), en: mapNames('angels camp', [32.05, -116.88]).map(x => x.main) };
});
console.log(JSON.stringify(found));
check(found.es[0] === 'Campo Ángeles|Campground', 'accents ignored: campo angeles finds Campo Ángeles');
check(found.en[0] === 'Campo Ángeles', 'English words: angels camp finds Campo Ángeles');
await p.fill('#to', 'campo angeles'); await p.waitForTimeout(400);
console.log('list:', (await p.innerText('#suggest')).replace(/\n/g, ' / ')); check(/Campo Ángeles/.test(await p.innerText('#suggest')), 'listed in the results');
await p.click('#cancelSearch'); await p.waitForTimeout(200);
check(await p.evaluate(() => !document.body.classList.contains('searching') && $('to').value === '' && $('suggest').style.display === 'none'), 'Cancel closes search, clears the box and the list');
await p.click('#to'); await p.mouse.click(200, 650); await p.waitForTimeout(200);
check(await p.evaluate(() => !document.body.classList.contains('searching')), 'tapping the dimmed map closes search');
console.log('errors', errs); await b.close(); if (errs.length) process.exit(1);
