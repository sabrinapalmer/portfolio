// Fixes from the November review: an address search does not wait for the own place list, the top line stops naming a
// removed stop at once, the route match does not jump to a part of the route that doubles back nearby, and the lock
// screen keeps the real next turn while a later turn is previewed.
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'brinamaps/public/map/index.html', 'utf8');
const HERE = [32.355, -117.05], errs = [], calls = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['geolocation'], geolocation: { latitude: HERE[0], longitude: HERE[1] } });
await ctx.addInitScript(() => {
  window.__live = []; let cb = null;
  window.__move = (lat, lon, speed, bearing) => cb && cb({ latitude: lat, longitude: lon, accuracy: 5, time: Date.now(), speed: speed == null ? 12 : speed, bearing: bearing == null ? 90 : bearing });
  const generic = () => new Proxy({}, { get: () => () => Promise.resolve({}) });
  const BG = { addWatcher: (o, f) => { cb = f; setTimeout(() => f({ latitude: 32.355, longitude: -117.05, accuracy: 5, time: Date.now() }), 30); return Promise.resolve('w'); }, removeWatcher: () => Promise.resolve(), openSettings: () => Promise.resolve() };
  const LIVE = { start: o => (window.__live.push(['start', o]), Promise.resolve({ on: true })), update: o => (window.__live.push(['update', o]), Promise.resolve()), end: o => (window.__live.push(['end', o]), Promise.resolve()) };
  window.Capacitor = { isNativePlatform: () => true, Plugins: {}, registerPlugin: n => n === 'BackgroundGeolocation' ? BG : n === 'LiveNav' ? LIVE : generic() };
});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGE ' + e));
const addr = { type: 'Feature', geometry: { type: 'Point', coordinates: [-117.09, 32.42] }, properties: { housenumber: '123', street: 'Boulevard Popotla', city: 'Rosarito', country: 'Mexico', country_code: 'mx', result_type: 'building', datasource: { raw: {} } } };
await p.route('**/*', async r => {
  const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o), headers: { 'access-control-allow-origin': '*' } });
  if (/\/api\/(fires|firms)\b/.test(u)) return J(/firms/.test(u) ? { at: Date.now(), spots: [] } : { at: Date.now(), per: { features: [] }, loc: { features: [] } });
  if (/\/api\/valhalla\/status/.test(u)) return J({ ok: false });
  if (/\/api\/places\?health/.test(u)) return J({ ok: true });
  if (/\/api\/places/.test(u)) { calls.push('places ' + Date.now()); await new Promise(z => setTimeout(z, 2000)); return J({ places: [] }).catch(() => {}); }   // a slow own place list
  if (/\/api\/valhalla\//.test(u)) return r.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('maplibre-gl.min.css')) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.css') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (u.startsWith('https://brinamaps.com/api/geo')) {
    const q = new URL(u).searchParams, ep = q.get('ep'); calls.push('geo ' + ep + ' ' + Date.now());
    if (ep === 'autocomplete' || ep === 'search') return J({ type: 'FeatureCollection', features: /popotla/i.test(q.get('text')) ? [addr] : [] });
    return J({ type: 'FeatureCollection', features: [] });
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
  if (/census\.gov/.test(u)) { calls.push('census'); return r.abort(); }
  return r.abort();
});
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);

// 1. An address typed the Mexican way (number after the street) goes to the geocoder at once, not after the own list
await p.fill('#to', 'Blvd Popotla 123'); await p.waitForTimeout(900);
const tPlaces = calls.find(c => c.startsWith('places')), tGeo = calls.find(c => c.startsWith('geo autocomplete'));
console.log('calls so far:', calls);
check(tPlaces && tGeo && +tGeo.split(' ')[2] - +tPlaces.split(' ')[1] < 300, 'the geocoder is asked right after the own list, not 2.5 s later');
const list = await p.$$eval('#suggest li:not(.head):not(.cats)', e => e.map(x => x.innerText.replace(/\n/g, ' / ')));
console.log('address list:', list);
check(list.some(x => /Popotla/.test(x)), 'the address shows while the own list is still out');
check(!calls.includes('census'), 'the US address server is not asked for a Mexican address');
await p.waitForTimeout(2200);

// 2. A trip with a stop: removing the stop clears the "Next:" line at once
const A = HERE, coords = [], N = 60;
for (let i = 0; i <= N; i++) coords.push([A[0], A[1] + i * 0.0005]);   // east along one road
const encode = cs => { let o = '', pl = 0, pn = 0; const e = v => { v = v < 0 ? ~(v << 1) : v << 1; let s = ''; while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); }; for (const [a, b2] of cs) { const AA = Math.round(a * 1e6), BB = Math.round(b2 * 1e6); o += e(AA - pl) + e(BB - pn); pl = AA; pn = BB; } return o; };
const trip = { summary: { time: 600, length: 1.8 }, legs: [{ shape: encode(coords.slice(0, 31)), maneuvers: [
  { type: 1, instruction: 'Drive east.', verbal_succinct_transition_instruction: 'Drive east.', street_names: ['Oak'], begin_shape_index: 0, end_shape_index: 30, length: 0.9, time: 300 },
  { type: 4, instruction: 'Arrive at stop.', verbal_succinct_transition_instruction: 'Arrive.', begin_shape_index: 30, end_shape_index: 30, length: 0, time: 0 }] },
  { shape: encode(coords.slice(30)), maneuvers: [
  { type: 1, instruction: 'Continue east.', verbal_succinct_transition_instruction: 'Continue.', street_names: ['Oak'], begin_shape_index: 0, end_shape_index: 30, length: 0.9, time: 300 },
  { type: 4, instruction: 'You have arrived.', verbal_succinct_transition_instruction: 'You have arrived.', begin_shape_index: 30, end_shape_index: 30, length: 0, time: 0 }] }] };
