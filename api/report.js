// "Add hours": someone tells the app a place's opening hours. The report becomes a public OpenStreetMap note at the
// place, for volunteer mappers to check and add to the map (which then reaches everyone, BrinaMaps included), and a
// copy is kept in the app's database. Nothing about the person is sent; the database keeps only a one-way code made
// from their network address and the day, to stop floods (at most 10 an hour).
//   POST /api/report  { place_id, name, lat, lon, hours, note }
export const config = { runtime: 'edge' };

const SB = 'https://vtjkzkvimsywjjmuhrlg.supabase.co/rest/v1/rpc/submit_hours';
const KEY = 'sb_publishable_mzTbHkZeezy73OgqtraEXA_MQ4tcm2P';
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

  // Check the limits before posting anything public: the database refuses the 11th report in an hour from one sender
  const save = osm => fetch(SB, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ place_id: clean(b.place_id, 80), place_name: name, at_lat: lat, at_lon: lon, new_hours: hours, note_text: note, sender, osm_note_id: osm }), signal: AbortSignal.timeout(8000) });
  const r = await save('pending');
  if (!r.ok) { const t = await r.text(); return json(/too many/.test(t) ? 429 : 400, { error: /too many/.test(t) ? 'Too many reports right now. Try again later.' : 'Could not save that.' }, cors); }

  let osmId = '';
  try {
    const text = `Opening hours for "${name}", reported by a BrinaMaps user: ${hours}` + (note ? `\nNote: ${note}` : '') +
      '\n\nPlease check before adding to the map (opening_hours). Sent from BrinaMaps (https://www.sabrinapalmer.com/map).';
    const n = await fetch('https://api.openstreetmap.org/api/0.6/notes.json?' + new URLSearchParams({ lat: lat.toFixed(6), lon: lon.toFixed(6), text }),
      { method: 'POST', headers: { 'User-Agent': 'BrinaMaps/1.0 (https://www.sabrinapalmer.com/map)' }, signal: AbortSignal.timeout(10000) });
    if (n.ok) osmId = String(((await n.json()).properties || {}).id || '');
  } catch (e) {}
  try {
    const rid = +(await r.json());
    if (rid) await fetch(SB.replace('submit_hours', 'set_report_note'), { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: rid, sender, osm_note_id: osmId || 'failed' }), signal: AbortSignal.timeout(5000) });
  } catch (e) {}
  return json(200, { ok: true, osm: osmId ? 'https://www.openstreetmap.org/note/' + osmId : '' }, cors);
}
