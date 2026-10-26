// Spanish: a phone set to Spanish gets Spanish screens, directions asked in Spanish and a Spanish voice; place names stay as they are
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'public/map/index.html', 'utf8');
const errs = [], check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const asked = [];
const p = await (await b.newContext({ locale: 'es-MX', viewport: { width: 390, height: 800 }, permissions: ['geolocation'], geolocation: { latitude: 32.05, longitude: -116.88 } })).newPage();
p.on('pageerror', e => errs.push('PAGE ' + e.message));
await p.route('**/*', r => { const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o) });
  if (/\/api\/fires\b/.test(u)) return J({ at: Date.now(), per: { features: [] }, loc: { features: [] } });
  if (/\/api\/firms\b/.test(u)) return J({ at: Date.now(), spots: [] });
  if (/\/api\/valhalla\/status/.test(u)) return J({ ok: true, regions: { west: true } });
  if (/\/api\/valhalla\/route/.test(u)) { const q = JSON.parse(decodeURIComponent(u.split('json=')[1])); asked.push(q.language);
    return J({ trip: { summary: { time: 900, length: 6 }, legs: [{ shape: '_p~iF~ps|U_ulLnnqC', maneuvers: [
      { type: 1, instruction: 'Conduzca hacia el sur por Carretera 1.', verbal_pre_transition_instruction: 'Conduzca hacia el sur por Carretera 1.', begin_shape_index: 0, end_shape_index: 1, length: 6, time: 900, street_names: ['Carretera 1'] },
      { type: 4, instruction: 'Ha llegado a su destino.', begin_shape_index: 1, end_shape_index: 1, length: 0, time: 0 }] }] } }); }
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (u.includes('/api/places')) return J({ places: [{ id: 'x1', name: 'Park Bakery', kind: 'bakery', cat: 'shop:bakery', lat: 32.06, lon: -116.87, city: 'La Misión', cc: 'mx' }] });
  if (u.includes('photon') || u.includes('nominatim') || u.includes('/api/')) return J({ features: [], places: [] });
  return r.abort(); });
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);
check(await p.evaluate(() => document.documentElement.lang === 'es' && LANG === 'es'), 'a Spanish phone gets Spanish');
check(await p.getAttribute('#to', 'placeholder') === '¿A dónde?', 'search box placeholder in Spanish');
const t = await p.evaluate(() => [tr('25 min drive + 5 min to park.'), tr('In half a mile, turn left onto Calle 5.'), tr('Show 3 further away'), tr('Turn left'), tr('You have arrived.')]);
console.log(t);
check(t[0] === '25 min en auto + 5 min para estacionarse.', 'a composed line is translated in pieces');
check(t[1].startsWith('En media milla, ') && t[1].includes('Calle 5'), 'spoken distance in Spanish, street name kept');
check(t[2] === 'Mostrar 3 más lejos', 'a number between translated pieces');
check(t[3] === 'Gire a la izquierda' && t[4] === 'Ha llegado.', 'whole phrases');
await p.fill('#to', 'park bakery'); await p.waitForTimeout(1800);
const row = await p.$$eval('#suggest li:not(.head):not(.cats)', e => e.map(x => x.innerText.replace(/\n/g, ' / ')));
console.log('results:', row);
check(row.some(x => /^Park Bakery/.test(x)), 'a place name is not translated');
await p.click('#cancelSearch'); await p.waitForTimeout(200); await p.click('#openPrefs'); await p.waitForTimeout(300);
const settings = await p.evaluate(() => $('prefs').textContent);   // includes the folded sections
check(/Idioma/.test(settings) && /Unidades/.test(settings) && /Español/.test(settings), 'settings in Spanish, with the language choice');
await p.evaluate(() => closeSheets());
await p.evaluate(async () => { setPoint('to', { lat: 31.95, lon: -116.85, label: 'Ensenada', name: 'Ensenada' }); await new Promise(r => setTimeout(r, 1500)); });
check(asked.length && asked.every(l => l === 'es-ES'), 'directions asked from the router in Spanish');
const voice = await p.evaluate(() => { let got = null; window.speechSynthesis.speak = u => { got = { text: u.text, lang: u.lang }; }; window.speechSynthesis.cancel = () => {}; prefs.voice = 'detailed'; say('Starting directions.'); return got; });
console.log('voice:', voice);
check(voice && voice.text === 'Iniciando indicaciones.' && voice.lang === 'es-MX', 'the voice speaks Spanish');
// English chosen in settings wins over the phone
await p.evaluate(() => { prefs.lang = 'en'; savePrefs(); }); await p.reload(); await p.waitForTimeout(1200);
check(await p.evaluate(() => LANG === 'en') && await p.getAttribute('#to', 'placeholder') === 'Where to?', 'English chosen in settings stays English on a Spanish phone');
console.log('errors', errs); await b.close(); if (errs.length) process.exit(1);
