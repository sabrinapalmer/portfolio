// The page as the iPhone app runs it: native shell detected, everything through the site's server (Geoapify for
// search and routing, TomTom for Premium traffic), App Store subscription. No community servers may be called.
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'public/map/index.html', 'utf8');
const HERE = [32.355, -117.05];
const errs = [], calls = [];
let dirty = false, tollBooths = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };

// Geoapify-shaped answers
const place = (name, lat, lon, city, country, cat) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] },
  properties: { name, city, country, country_code: country === 'Mexico' ? 'mx' : country === 'United States' ? 'us' : '', categories: cat ? [cat] : [], result_type: 'amenity', datasource: { raw: { osm_type: 'n', osm_id: Math.round(lat * 1e5), opening_hours: 'Mo-Su 07:00-23:00' } } } });
function geoRoute(q) {
  const av = q.get('avoid') || '';
  // A route with a dirt service road that dips across the border mid-way, unless that spot is blocked
  if (q.get('dirty') !== null && !av.includes('location:')) {
    const wp = q.get('waypoints').split('|').map(s => s.split(',').map(Number)), [A, B] = [wp[0], wp.at(-1)];
    const m1 = [A[0] + (B[0] - A[0]) / 3, A[1] - 0.02], m2 = [A[0] + 2 * (B[0] - A[0]) / 3, A[1] - 0.02];
    const seg = (from, to, d, extra) => Object.assign({ from_index: from, to_index: to, distance: d, time: d / 20, toll: false, ferry: false, road_class: 'primary', surface: 'paved_smooth' }, extra);
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'MultiLineString', coordinates: [[[A[1], A[0]], [m1[1], m1[0]], [m2[1], m2[0]], [B[1], B[0]]]] },
      properties: { distance: 60000, time: 2800, toll: false, admin_areas: [{ country_code: 'mx' }, { country_code: 'us' }], legs: [{ distance: 60000, time: 2800, steps: [
        seg(0, 1, 20000, { instruction: { text: 'Drive south.', type: 'StartAt' }, admin_area: [0] }),
        seg(1, 2, 20000, { surface: 'dirt', road_class: 'service_other', admin_area: [0, 1] }),
        seg(2, 3, 20000, { instruction: { text: 'Turn left.', type: 'Left' }, admin_area: [1, 0] }),
        { from_index: 3, to_index: 3, distance: 0, time: 0, toll: false, ferry: false, instruction: { text: 'You have arrived.', type: 'DestinationReached' }, admin_area: [0] }] }] } }] };
  }
  const wp = q.get('waypoints').split('|').map(s => s.split(',').map(Number)), [A, B] = [wp[0], wp.at(-1)];
  const avoidTolls = (q.get('avoid') || '').includes('tolls'), short = q.get('type') === 'short';
  const mid = avoidTolls ? [(A[0] + B[0]) / 2, A[1] + 0.06] : short ? [(A[0] + B[0]) / 2, A[1] + 0.02] : [(A[0] + B[0]) / 2, A[1] - 0.03];
  const toll = !avoidTolls, t = avoidTolls ? 4300 : short ? 3600 : 3000;
  const step = (i, type, text, from, to, d, extra) => Object.assign({ from_index: from, to_index: to, distance: d, time: t * d / 60000, toll, ferry: false, road_class: 'motorway', surface: 'paved',
    instruction: { text, type, pre_transition_instruction: text, transition_instruction: text, streets: ['Carretera ' + (toll ? '1D' : '1')] } }, extra || {});
  return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'MultiLineString', coordinates: [[[A[1], A[0]], [mid[1], mid[0]], [B[1], B[0]]]] },
    properties: { distance: 60000, time: t, toll, legs: [{ distance: 60000, time: t, steps: [
      step(0, 'StartAt', 'Drive south on Carretera.', 0, 1, 30000), step(1, 'Left', 'Turn left onto Carretera.', 1, 2, 30000),
      { from_index: 2, to_index: 2, distance: 0, time: 0, toll: false, ferry: false, instruction: { text: 'You have arrived at your destination.', type: 'DestinationReached' } }] }] } }] };
}

