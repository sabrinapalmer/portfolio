// Toll booths and toll gantries from OpenStreetMap inside a small box, so the map can tell a road that is tagged as a
// toll road everywhere from the stretches where you actually pay. The app asks with boxes snapped to a 0.25° grid,
// so answers are shared and cached at the edge for a week (booths rarely move).
//   /api/tolls?bbox=west,south,east,north
export const config = { runtime: 'nodejs', maxDuration: 30 };   // a regular server: the public Overpass servers turn away edge-network requests

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

export async function GET(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = origin; cors['Vary'] = 'Origin'; }
  else if (origin) return new Response('{"error":"origin not allowed"}', { status: 403, headers: { 'Content-Type': 'application/json' } });
  const b = (new URL(req.url).searchParams.get('bbox') || '').split(',').map(Number);
  const bad = () => new Response('{"error":"bad box"}', { status: 400, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) });
  if (b.length !== 4 || b.some(n => !isFinite(n))) return bad();
  const [w, s, e, n] = b;
  if (e <= w || n <= s || e - w > 0.26 || n - s > 0.26) return bad();   // one grid cell at most
  const q = `[out:json][timeout:20];(node["barrier"="toll_booth"](${s},${w},${n},${e});node["highway"="toll_gantry"](${s},${w},${n},${e}););out body;`;
  // Two public Overpass servers; the second is tried when the first is busy
  let d, why = '';
  for (const host of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
    try {
      const r = await fetch(host + '?data=' + encodeURIComponent(q), { headers: { 'User-Agent': 'BrinaMaps/1.0 (https://www.sabrinapalmer.com/map)', Accept: 'application/json' }, signal: AbortSignal.timeout(13000) });
      if (!r.ok) { why += host + ' ' + r.status + '; '; continue; }
      d = await r.json(); break;
    } catch (err) { why += host + ' ' + (err.name || 'error') + '; '; }
  }
  if (!d) return new Response(JSON.stringify({ error: 'toll data unavailable', why }), { status: 502, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, cors) });
  const booths = (d.elements || []).filter(x => x.type === 'node').map(x => [+x.lat.toFixed(6), +x.lon.toFixed(6)]);
  return new Response(JSON.stringify({ booths }), { status: 200, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=604800, max-age=86400' }, cors) });
}
