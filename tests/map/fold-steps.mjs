// Directions say only what there is to do: "continue on", "becomes" and the merge off a ramp are folded into the step
// before; exits are spoken by number and side, not the whole sign; the exit is announced as soon as you are on the
// highway; the top line still names the road you are on within a folded step.
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT = new URL('../../', import.meta.url).pathname, CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT + 'brinamaps/public/map/index.html', 'utf8');
const HERE = [32.355, -117.05], errs = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, permissions: ['geolocation'], geolocation: { latitude: HERE[0], longitude: HERE[1] } });
await ctx.addInitScript(() => {
  window.__said = []; let cb = null;
  window.__move = (lat, lon, speed, bearing) => cb && cb({ latitude: lat, longitude: lon, accuracy: 5, time: Date.now(), speed: speed == null ? 30 : speed, bearing: bearing == null ? 90 : bearing });
  const generic = () => new Proxy({}, { get: () => () => Promise.resolve({}) });
  const BG = { addWatcher: (o, f) => { cb = f; setTimeout(() => f({ latitude: 32.355, longitude: -117.05, accuracy: 5, time: Date.now() }), 30); return Promise.resolve('w'); }, removeWatcher: () => Promise.resolve(), openSettings: () => Promise.resolve() };
  const TTS = { speak: o => (window.__said.push(o.text), Promise.resolve()), voices: () => Promise.resolve({ voices: [] }) };
  window.Capacitor = { isNativePlatform: () => true, Plugins: {}, registerPlugin: n => n === 'BackgroundGeolocation' ? BG : n === 'Voice' ? TTS : generic() };
});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGE ' + e));

// A straight road east, 20 km: 1 km of Oak, a ramp, a merge onto I-8, 10 km that becomes I-8 Business, then exit 28, then Elm to the end
const N = 200, coords = []; for (let i = 0; i <= N; i++) coords.push([HERE[0], HERE[1] + i * 0.001]);   // ~94 m apart
const encode = cs => { let o = '', pl = 0, pn = 0; const e = v => { v = v < 0 ? ~(v << 1) : v << 1; let s = ''; while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); }; for (const [a, b2] of cs) { const AA = Math.round(a * 1e6), BB = Math.round(b2 * 1e6); o += e(AA - pl) + e(BB - pn); pl = AA; pn = BB; } return o; };
const M = (type, b, e, names, extra) => Object.assign({ type, instruction: extra && extra.instruction || names[0] || '', verbal_pre_transition_instruction: extra && extra.pre || '', verbal_succinct_transition_instruction: extra && extra.short || '', street_names: names, begin_shape_index: b, end_shape_index: e, length: (e - b) * 0.0586, time: (e - b) * 3 }, extra || {});
const trip = { summary: { time: 600, length: 11.7 }, legs: [{ shape: encode(coords), maneuvers: [
  M(1, 0, 10, ['Oak Street'], { instruction: 'Drive east on Oak Street.', pre: 'Drive east on Oak Street.', short: 'Drive east.' }),
  M(18, 10, 14, ['I-8 East ramp'], { instruction: 'Take the ramp on the right onto I-8 East toward El Centro.', pre: 'Take the I-8 East ramp on the right toward El Centro.', short: 'Take the ramp on the right.', sign: { exit_branch_elements: [{ text: 'I-8 East' }], exit_toward_elements: [{ text: 'El Centro' }] } }),
  M(25, 14, 60, ['I-8 East'], { instruction: 'Merge onto I-8 East.', pre: 'Merge onto I-8 East.', short: 'Merge onto I-8 East.', highway: true }),
  M(7, 60, 120, ['I-8 Business'], { instruction: 'I-8 East becomes I-8 Business.', pre: 'I-8 East becomes I-8 Business.', short: 'Continue.', highway: true }),
  M(8, 120, 150, ['I-8 Business'], { instruction: 'Continue on I-8 Business.', pre: 'Continue on I-8 Business for 2 miles.', short: 'Continue.', highway: true }),
  M(20, 150, 160, ['Exit 28 ramp'], { instruction: 'Take exit 28 on the right onto Elm Avenue toward Downtown / Harbor / Airport.', pre: 'Take exit 28 on the right onto Elm Avenue toward Downtown, Harbor, Airport.', short: 'Take exit 28 on the right.', sign: { exit_number_elements: [{ text: '28' }], exit_branch_elements: [{ text: 'Elm Avenue' }], exit_toward_elements: [{ text: 'Downtown' }, { text: 'Harbor' }, { text: 'Airport' }] } }),
  M(15, 160, 200, ['Elm Avenue'], { instruction: 'Turn left onto Elm Avenue.', pre: 'Turn left onto Elm Avenue.', short: 'Turn left.' }),
  M(4, 200, 200, [], { instruction: 'You have arrived at your destination.', pre: 'You have arrived at your destination.', short: 'You have arrived.' })] }] };
