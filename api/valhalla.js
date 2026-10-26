// BrinaMaps' own route server (Valhalla), reached through here so its key stays on the server.
//   /api/valhalla/route?json={...}               (vercel.json maps /api/valhalla/:ep to ?ep=)
//   /api/valhalla/sources_to_targets?json={...}
//   POST /api/valhalla/trace_attributes
//   /api/valhalla/status
// The server runs one router per region (west = California + Mexico, texas, illinois); each request goes to a region
// whose area holds every point of the trip. Where areas overlap (northern Mexico sits inside the Texas box) the next
// candidate is tried if the first has no road there. A trip no region holds gets 400, and the app asks Geoapify.
// VALHALLA_URL and VALHALLA_KEY are set in the Vercel project. Routes are kept at the edge for an hour.
export const config = { runtime: 'edge' };

const ORIGINS = [/^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];
const EPS = { route: 3600, sources_to_targets: 3600, trace_attributes: 0, locate: 3600 };
// [west, south, east, north] boxes per region, most specific first
const AREAS = [
  ['illinois', [[-91.6, 36.9, -87.0, 42.6]]],
  ['texas', [[-106.7, 25.8, -93.5, 36.6]]],
  ['west', [[-124.6, 32.5, -114.1, 42.1], [-118.5, 14.4, -86.6, 32.8]]],
];
const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });
const inBox = ([lat, lon], [w, s, e, n]) => lon >= w && lon <= e && lat >= s && lat <= n;

function pointsOf(ep, req) {   // [[lat, lon], ...] the request touches
  const p = x => (x && isFinite(+x.lat) && isFinite(+x.lon) ? [[+x.lat, +x.lon]] : []);
  if (ep === 'trace_attributes') { const sh = req.shape || []; return [sh[0], sh[sh.length - 1]].flatMap(p); }
  return [].concat(req.locations || [], req.sources || [], req.targets || []).flatMap(p);
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = '*'; }
  else if (origin || !(req.headers.get('sec-fetch-site') === 'same-origin' || /^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com\//.test(req.headers.get('referer') || ''))) return json(403, { error: 'origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }, cors) });
  const base = (process.env.VALHALLA_URL || '').replace(/\/$/, ''), key = process.env.VALHALLA_KEY;
  const u = new URL(req.url), ep = u.searchParams.get('ep');
  if (!base || !key) return json(ep === 'status' ? 200 : 503, { ok: false, error: 'route server not set up' }, Object.assign({ 'Cache-Control': 'public, s-maxage=300' }, cors));

  if (ep === 'status') {   // the app asks this once at start, so routes never wait on a server that is down
    const up = {};
    await Promise.all(AREAS.map(async ([r]) => { try { const x = await fetch(`${base}/${r}/status`, { headers: { 'X-Router-Key': key }, signal: AbortSignal.timeout(4000) }); up[r] = x.ok; } catch (e) { up[r] = false; } }));
    return json(200, { ok: Object.values(up).some(Boolean), regions: up }, Object.assign({ 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }, cors));
  }
  if (!(ep in EPS)) return json(404, { error: 'unknown endpoint' }, cors);

  let raw, body;
  if (req.method === 'POST') { raw = await req.text(); if (raw.length > 400000) return json(413, { error: 'request too large' }, cors); }
  else { raw = u.searchParams.get('json') || ''; if (!raw || raw.length > 60000) return json(400, { error: 'bad request' }, cors); }
  try { body = JSON.parse(raw); } catch (e) { return json(400, { error: 'bad request' }, cors); }
  const pts = pointsOf(ep, body);
  const regions = AREAS.filter(([, boxes]) => pts.length && pts.every(pt => boxes.some(b => inBox(pt, b)))).map(([r]) => r);
  if (!regions.length) return json(400, { error: 'outside the route server area' }, Object.assign({ 'Cache-Control': 'public, s-maxage=3600' }, cors));

  let r, text = '';
  for (const region of regions) {
    const target = `${base}/${region}/${ep}` + (req.method === 'POST' ? '' : '?json=' + encodeURIComponent(raw));
    const opt = req.method === 'POST' ? { method: 'POST', body: raw, headers: { 'X-Router-Key': key, 'Content-Type': 'application/json' } } : { headers: { 'X-Router-Key': key } };
    try { r = await fetch(target, Object.assign(opt, { signal: AbortSignal.timeout(15000) })); } catch (e) { r = null; continue; }
    text = await r.text();
    // No road near a point in this region's data (error 171) or this region is not running: try the next one
    if (r.ok || !(r.status === 400 && /"error_code":\s*17[01]/.test(text) || r.status >= 500)) break;
  }
  if (!r) return json(502, { error: 'route server unreachable' }, Object.assign({ 'Cache-Control': 'no-store' }, cors));
  const keep = r.ok && EPS[ep] && req.method !== 'POST';
  return new Response(text, { status: r.status >= 500 ? 502 : r.status, headers: Object.assign({ 'Content-Type': 'application/json',
    'Cache-Control': keep ? `public, max-age=600, s-maxage=${EPS[ep]}, stale-while-revalidate=${EPS[ep]}` : 'no-store' }, cors) });
}
