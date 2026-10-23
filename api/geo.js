// Forwards map search and routing requests to Geoapify with the key kept on the server.
// The page and the iPhone app call  /api/geo?ep=<endpoint>&<Geoapify parameters>  without a key.
// Only the endpoints the map uses are allowed through. GEOAPIFY_KEY is set in the Vercel project settings.

const ENDPOINTS = {
  autocomplete: { path: '/v1/geocode/autocomplete', cache: 86400 },
  search: { path: '/v1/geocode/search', cache: 86400 },
  reverse: { path: '/v1/geocode/reverse', cache: 86400 },
  places: { path: '/v2/places', cache: 3600 },
  details: { path: '/v2/place-details', cache: 86400 },
  routing: { path: '/v1/routing', cache: 0 },
};

// Pages allowed to call this: the website and the iPhone app (Capacitor serves the app page from capacitor://localhost)
const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && ORIGINS.some(o => o.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (origin) {
    res.status(403).json({ error: 'origin not allowed' });
    return;
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') { res.status(405).json({ error: 'GET only' }); return; }

  const key = process.env.GEOAPIFY_KEY;
  if (!key) { res.status(503).json({ error: 'search is not configured' }); return; }

  const url = new URL(req.url, 'http://local');
  const ep = ENDPOINTS[url.searchParams.get('ep')];
  if (!ep) { res.status(404).json({ error: 'unknown endpoint' }); return; }

  const out = new URLSearchParams();
  for (const [k, v] of url.searchParams) {
    if (k === 'ep' || k.toLowerCase() === 'apikey') continue;
    if (v.length > 4000) { res.status(414).json({ error: 'parameter too long' }); return; }
    out.append(k, v);
  }
  out.set('apiKey', key);

  let r;
  try {
    r = await fetch('https://api.geoapify.com' + ep.path + '?' + out.toString(), { signal: AbortSignal.timeout(12000) });
  } catch (e) {
    res.status(502).json({ error: 'map service unreachable' });
    return;
  }
  const body = await r.text();
  res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
  if (r.ok && ep.cache) res.setHeader('Cache-Control', `public, s-maxage=${ep.cache}, max-age=300`);
  else res.setHeader('Cache-Control', 'no-store');
  // Never pass Geoapify's own auth errors through as-is: they can echo the request URL, which holds the key
  if (r.status === 401 || r.status === 403) { res.status(502).json({ error: 'map service rejected the server key' }); return; }
  res.status(r.status).send(body.split(key).join(''));
}