await p.route('**/*', async r => {
  const u = r.request().url(), J = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify(o), headers: { 'access-control-allow-origin': '*' } });
  if (/\/api\/valhalla\/status/.test(u)) return J({ ok: true });
  if (/\/api\/valhalla\/route/.test(u)) return J({ trip });
  if (/\/api\/(fires|firms|tolls|border)\b/.test(u)) return J({ at: Date.now(), per: { features: [] }, loc: { features: [] }, spots: [], booths: [], ports: [] });
  if (/\/api\/places/.test(u)) return J({ ok: true, places: [] });
  if (u.startsWith('http://localhost/map')) return r.fulfill({ contentType: 'text/html', body: html });
  if (u.includes('maplibre-gl.min.js')) return r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.js') });
  if (u.includes('maplibre-gl.min.css')) return r.fulfill({ contentType: 'text/css', body: fs.readFileSync(ROOT + 'node_modules/maplibre-gl/dist/maplibre-gl.css') });
  if (u.includes('openfreemap')) return J({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eee' } }] });
  if (u.startsWith('https://brinamaps.com/api/geo')) return J({ type: 'FeatureCollection', features: [] });
  return r.abort();
});
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);
await p.evaluate(() => { ownDownUntil = 0; prefs.voice = 'standard'; });
await p.evaluate(c => setPoint('to', { lat: c[200][0], lon: c[200][1], label: 'Casa', name: 'Casa' }), coords);
await p.waitForFunction(() => routes.length > 0, null, { timeout: 8000 }).catch(() => {});
const kinds = await p.evaluate(() => routes[0].steps.map(s => s.short));
console.log('steps after folding:', kinds);
check(kinds.length === 5, 'eight router steps fold into five: start, ramp, exit, turn, arrive');
check(!kinds.some(k => /^Continue\.?$|Merge/.test(k)), 'no "continue" or merge step is left');
const ramp = await p.evaluate(() => routes[0].steps[1]);
console.log('ramp step:', ramp.say, '|', ramp.length.toFixed(2), 'mi |', JSON.stringify(ramp.roads));
check(/^Take the ramp on the right toward I-8 East\.$/.test(ramp.say), 'the ramp is spoken with one sign name');
check(ramp.length > 7.5 && ramp.roads && ramp.roads.length === 3, 'the ramp step carries the whole highway stretch and the road names along it');
const exit = await p.evaluate(() => routes[0].steps[2]);
console.log('exit step:', exit.say, '|', exit.sign);
check(exit.say === 'Take exit 28 on the right.', 'the exit is spoken by number and side only');
check(/Exit 28, toward Downtown/.test(exit.sign), 'the card keeps the sign text');

await p.evaluate(() => { try { exitSearch(); } catch (e) {} startNav(); }); await p.waitForTimeout(500);
await p.evaluate(c => window.__move(c[2][0], c[2][1], 12), coords); await p.waitForTimeout(300);
await p.evaluate(c => window.__move(c[16][0], c[16][1], 30), coords); await p.waitForTimeout(300);   // just merged onto the highway
let said = await p.evaluate(() => window.__said);
console.log('said:', said);
check(said.some(t => /^In \d.* miles?, take exit 28 on the right\.$/.test(t)), 'on the highway, the exit is announced at once with its distance');
check(!said.some(t => /Continue|Merge|becomes/.test(t)), 'nothing is said about continuing, merging or the name change');
const strip = await p.textContent('#strip');
console.log('strip on the highway:', strip);
check(/On I-8 East/.test(strip), 'the top line names the highway');
await p.evaluate(c => window.__move(c[70][0], c[70][1], 30), coords); await p.waitForTimeout(300);
check(/On I-8 Business/.test(await p.textContent('#strip')), 'and the new name once the road becomes I-8 Business');
await p.evaluate(c => window.__move(c[80][0], c[80][1], 30), coords); await p.waitForTimeout(300);
said = await p.evaluate(() => window.__said);
check(said.filter(t => /take exit 28/.test(t)).length === 1, 'the heads-up is said once, not on every fix');
console.log('errors', errs); await b.close(); process.exit(errs.length ? 1 : 0);
