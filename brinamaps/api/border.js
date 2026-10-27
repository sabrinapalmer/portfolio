// US–Mexico border wait times for cars entering the US, from US Customs and Border Protection (bwt.cbp.gov), trimmed to
// what the map needs and cached for 5 minutes. CBP publishes no wait times for entering Mexico.
export const config = { runtime: 'edge' };

const ORIGINS = [/^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

const lane = l => !l ? null : { status: l.operational_status || '', minutes: l.delay_minutes === '' || l.delay_minutes == null ? null : +l.delay_minutes, open: l.lanes_open === '' ? null : +l.lanes_open, updated: l.update_time || '' };

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = '*'; }   // '*': one cached copy for the website and the app alike
  else if (origin) return new Response('{"error":"origin not allowed"}', { status: 403, headers: { 'Content-Type': 'application/json' } });
  let data;
  const tries = [];   // what the agency's site answered, for /api/border?debug=1 and the server log
  try {
    // asked twice before giving up (the agency's site turns some requests away); the app then asks it directly
    const ask = async () => {
      const t0 = Date.now();
      try {
        const r = await fetch('https://bwt.cbp.gov/api/bwtnew', { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; BrinaMaps/1.0; +https://brinamaps.com)' } });
        const text = await r.text();
        tries.push({ t0, status: r.status, ms: Date.now() - t0, server: r.headers.get('server'), type: r.headers.get('content-type'), len: text.length, start: text.slice(0, 160) });
        if (!r.ok) throw new Error('status ' + r.status);
        return JSON.parse(text);
      } catch (e) {
        const msg = String(e && e.message || e).slice(0, 160), last = tries[tries.length - 1];
        if (last && last.t0 === t0) last.error = msg; else tries.push({ t0, error: msg, ms: Date.now() - t0 });
        throw e;
      }
    };
    data = await ask().catch(() => ask());
  } catch (e) {
    console.log('[border] agency site failed', JSON.stringify(tries));
    return new Response(JSON.stringify(Object.assign({ error: 'border wait times unavailable' }, new URL(req.url).searchParams.get('debug') ? { tries } : {})), { status: 502, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, cors) });
  }
  if (new URL(req.url).searchParams.get('debug')) return new Response(JSON.stringify({ ok: true, tries }), { headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, cors) });
  const ports = (Array.isArray(data) ? data : []).filter(p => /mexic/i.test(p.border || '')).map(p => {
    const pv = p.passenger_vehicle_lanes || {};
    return { port: p.port_name || '', crossing: p.crossing_name || '', number: p.port_number || '', status: p.port_status || '', hours: p.hours || '',
      standard: lane(pv.standard_lanes), sentri: lane(pv.NEXUS_SENTRI_lanes), ready: lane(pv.ready_lanes) };
  });
  return new Response(JSON.stringify({ at: Date.now(), ports }), { status: 200, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30' }, cors) });
}
