// Fire heat spots seen by NASA satellites (FIRMS, VIIRS on two satellites), last 2 days, inside a box.
// The map uses these where the US fire service has no data (Mexico, Canada). NASA_KEY is the FIRMS map key.
//   /api/firms?bbox=west,south,east,north   (snapped to whole degrees by the app so answers are shared)
export const config = { runtime: 'edge' };

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];
const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });

function parse(csv, keepLow) {   // CSV rows -> [lat, lon, frp, time ms, day (1/0)]; low-confidence detections dropped
  const lines = csv.trim().split('\n'), head = (lines.shift() || '').split(',');
  const at = k => head.indexOf(k), iLat = at('latitude'), iLon = at('longitude'), iFrp = at('frp'), iD = at('acq_date'), iT = at('acq_time'), iC = at('confidence'), iDN = at('daynight');
  if (iLat < 0 || iLon < 0) return null;
  const out = [];
  for (const line of lines) {
    const c = line.split(',');
    if (!keepLow && /^l/i.test(c[iC] || '')) continue;
    const t = String(c[iT] || '0').padStart(4, '0'), when = Date.parse((c[iD] || '') + 'T' + t.slice(0, 2) + ':' + t.slice(2) + ':00Z');
    out.push([+(+c[iLat]).toFixed(4), +(+c[iLon]).toFixed(4), +(+c[iFrp] || 0).toFixed(1), when || 0, c[iDN] === 'D' ? 1 : 0]);
  }
  return out;
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = origin; cors['Vary'] = 'Origin'; }
  else if (origin) return json(403, { error: 'origin not allowed' });
  const key = process.env.NASA_KEY || process.env.FIRMS_KEY;
  if (!key) return json(503, { error: 'not configured' }, cors);
  const b = (new URL(req.url).searchParams.get('bbox') || '').split(',').map(Number);
  if (b.length !== 4 || b.some(n => !isFinite(n)) || b[2] <= b[0] || b[3] <= b[1] || b[2] - b[0] > 20 || b[3] - b[1] > 20) return json(400, { error: 'bad box' }, cors);
  const area = b.map(n => Math.round(n)).join(',');
  const noStore = Object.assign({ 'Cache-Control': 'no-store' }, cors);
  const get = async (src, days, date, keepLow) => {
    const r = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${src}/${area}/${days || 2}${date ? '/' + date : ''}`, { signal: AbortSignal.timeout(15000) });
    const text = await r.text();
    if (!r.ok || /invalid|error/i.test(text.slice(0, 200)) && !/latitude/.test(text.slice(0, 200))) throw new Error((r.status || '') + ' ' + text.slice(0, 80).replace(key, ''));
    const rows = parse(text, keepLow); if (!rows) throw new Error('unexpected answer');
    return rows;
  };
  let spots = [], why = [];
  const got = await Promise.allSettled([get('VIIRS_NOAA20_NRT'), get('VIIRS_SNPP_NRT')]);
  got.forEach(g => { if (g.status === 'fulfilled') spots = spots.concat(g.value); else why.push(String(g.reason && g.reason.message || g.reason)); });
  if (got.every(g => g.status === 'rejected')) return json(502, { error: 'fire satellite data unavailable', why: why.join('; ').slice(0, 200) }, noStore);
  // History: has this spot been hot before? Heat seen at the same place on several other days over the last few
  // months points to a regular source (a factory, power station, gas flare or landfill) rather than a new fire.
  let history = false;
  if (spots.length) {
    const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
    const past = await Promise.allSettled([14, 34, 54, 84].map(n => get('VIIRS_SNPP_NRT', 10, day(n), true)));
    const old = past.filter(g => g.status === 'fulfilled').flatMap(g => g.value);
    history = past.some(g => g.status === 'fulfilled');
    const near = (a, b2) => Math.abs(a[0] - b2[0]) < 0.008 && Math.abs(a[1] - b2[1]) < 0.009;   // about 800 m
    spots = spots.map(sp => { const days = new Set(old.filter(o => near(o, sp)).map(o => new Date(o[3]).toISOString().slice(0, 10))); return sp.concat(days.size); });
  }
  return json(200, { at: Date.now(), spots, history }, Object.assign({ 'Cache-Control': 'public, s-maxage=1800, max-age=600' }, cors));
}