await p.unroute('**/*');
await p.route('**/*', async r => {
  const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o), headers: { 'access-control-allow-origin': '*' } });
  if (/\/api\/valhalla\/route/.test(u)) { calls.push('route'); await new Promise(z => setTimeout(z, 1500)); return J({ trip }).catch(() => {}); }   // a slow reroute
  if (/\/api\/(fires|firms|tolls|border)\b/.test(u)) return J({ at: Date.now(), per: { features: [] }, loc: { features: [] }, spots: [], booths: [], ports: [] });
  if (/\/api\/places/.test(u)) return J({ places: [] });
  if (u.startsWith('https://brinamaps.com/api/geo')) return J({ type: 'FeatureCollection', features: [] });
  return r.abort();
});
await p.evaluate(() => { ownDownUntil = 0; });
await p.evaluate(c => setPoint('to', { lat: c[60][0], lon: c[60][1], label: 'Casa, Rosarito', name: 'Casa' }), coords);
await p.waitForFunction(() => routes.length > 0, null, { timeout: 8000 }).catch(() => {});
const n0 = calls.filter(c => c === 'route').length;
await p.evaluate(c => addStop({ lat: c[30][0], lon: c[30][1], name: 'Oxxo Stop', label: 'Oxxo Stop, Rosarito' }), coords);
await p.waitForFunction(() => routes.length > 0 && pts.stops.length === 1 && routes[0].steps.some(s => s.kind === 'stop' && s.stopRef), null, { timeout: 10000 }).catch(() => {});
check(await p.evaluate(() => routes.length > 0 && nav === null && routes[0].steps.some(s => s.kind === 'stop' && s.stopRef)), 'a route with one stop is found');
await p.evaluate(() => { try { exitSearch(); } catch (e) {} startNav(); }); await p.waitForTimeout(600);
await p.evaluate(c => window.__move(c[3][0], c[3][1]), coords); await p.waitForTimeout(400);
const strip1 = await p.textContent('#strip');
console.log('strip during the trip:', strip1);
check(/Next: Oxxo Stop/.test(strip1), 'the top line names the next stop');
await p.evaluate(() => removeStop(pts.stops[0]));
const strip2 = await p.textContent('#strip');
console.log('strip right after removing the stop:', strip2);
check(!/Oxxo/.test(strip2), 'removing the stop clears it from the top line before the reroute answers');
await p.evaluate(c => window.__move(c[4][0], c[4][1]), coords); await p.waitForTimeout(300);
console.log('while rerouting:', await p.textContent('#strip'), '|', await p.textContent('#navText'), '|', await p.textContent('#navDist'));
check(/Rerouting/.test(await p.textContent('#strip')) && (await p.textContent('#navText')).length > 3 && (await p.textContent('#navDist')).length > 0, 'while rerouting, the banner keeps guiding and the top line says a reroute is running');
await p.waitForTimeout(2500);
check(!/Oxxo|Rerouting/.test(await p.textContent('#strip')), 'after the reroute the top line is back to normal');

// 3. Route matching on a road that doubles back next to itself (a stop off a highway, lanes at a port): heading east
// at speed, the match stays on the eastbound part even though the westbound part 25 m north is just as close
const snapRes = await p.evaluate(() => {
  const east = [], west = [], n = 40;
  for (let i = 0; i <= n; i++) east.push([32.355, -117.05 + i * 0.0004]);
  for (let i = n; i >= 0; i--) west.push([32.355 + 0.00022, -117.05 + i * 0.0004]);   // 25 m north, going back
  const c = east.concat(west), cum = [0]; for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + meters(c[i - 1], c[i]));
  const keep = nav; nav = { rt: { coords: c, steps: [] }, cum, seg: 8, along: cum[8] };
  const ll = [32.355 + 0.00013, -117.05 + 9 * 0.0004];   // 14 m north of the eastbound road, 11 m south of the westbound one
  const s = snap(ll, 90, 15);
  nav.seg = n + 30; nav.along = cum[n + 30];   // on the way back, 25 m north: the match must not drop onto the eastbound road below
  const s2 = snap(ll, 270, 15), s3 = snap(ll, 90, 15);   // ...unless the car is in fact heading east again (turned round)
  nav = keep;
  return { east: s.i, west: s2.i, turned: s3.i, n };
});
console.log('snap:', snapRes);
check(snapRes.east <= snapRes.n, 'heading east, the match stays on the eastbound road');
check(snapRes.west > snapRes.n, 'heading west on the way back, it stays on the westbound road');
(() => {
  return;
  const snapRes = { east: 0, west: 0, n: 0 };
})();

// 4. Previewing a later turn does not reach the lock screen
const before = await p.evaluate(() => window.__live.length);
await p.evaluate(() => { if (nav && nav.live) peekTo(nav.live.next + 1); });
await p.evaluate(c => window.__move(c[5][0], c[5][1]), coords); await p.waitForTimeout(300);
const during = await p.evaluate(() => window.__live.slice(-1)[0]);
check(!during || !/Preview|^In /.test(during[1].dist || ''), 'the lock screen never shows the preview');
await p.evaluate(() => peekTo(-1)); await p.waitForTimeout(200);
check(await p.evaluate(() => window.__live.length) > before, 'and gets the real state back when the preview ends');

console.log('errors', errs); await b.close(); process.exit(errs.length ? 1 : 0);
