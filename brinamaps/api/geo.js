// Forwards map search and routing requests to Geoapify with the key kept on the server.
// The page and the iPhone app call  /api/geo?ep=<endpoint>&<Geoapify parameters>  without a key.
// Only the endpoints the map uses are allowed through. GEOAPIFY_KEY is set in the Vercel project settings.
// Runs on Vercel's edge network: close to the person searching and with no slow first start.
export const config = { runtime: 'edge' };

const ENDPOINTS = {
  autocomplete: { path: '/v1/geocode/autocomplete', cache: 86400 },
  search: { path: '/v1/geocode/search', cache: 86400 },
  reverse: { path: '/v1/geocode/reverse', cache: 86400 },
  places: { path: '/v2/places', cache: 3600 },
  details: { path: '/v2/place-details', cache: 2592000 },   // 30 days: hours and phone numbers rarely change
  routing: { path: '/v1/routing', cache: 3600 },   // the same trip asked again within the hour comes from the edge
  matrix: { path: '/v1/routematrix', cache: 0, post: true },   // travel times: search results, stops, meet in the middle
};

// Pages allowed to call this: the website and the iPhone app (Capacitor serves the app page from capacitor://localhost)
const ORIGINS = [/^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = '*'; }   // '*': one cached copy for the website and the app alike
  // Only the app (cross-origin, sends Origin) and the website (same-origin, the browser marks it) may call this, so
  // scripts that find the URL cannot spend the paid service quota
  else if (origin || !(req.headers.get('sec-fetch-site') === 'same-origin' || /^https:\/\/(www\.)?(sabrinapalmer|brinamaps)\.com\//.test(req.headers.get('referer') || ''))) return json(403, { error: 'origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }, cors) });

  const key = process.env.GEOAPIFY_KEY;
  if (!key) return json(503, { error: 'search is not configured' }, cors);

  const url = new URL(req.url);
  const ep = ENDPOINTS[url.searchParams.get('ep')];
  if (!ep) return json(404, { error: 'unknown endpoint' }, cors);
  if (req.method !== (ep.post ? 'POST' : 'GET')) return json(405, { error: 'wrong method' }, cors);
  let body;
  if (ep.post) {
    body = await req.text();
    if (body.length > 20000) return json(413, { error: 'request too large' }, cors);
    try { const b = JSON.parse(body); if ((b.sources || []).length * (b.targets || []).length > 100) return json(413, { error: 'too many points' }, cors); }
    catch (e) { return json(400, { error: 'bad body' }, cors); }
  }

  const out = new URLSearchParams();
  for (const [k, v] of url.searchParams) {
    if (k === 'ep' || k.toLowerCase() === 'apikey' || k.startsWith('_vercel')) continue;
    if (v.length > 4000) return json(414, { error: 'parameter too long' }, cors);
    out.append(k, v);
  }
  out.set('apiKey', key);

  let r; const t0 = Date.now();
  try {
    r = await fetch('https://api.geoapify.com' + ep.path + '?' + out.toString(), ep.post ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(12000) } : { signal: AbortSignal.timeout(12000) });
  } catch (e) {
    return json(502, { error: 'map service unreachable' }, cors);
  }
  // Never pass Geoapify's own auth errors through as-is: they can echo the request URL, which holds the key
  if (r.status === 401 || r.status === 403) return json(502, { error: 'map service rejected the server key' }, cors);
  const text = (await r.text()).split(key).join('');
  const headers = Object.assign({ 'Server-Timing': 'upstream;dur=' + (Date.now() - t0), 'Timing-Allow-Origin': '*', 'Content-Type': r.headers.get('content-type') || 'application/json',
    'Cache-Control': r.ok && ep.cache ? `public, s-maxage=${ep.cache}, stale-while-revalidate=${ep.cache}, max-age=300` : 'no-store' }, cors);
  return new Response(text, { status: r.status, headers });
}
