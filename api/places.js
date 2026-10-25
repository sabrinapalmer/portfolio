// BrinaMaps' own place list (Overture Maps + OpenStreetMap, loaded monthly into the app's database).
// Free to ask, unlike the paid search services, and cached at the edge so people nearby share answers.
//   /api/places?q=starbucks&lat=32.37&lon=-117.06          places whose name has every word, nearest first
//   /api/places?cats=amenity:cafe,shop&lat=..&lon=..&r=5   nearest places of some kinds within r km
//   /api/places?tile=12/703/1645                            every place in a map square (kept on the phone for offline search)
export const config = { runtime: 'edge' };

const SB = 'https://vtjkzkvimsywjjmuhrlg.supabase.co/rest/v1/rpc/';
const KEY = 'sb_publishable_mzTbHkZeezy73OgqtraEXA_MQ4tcm2P';   // publishable: the database only lets it read places
const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];
const COLS = ['id', 'name', 'kind', 'cat', 'lat', 'lon', 'addr', 'city', 'region', 'cc', 'phone', 'website', 'hours', 'facts', 'wikidata', 'wikipedia'];

const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });
const num = (v, lo, hi) => { const n = +v; return v !== null && v !== '' && isFinite(n) && n >= lo && n <= hi ? n : null; };
// Trimmed rows: empty fields left out, coordinates to about 10 cm
const slim = r => { const o = {}; COLS.forEach(k => { const v = r[k]; if (v !== null && v !== undefined && v !== '') o[k] = (k === 'lat' || k === 'lon') ? Math.round(v * 1e6) / 1e6 : v; }); if (r.d != null) o.d = Math.round(r.d); return o; };

async function rpc(fn, args) {
  const r = await fetch(SB + fn, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: AbortSignal.timeout(8000) });
  if (!r.ok) { const e = new Error('places ' + r.status); e.status = r.status; throw e; }
  return r.json();
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = origin; cors['Vary'] = 'Origin'; }
  else if (origin || !(req.headers.get('sec-fetch-site') === 'same-origin' || /^https:\/\/(www\.)?sabrinapalmer\.com\//.test(req.headers.get('referer') || ''))) return json(403, { error: 'origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' }, cors) });
  const u = new URL(req.url), q = u.searchParams;
  const noStore = Object.assign({ 'Cache-Control': 'no-store' }, cors);
  try {
    const tile = q.get('tile');
    if (tile) {
      const m = tile.match(/^(\d{1,2})\/(\d{1,7})\/(\d{1,7})$/); if (!m) return json(400, { error: 'bad tile' }, noStore);
      const [z, x, y] = m.slice(1).map(Number), n = 2 ** z;
      if (z < 10 || z > 14 || x >= n || y >= n) return json(400, { error: 'bad tile' }, noStore);
      const lon = v => v / n * 360 - 180, lat = v => Math.atan(Math.sinh(Math.PI * (1 - 2 * v / n))) * 180 / Math.PI;
      const rows = await rpc('places_box', { w: lon(x), s: lat(y + 1), e: lon(x + 1), n: lat(y), lim: 8000 });
      // Columns once, then one array per place: about half the size of plain objects
      const cols = COLS.filter(k => k !== 'region');
      return json(200, { tile, cols, rows: rows.map(r => cols.map(k => r[k] === null || r[k] === undefined ? null : r[k])) },
        Object.assign({ 'Cache-Control': 'public, s-maxage=604800, max-age=86400' }, cors));
    }
    const lat = num(q.get('lat'), -90, 90), lon = num(q.get('lon'), -180, 180);
    if (lat === null || lon === null) return json(400, { error: 'bad position' }, noStore);
    const cats = (q.get('cats') || '').split(',').map(c => c.trim()).filter(c => /^[a-z_]+(:[a-z0-9_]+)?$/.test(c)).slice(0, 8);
    if (cats.length) {
      const r = Math.min(num(q.get('r'), 0.5, 60) || 5, 60);
      const rows = await rpc('places_near', { cats, at_lat: lat, at_lon: lon, radius_km: r, lim: 20 });
      return json(200, { places: rows.map(slim) }, Object.assign({ 'Cache-Control': 'public, s-maxage=86400, max-age=600' }, cors));
    }
    const text = (q.get('q') || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (text.length < 2 || text.length > 80) return json(400, { error: 'bad query' }, noStore);
    const rows = await rpc('search_places', { q: text, at_lat: lat, at_lon: lon, radius_km: 150, lim: 15 });
    return json(200, { places: rows.map(slim) }, Object.assign({ 'Cache-Control': 'public, s-maxage=86400, max-age=600' }, cors));
  } catch (e) {
    return json(502, { error: 'place list unavailable' }, noStore);
  }
}
