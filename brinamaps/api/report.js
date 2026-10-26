// "Add hours": someone tells the app a place's opening hours. The report becomes a public OpenStreetMap note at the
// place, for volunteer mappers to check and add to the map (which then reaches everyone, BrinaMaps included), and a
// copy is kept on the route server. Nothing about the person is sent; the server keeps only a one-way code made
// from their network address and the day, to stop floods (at most 10 an hour).
//   POST /api/report  { place_id, name, lat, lon, hours, note }
export const config = { runtime: 'edge' };

const place = (path, body) => fetch((process.env.VALHALLA_URL || '').replace(/\/$/, '') + '/places' + path, { method: 'POST',
  headers: { 'X-Router-Key': process.env.VALHALLA_KEY || '', 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
const ORIGINS = [/^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/];

const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, headers) });
const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

async function sha(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = origin; cors['Vary'] = 'Origin'; }
  else return json(403, { error: 'origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }, cors) });
  if (req.method !== 'POST') return json(405, { error: 'POST only' }, cors);
  let b; try { b = JSON.parse((await req.text()).slice(0, 4000)); } catch (e) { return json(400, { error: 'bad request' }, cors); }
  const name = clean(b.name, 160), hours = clean(b.hours, 300), note = clean(b.note, 400), lat = +b.lat, lon = +b.lon;
  if (!name || hours.length < 3 || !isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json(400, { error: 'bad request' }, cors);
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const sender = await sha(ip + '|' + new Date().toISOString().slice(0, 10) + '|brinamaps');

  // Check the limits before posting anything public: the server refuses the 11th report in an hour from one sender
  let r;
  try { r = await place('/report', { place_id: clean(b.place_id, 80), name, lat, lon, hours, note, sender }); }
  catch (e) { return json(502, { error: 'Could not save that.' }, cors); }
  if (!r.ok) return json(r.status === 429 ? 429 : 400, { error: r.status === 429 ? 'Too many reports right now. Try again later.' : 'Could not save that.' }, cors);

  let osmId = '';
  try {
    const text = `Opening hours for "${name}", reported by a BrinaMaps user: ${hours}` + (note ? `\nNote: ${note}` : '') +
      '\n\nPlease check before adding to the map (opening_hours). Sent from BrinaMaps (https://brinamaps.com).';
    const n = await fetch('https://api.openstreetmap.org/api/0.6/notes.json?' + new URLSearchParams({ lat: lat.toFixed(6), lon: lon.toFixed(6), text }),
      { method: 'POST', headers: { 'User-Agent': 'BrinaMaps/1.0 (https://brinamaps.com)' }, signal: AbortSignal.timeout(10000) });
    if (n.ok) osmId = String(((await n.json()).properties || {}).id || '');
  } catch (e) {}
  try {
    const rid = +((await r.json()).id);
    if (rid) await place('/report-note', { id: rid, sender, osm: osmId || 'failed' });
  } catch (e) {}
  return json(200, { ok: true, osm: osmId ? 'https://www.openstreetmap.org/note/' + osmId : '' }, cors);
}
