// BrinaMaps' own place list (Overture Maps + OpenStreetMap, rebuilt monthly as one file served by the route server).
// Free to ask, unlike the paid search services, and cached at the edge so people nearby share answers.
//   /api/places?q=starbucks&lat=32.37&lon=-117.06          places whose name has every word, nearest first
//   /api/places?cats=amenity:cafe,shop&lat=..&lon=..&r=5   nearest places of some kinds within r km
//   /api/places?tile=12/703/1645                            every place in a map square (kept on the phone for offline search)
//   POST /api/places {pts:[[lat,lon]..], cats:[..], r:800}   places of some kinds along a route, in driving order
export const config = { runtime: 'edge' };

const ORIGINS = [/^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];
const COLS = ['id', 'name', 'kind', 'cat', 'lat', 'lon', 'addr', 'city', 'region', 'cc', 'phone', 'website', 'hours', 'facts', 'wikidata', 'wikipedia'];

const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });
const num = (v, lo, hi) => { const n = +v; return v !== null && v !== '' && isFinite(n) && n >= lo && n <= hi ? n : null; };
// Trimmed rows: empty fields left out, coordinates to about 10 cm
const slim = r => { const o = {}; COLS.forEach(k => { const v = r[k]; if (v !== null && v !== undefined && v !== '') o[k] = (k === 'lat' || k === 'lon') ? Math.round(v * 1e6) / 1e6 : v; }); if (r.d != null) o.d = Math.round(r.d); return o; };

// The place server on the route server, behind the same key as the routers
async function ask(path, body, ms = 4000) {   // the app stops waiting after 2.5 s anyway
  const base = (process.env.VALHALLA_URL || '').replace(/\/$/, '');
  const r = await fetch(base + '/places' + path, { method: body ? 'POST' : 'GET', headers: { 'X-Router-Key': process.env.VALHALLA_KEY || '', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(ms) });
  if (!r.ok) { const e = new Error('places ' + r.status); e.status = r.status; throw e; }
  return r.json();
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = '*'; }   // '*': one cached copy for the website and the app alike
  else if (origin || !(req.headers.get('sec-fetch-site') === 'same-origin' || /^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com\//.test(req.headers.get('referer') || ''))) return json(403, { error: 'origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }, cors) });
  const u = new URL(req.url), q = u.searchParams;
  const noStore = Object.assign({ 'Cache-Control': 'no-store' }, cors);
  if (q.get('health') !== null) {   // is the place list answering quickly? kept for a minute at the edge, so the app asks once
    const t0 = Date.now(), cache = Object.assign({ 'Cache-Control': 'public, s-maxage=60, max-age=30' }, cors);
    try { const h = await ask('/health', null, 1500); return json(200, { ok: !!h.ok, ms: Date.now() - t0, places: h.places, built: h.built }, cache); }
    catch (e) { return json(200, { ok: false, ms: Date.now() - t0 }, cache); }
  }
  if (req.method === 'POST') {   // along a route: not cached, every route is different
    let b; try { b = JSON.parse((await req.text()).slice(0, 120000)); } catch (e) { return json(400, { error: 'bad request' }, noStore); }
    const pts = (Array.isArray(b.pts) ? b.pts : []).slice(0, 3000).filter(p => Array.isArray(p) && num(p[0], -90, 90) !== null && num(p[1], -180, 180) !== null).map(p => [+(+p[0]).toFixed(5), +(+p[1]).toFixed(5)]);
    const cats = (Array.isArray(b.cats) ? b.cats : []).filter(c => typeof c === 'string' && /^[a-z_]+(:[a-z0-9_]+)?$/.test(c)).slice(0, 8);
    if (pts.length < 2 || !cats.length) return json(400, { error: 'bad request' }, noStore);
    try {
      const rows = await ask('/corridor', { pts, cats, r: Math.min(5000, Math.max(100, +b.r || 800)), lim: Math.min(60, Math.max(1, +b.lim || 30)) }, 6000);
      return json(200, { places: rows.map(r => Object.assign(slim(r), { along: r.along })) }, noStore);
    } catch (e) { return json(502, { error: 'place list unavailable' }, noStore); }
  }
  try {
    const tile = q.get('tile');
    if (tile) {
      const m = tile.match(/^(\d{1,2})\/(\d{1,7})\/(\d{1,7})$/); if (!m) return json(400, { error: 'bad tile' }, noStore);
      const [z, x, y] = m.slice(1).map(Number), n = 2 ** z;
      if (z < 10 || z > 14 || x >= n || y >= n) return json(400, { error: 'bad tile' }, noStore);
      const lon = v => v / n * 360 - 180, lat = v => Math.atan(Math.sinh(Math.PI * (1 - 2 * v / n))) * 180 / Math.PI;
      const rows = await ask('/box?' + new URLSearchParams({ w: lon(x), s: lat(y + 1), e: lon(x + 1), n: lat(y), lim: 8000 }));
      // Columns once, then one array per place: about half the size of plain objects
      const cols = COLS.filter(k => k !== 'region');
      return json(200, { tile, cols, rows: rows.map(r => cols.map(k => r[k] === null || r[k] === undefined ? null : r[k])) },
        Object.assign({ 'Cache-Control': rows.length ? 'public, s-maxage=604800, stale-while-revalidate=604800, max-age=86400' : 'public, s-maxage=600, max-age=60' }, cors));
    }
    const lat = num(q.get('lat'), -90, 90), lon = num(q.get('lon'), -180, 180);
    if (lat === null || lon === null) return json(400, { error: 'bad position' }, noStore);
    const cats = (q.get('cats') || '').split(',').map(c => c.trim()).filter(c => /^[a-z_]+(:[a-z0-9_]+)?$/.test(c)).slice(0, 8);
    if (cats.length) {
      const r = Math.min(num(q.get('r'), 0.5, 60) || 5, 60);
      const rows = await ask('/near?' + new URLSearchParams({ cats: cats.join(','), lat, lon, r, lim: 20 }));
      return json(200, { places: rows.map(slim) }, Object.assign({ 'Cache-Control': rows.length ? 'public, s-maxage=86400, stale-while-revalidate=86400, max-age=600' : 'public, s-maxage=600, max-age=60' }, cors));
    }
    const text = (q.get('q') || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (text.length < 2 || text.length > 80) return json(400, { error: 'bad query' }, noStore);
    const rows = await ask('/search?' + new URLSearchParams({ q: text, lat, lon, r: 150, lim: 15 }));
    return json(200, { places: rows.map(slim) }, Object.assign({ 'Cache-Control': rows.length ? 'public, s-maxage=86400, stale-while-revalidate=86400, max-age=600' : 'public, s-maxage=600, max-age=60' }, cors));
  } catch (e) {
    return json(502, { error: 'place list unavailable' }, noStore);
  }
}