const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['geolocation'], geolocation: { latitude: HERE[0], longitude: HERE[1] } });
// Pretend to be the native shell, with an App Store that sells the two subscriptions
await ctx.addInitScript(() => {
  const generic = () => new Proxy({}, { get: () => () => Promise.resolve({}) });
  const BG = { addWatcher: (opts, cb) => { setTimeout(() => cb({ latitude: 32.355, longitude: -117.05, accuracy: 8, time: Date.now() }), 50); return Promise.resolve('w1'); }, removeWatcher: () => Promise.resolve(), openSettings: () => Promise.resolve() };
  window.Capacitor = { isNativePlatform: () => true, Plugins: {}, registerPlugin: n => n === 'BackgroundGeolocation' ? BG : generic() };
  const owned = new Set(), h = { productUpdated: [], receiptUpdated: [], approved: [], finished: [] }, fire = (k, x) => h[k].forEach(f => f(x));
  const product = (id, price) => ({ id, pricing: { price }, getOffer: () => ({ order: async () => { owned.add(id); const t = { finish: () => fire('finished', t) }; fire('approved', t); fire('receiptUpdated'); } }) });
  const products = { 'com.sabrinapalmer.map.premium.monthly': product('com.sabrinapalmer.map.premium.monthly', '$1.99'), 'com.sabrinapalmer.map.premium.yearly': product('com.sabrinapalmer.map.premium.yearly', '$14.99') };
  const when = { productUpdated: f => (h.productUpdated.push(f), when), receiptUpdated: f => (h.receiptUpdated.push(f), when), approved: f => (h.approved.push(f), when), finished: f => (h.finished.push(f), when) };
  window.CdvPurchase = { ProductType: { PAID_SUBSCRIPTION: 'paid subscription' }, Platform: { APPLE_APPSTORE: 'ios-appstore' }, ErrorCode: { PAYMENT_CANCELLED: 6777006 },
    store: { get localTransactions() { return [...owned].map(id => ({ products: [{ id }], purchaseDate: new Date(), jwsRepresentation: 'signed-record-for-' + id })); }, register() {}, when: () => when, error() {}, initialize: async () => { setTimeout(() => fire('productUpdated'), 0); }, get: id => products[id], owned: id => owned.has(id), restorePurchases: async () => {} } };
});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGE ' + e)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await p.route('**/*', async r => {
  const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o), headers: { 'access-control-allow-origin': '*' } });
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('maplibre-gl.min.css')) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.css') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (/photon|nominatim|openstreetmap\.de|census\.gov/.test(u)) { calls.push('COMMUNITY ' + u); return r.abort(); }
  if (u.startsWith('https://www.sabrinapalmer.com/api/geo')) {
    const q = new URL(u).searchParams, ep = q.get('ep'); calls.push('geo ' + ep + (q.get('avoid') ? ' avoid=' + q.get('avoid') : '') + (q.get('type') ? ' type=' + q.get('type') : ''));
    if (ep === 'autocomplete' && /oxxo/i.test(q.get('text'))) return J({ type: 'FeatureCollection', features: q.get('filter') === 'countrycode:us'
      ? [place('Oxxo', 32.56, -117.04, 'San Ysidro', 'United States')]
      : [place('Oxxo', 32.36, -117.05, 'Rosarito', 'Mexico'), place('Oxxo', 32.60, -116.99, 'Tijuana', 'Mexico')] });
    if (ep === 'autocomplete' && /hacienda/i.test(q.get('text'))) return J({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [-117.09, 32.42] },
      properties: { housenumber: '43', street: 'Hacienda Agua Nueva', city: 'Tijuana', country: 'Mexico', country_code: 'mx', result_type: 'building', datasource: { raw: {} } } }] });
    if (ep === 'autocomplete') return J({ type: 'FeatureCollection', features: /walmart/i.test(q.get('text')) ? [place('Walmart', 32.64, -117.08, 'Chula Vista', 'United States'), place('Walmart Supercenter', 32.47, -117.00, 'Tijuana', 'Mexico'), place('Walmart Pharmacy', 32.6401, -117.0801, 'Chula Vista', 'United States'), place('Walmart', 32.37, -117.06, 'Rosarito', 'Mexico')] : [place('Ensenada', 31.86, -116.6, 'Ensenada', 'Mexico')] });
    if (ep === 'search' || ep === 'reverse' || ep === 'places') return J({ type: 'FeatureCollection', features: [] });
    if (ep === 'routing') { if (dirty) q.set('dirty', '1'); return J(geoRoute(q)); }
    if (ep === 'matrix') { const b = JSON.parse(r.request().postData() || '{}'); return J({ sources_to_targets: [b.targets.map((t, i) => ({ time: 600 + 300 * i, distance: 1000 }))] }); }
    return r.fulfill({ status: 404, body: '{}' });
  }
  if (u.startsWith('https://www.sabrinapalmer.com/api/poi')) { calls.push('poi ' + new URL(u).searchParams.get('q')); return J({ places: /hacienda/i.test(u) ? [{ name: 'Hacienda Km 43', street: 'Carretera Libre Tijuana-Ensenada Km 43', city: 'Puerto Nuevo', state: 'Baja California', country: 'Mexico', cc: 'mx', lat: 32.25, lon: -116.94 }] : [] }); }
  if (u.startsWith('https://www.sabrinapalmer.com/map/data/tolls.json')) { calls.push('toll list'); return r.fulfill({ status: 404, body: '' }); }
  if (u.startsWith('https://www.sabrinapalmer.com/api/firms')) { calls.push('firms'); return J({ at: Date.now(), spots: [] }); }
  if (u.startsWith('https://www.sabrinapalmer.com/api/tolls')) { calls.push('tolls'); return J({ booths: tollBooths }); }
  if (u.startsWith('https://www.sabrinapalmer.com/api/border')) { calls.push('border'); return J({ at: Date.now(), ports: [{ port: 'San Ysidro', crossing: '', status: 'Open', standard: { minutes: 75, status: 'delay' }, ready: { minutes: 45, status: 'delay' }, sentri: { minutes: 15, status: 'no delay' } }] }); }
  if (u.startsWith('https://www.sabrinapalmer.com/api/premium')) {
    const body = JSON.parse(r.request().postData() || '{}'); calls.push('premium ' + body.transaction);
    return J({ pass: 'test-pass.sig', expires: Date.now() + 30 * 864e5 });
  }
  if (u.startsWith('https://www.sabrinapalmer.com/api/traffic')) {
    calls.push('traffic ' + new URL(u).searchParams.get('ep') + ' t=' + new URL(u).searchParams.get('t'));
    if (new URL(u).searchParams.get('ep') === 'flow') return r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') });
    return J({ routes: [{ summary: { travelTimeInSeconds: 3300, noTrafficTravelTimeInSeconds: 3000, lengthInMeters: 60000 }, legs: [{ points: [{ latitude: HERE[0], longitude: HERE[1] }, { latitude: 31.86, longitude: -116.6 }] }], guidance: { instructions: [] }, sections: [] }] });
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return r.fulfill({ contentType: 'text/css', body: '' });
  if (u.includes('wildfire') || u.includes('arcgis') || u.includes('nifc')) return J({ features: [] });
  calls.push('OTHER ' + u); return r.abort();
});
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);
check(await p.evaluate(() => document.body.classList.contains('native')), 'runs in app mode');

await p.fill('#to', 'walmart'); await p.waitForTimeout(2500);
const list = await p.$$eval('#suggest li:not(.head)', e => e.map(x => x.innerText.replace(/\n/g, ' / ')));
console.log('walmart list:', list);
check(list.length && /Rosarito/.test(list[0]), 'search via Geoapify lists the Rosarito Walmart first');
check(calls.filter(c => c === 'geo autocomplete').length <= 2, 'one search request per query (was three)');
check(list.length === 3 && /Supercenter/.test(list[1]) && /Chula Vista/.test(list[2]), 'all results in one list nearest first, the Supercenter included, the pharmacy folded into its store');
await p.waitForTimeout(1200);
const timed = await p.$$eval('#suggest li:not(.head) em', e => e.map(x => x.innerText));
console.log('right column:', timed);
check(timed.length === 3 && timed.every(t => /min/.test(t)), 'each option shows the drive time');
const toBefore = await p.evaluate(() => pts.to);
await p.focus('#to'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
check(await p.isVisible('#suggest') && (await p.evaluate(() => pts.to)) === toBefore, 'Return keeps the options open and picks nothing');
check(await p.evaluate(() => document.activeElement.id !== 'to'), 'Return puts the keyboard away');
check(await p.evaluate(() => poiMarkers.length) >= 1, 'Return pins the nearby options on the map');

// Near the border, the other country's places are asked for too and listed by distance
const cb = calls.length;
await p.fill('#to', 'oxxo'); await p.waitForTimeout(2500);
const ox = await p.$$eval('#suggest li:not(.head)', e => e.map(x => x.innerText.replace(/\n/g, ' / ')));
console.log('oxxo list:', ox);
check(ox.length === 3 && ox.some(x => /San Ysidro/.test(x)) && /Rosarito/.test(ox[0]), 'search near the border lists both countries, nearest first');
check(calls.slice(cb).filter(c => c === 'geo autocomplete').length === 2 && calls.slice(cb).filter(c => c.startsWith('poi')).length === 1, 'one extra request for the other side, one to the place list');
// A business the open map data lacks comes from the place list
await p.fill('#to', 'hacienda km 43'); await p.waitForTimeout(2500);
const hk = await p.$$eval('#suggest li:not(.head)', e => e.map(x => x.innerText.replace(/\n/g, ' / ')));
console.log('hacienda list:', hk);
check(/Hacienda Km 43/.test(hk[0] || '') && calls.some(c => c === 'poi hacienda km 43'), 'a restaurant missing from the open map data is found through the place list');

await p.fill('#to', 'ensenada'); await p.waitForTimeout(1500); await p.click('#suggest li:not(.head)'); await p.waitForTimeout(2500);
console.log('routes:', (await p.innerText('#routes')).replace(/\n/g, ' / '));
const rs = await p.evaluate(() => routes.map(r => ({ toll: r.toll, steps: r.steps.length, kinds: r.steps.map(s => s.kind).join(','), road: r.steps[0].road, dist: +r.dist.toFixed(1) })));
console.log('route data:', JSON.stringify(rs));
check(rs.length >= 2 && rs.some(r => !r.toll), 'routing via Geoapify offers a toll-free option');
check(rs[0].kinds === 'other,turn,arrive' && rs[0].road && Math.abs(rs[0].dist - 37.3) < 0.2, 'Geoapify steps, roads and distance read correctly');

// Premium: hidden traffic until bought, then traffic goes through the site's server
check(await p.evaluate(() => !hasTraffic()), 'no traffic before subscribing');
await p.click('#openPrefs'); await p.waitForTimeout(400);
console.log('premium buttons:', await p.$$eval('#premBuy button', e => e.filter(x => x.offsetParent).map(x => x.innerText)));
check(await p.isVisible('#premM') && /1\.99/.test(await p.innerText('#premM')), 'Premium shows App Store prices');
check(!(await p.isVisible('#geoKey')) && !(await p.isVisible('#ttKey')), 'key boxes hidden in the app');
await p.click('#premM'); await p.waitForTimeout(2500);
check(await p.evaluate(() => premium.active && hasTraffic()), 'buying monthly turns Premium on');
check(calls.some(c => c === 'premium signed-record-for-com.sabrinapalmer.map.premium.monthly'), 'the App Store record is sent to the server for a pass');
check(calls.some(c => c.startsWith('traffic')) && calls.filter(c => c.startsWith('traffic')).every(c => c.endsWith('t=test-pass.sig')), 'every traffic request carries the pass');
console.log('premium msg:', await p.innerText('#premMsg'));

// Paved only + no alleys + no border crossings: the dirt, alley and border stretch gets blocked and the route asked again
dirty = true;
await p.click('#closePrefs').catch(() => {});
const before = calls.length;
await p.evaluate(async () => { prefs.noUnpaved = prefs.noAlleys = prefs.noBorders = true; prefs.trafficRoute = false; await route(); });
await p.waitForTimeout(1500);
const asks = calls.slice(before).filter(c => c.startsWith('geo routing'));
console.log('routing asks with settings on:', asks);
check(asks.some(c => /location:/.test(c)), 'unpaved / alley / border stretch blocked and asked again');
check(await p.evaluate(() => routes.length && !geoBreaks(routes[0]).length), 'chosen route has no unpaved road, alley or border crossing');
await p.evaluate(async () => { prefs.noUnpaved = false; prefs.noAlleys = false; prefs.noBorders = false; await route(); });
await p.waitForTimeout(1000);
check(await p.evaluate(() => routes[0].segs.some(s => s.surf === 'dirt')), 'with the settings off the quicker dirt route is used');
dirty = false;

// Several stops, the trip panel, and Home in the quick buttons
await p.evaluate(async () => { await addStop({ lat: 32.30, lon: -117.03, name: 'Oxxo', label: 'Oxxo, Rosarito' }); await new Promise(r => setTimeout(r, 800)); await addStop({ lat: 32.10, lon: -116.90, name: 'Pemex', label: 'Pemex, La Mision' }); });
await p.waitForTimeout(1500);
check(await p.evaluate(() => pts.stops.map(s => s.name).join(',')) === 'Oxxo,Pemex', 'two stops kept in order along the way');
check(await p.evaluate(() => /2 stops/.test($('tripStops').textContent) && $('tripStops').style.display !== 'none'), 'route card says 2 stops');
await p.evaluate(() => openTrip()); await p.waitForTimeout(300);
const tripRows = await p.$$eval('#tripList li', e => e.map(x => x.innerText.replace(/\n/g, ' ')));
console.log('trip:', tripRows);
check(tripRows.length === 4 && /Oxxo/.test(tripRows[1]) && /Pemex/.test(tripRows[2]), 'trip panel lists start, both stops and the destination');
await p.click('#tripList li:nth-child(2) button.x'); await p.waitForTimeout(1200);
check(await p.evaluate(() => pts.stops.length === 1 && pts.stops[0].name === 'Pemex'), 'a stop can be removed from the trip panel');
await p.evaluate(() => { closeSheets(); savePlace('home', { lat: 32.0, lon: -116.9, label: 'La Salina, Baja California', name: 'La Salina' }); clearAll(); });
await p.waitForTimeout(300);
check((await p.$$eval('#quick button', e => e.map(x => x.className + ':' + x.innerText)))[0] === 'home:Home', 'Home is the first quick button');

// Tolls: a toll-tagged road with no booth on the way is a free stretch; with a booth it has tolls
await p.evaluate(() => { closeSheets(); prefs.trafficRoute = false; });
tollBooths = [];
await p.evaluate(async () => { clearAll(); pts.from = { lat: 32.355, lon: -117.05, label: 'My location', auto: true }; setPoint('to', { lat: 31.86, lon: -116.6, label: 'Ensenada', name: 'Ensenada' }); await new Promise(r => setTimeout(r, 2500)); });
const free = await p.evaluate(() => routes.map(r => [!!r.toll, !!r.freeToll]));
console.log('no booths:', JSON.stringify(free));
check(free.length && free.every(([t]) => !t) && free.some(([, f]) => f), 'toll road without a booth on the way does not count as tolls');
check(await p.evaluate(() => /Free stretch of a toll road/.test($('why').innerText) && !/Has tolls/.test($('why').innerText)), 'route card says free stretch, not Has tolls');
tollBooths = [[32.1075, -117.08]];
await p.evaluate(async () => { boothCache.clear(); await route(); });
await p.waitForTimeout(1500);
check(await p.evaluate(() => routes.some(r => r.toll)), 'a booth on the way does count as tolls');
// Border: a route north through San Ysidro shows the port, the chosen lane's wait and when you get there
const bline = await p.evaluate(async () => {
  prefs.lane = 'ready';
  const rt = { coords: [[32.50, -117.03], [32.52, -117.03], [32.5422, -117.0291], [32.56, -117.04], [32.60, -117.05]], steps: [{ begin: 0, end: 2, time: 1200 }, { begin: 2, end: 4, time: 600 }] };
  await checkBorder([rt]); return borderLine(rt);
});
console.log('border:', bline);
check(/San Ysidro/.test(bline) && /Ready Lane wait now: 45 min/.test(bline) && /border in 20 min/.test(bline), 'border line names the port, your lane, its wait and when you reach it');
// SENTRI: the router's own 10-minute guess for the line is swapped for the SENTRI wait, and the step names the lane
const sen = await p.evaluate(async () => {
  prefs.lane = 'sentri';
  const rt = { time: 2400, coords: [[32.50, -117.03], [32.52, -117.03], [32.5422, -117.0291], [32.56, -117.04], [32.60, -117.05]],
    steps: [{ begin: 0, end: 1, time: 1200, length: 10 }, { begin: 1, end: 2, time: 640, length: 0.1, instruction: 'Bear left onto Linea Normal.' }, { begin: 2, end: 4, time: 560, length: 6 }] };
  await checkBorder([rt]); const a = { time: rt.time, step: rt.steps[1].instruction, line: borderLine(rt) };
  prefs.lane = 'standard'; await checkBorder([rt]); a.std = rt.time; return a;
});
console.log('sentri:', JSON.stringify(sen));
check(Math.abs(sen.time - (2400 - (640 - 160.9 / 8) + 15 * 60)) < 5 && /SENTRI line/.test(sen.step) && /SENTRI wait now: 15 min/.test(sen.line), 'SENTRI wait replaces the router guess in the trip time and the step names the SENTRI line');
check(Math.abs(sen.std - (2400 - (640 - 160.9 / 8) + 75 * 60)) < 5, 'switching to the regular lane recomputes from the original time (75 min wait)');

// The weekly toll list: booths in a cell come from it without asking the server
const fromList = await p.evaluate(async () => { boothCache.clear(); boothList = Promise.resolve([[32.11, -117.06], [40, -100]]); const n = calls0 => 0; return await boothsIn(Math.floor(-117.06 / 0.25) + ',' + Math.floor(32.11 / 0.25)); });
check(JSON.stringify(fromList) === '[[32.11,-117.06]]', 'toll booths come from the saved list when it is there');
const community = calls.filter(c => c.startsWith('COMMUNITY') || c.startsWith('OTHER'));
console.log('geo calls:', calls.filter(c => c.startsWith('geo')).length, '| first few:', calls.filter(c => c.startsWith('geo')).slice(0, 8));
check(!community.length, 'no community servers or unknown hosts called' + (community.length ? ': ' + community.slice(0, 3).join(' ; ') : ''));
console.log('errors', errs); await b.close();
