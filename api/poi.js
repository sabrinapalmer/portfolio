// Business and place names from TomTom, for places the open map data does not have yet (a restaurant at "km 43" on
// a Baja highway, say). The app only asks when the main search finds no named place matching what was typed.
// TOMTOM_KEY is the same key traffic uses; it needs TomTom's Search API enabled.
//   /api/poi?q=<text>&lat=<lat>&lon=<lon>
export const config = { runtime: 'edge' };

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });

const pad = n => String(n).padStart(2, '0');
const stamp = t => t && t.date ? t.date + 'T' + pad(t.hour || 0) + ':' + pad(t.minute || 0) : '';

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = '*'; }   // '*': one cached copy for the website and the app alike
  // Only the app (cross-origin, sends Origin) and the website (same-origin, the browser marks it) may call this, so
  // scripts that find the URL cannot spend the paid service quota
  else if (origin || !(req.headers.get('sec-fetch-site') === 'same-origin' || /^https:\/\/(www\.)?sabrinapalmer\.com\//.test(req.headers.get('referer') || ''))) return json(403, { error: 'origin not allowed' });
  const key = process.env.TOMTOM_KEY;
  if (!key) return json(503, { error: 'not configured' }, cors);
  const u = new URL(req.url), q = (u.searchParams.get('q') || '').trim(), lat = +u.searchParams.get('lat'), lon = +u.searchParams.get('lon');
  if (q.length < 3 || q.length > 80 || !isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json(400, { error: 'bad request' }, cors);
  // Rounded position (about 1 km) so nearby people share cached answers
  const p = new URLSearchParams({ key, lat: lat.toFixed(2), lon: lon.toFixed(2), radius: '150000', limit: '10', typeahead: 'true', idxSet: 'POI', language: 'en-US', openingHours: 'nextSevenDays' });
  let r;
  try { r = await fetch('https://api.tomtom.com/search/2/search/' + encodeURIComponent(q) + '.json?' + p, { signal: AbortSignal.timeout(8000) }); }
  catch (e) { return json(502, { error: 'place search unreachable' }, Object.assign({ 'Cache-Control': 'no-store' }, cors)); }
  if (r.status === 401 || r.status === 403) return json(502, { error: 'place search not enabled for the server key' }, Object.assign({ 'Cache-Control': 'no-store' }, cors));
  if (!r.ok) return json(502, { error: 'place search failed', status: r.status }, Object.assign({ 'Cache-Control': 'no-store' }, cors));
  const d = await r.json();
  const places = (d.results || []).filter(x => x.poi && x.position).map(x => {
    const a = x.address || {};
    return { name: x.poi.name, street: [a.streetNumber, a.streetName].filter(Boolean).join(' '), city: a.municipality || a.localName || a.municipalitySubdivision || '',
      state: a.countrySubdivisionName || a.countrySubdivision || '', country: a.country || '', cc: (a.countryCode || '').toLowerCase(),
      kind: ((x.poi.categories || [])[0] || '').toLowerCase(), lat: x.position.lat, lon: x.position.lon,
      // Opening times for the next seven days as [start, end] in the place's local time ("2026-10-25T09:00")
      open: ((x.poi.openingHours || {}).timeRanges || []).map(t => [stamp(t.startTime), stamp(t.endTime)]).filter(r => r[0] && r[1]),
      phone: x.poi.phone || '', url: x.poi.url || '' };
  });
  return json(200, { places }, Object.assign({ 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400, max-age=3600' }, cors));
}
