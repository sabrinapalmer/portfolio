// Forwards Premium traffic requests to TomTom with the key kept on the server.
//   /api/traffic?ep=route&locs=<lat,lon:lat,lon>&<TomTom routing parameters>
//   /api/traffic?ep=flow&style=relative0|relative0-dark&z=&x=&y=
// TOMTOM_KEY is set in the Vercel project settings.
// Note: this checks where a request comes from, not whether the person has paid. The app only calls it with an
// active subscription; checking the App Store receipt here is a later step.

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

export default async function handler(req, res) {
  const origin = req.headers.origin || '', referer = req.headers.referer || '';
  const from = origin || (referer ? new URL(referer).origin : '');
  if (from && ORIGINS.some(o => o.test(from))) { if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); } }
  else if (from) { res.status(403).json({ error: 'origin not allowed' }); return; }
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET'); res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'GET only' }); return; }

  const key = process.env.TOMTOM_KEY;
  if (!key) { res.status(503).json({ error: 'traffic is not configured' }); return; }
  const url = new URL(req.url, 'http://local'), q = url.searchParams;
  let target;
  if (q.get('ep') === 'route') {
    const locs = q.get('locs') || '';
    if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?(:-?\d+(\.\d+)?,-?\d+(\.\d+)?){1,5}$/.test(locs)) { res.status(400).json({ error: 'bad locations' }); return; }
    const out = new URLSearchParams();
    for (const [k, v] of q) if (!['ep', 'locs', 'key'].includes(k)) out.append(k, v);
    out.set('key', key);
    target = `https://api.tomtom.com/routing/1/calculateRoute/${locs}/json?` + out.toString();
  } else if (q.get('ep') === 'flow') {
    const style = q.get('style') === 'relative0-dark' ? 'relative0-dark' : 'relative0', z = +q.get('z'), x = +q.get('x'), y = +q.get('y');
    if (![z, x, y].every(Number.isInteger) || z < 0 || z > 22) { res.status(400).json({ error: 'bad tile' }); return; }
    target = `https://api.tomtom.com/traffic/map/4/tile/flow/${style}/${z}/${x}/${y}.png?tileSize=256&key=${encodeURIComponent(key)}`;
  } else { res.status(404).json({ error: 'unknown endpoint' }); return; }

  let r;
  try { r = await fetch(target, { signal: AbortSignal.timeout(12000) }); } catch (e) { res.status(502).json({ error: 'traffic service unreachable' }); return; }
  if (r.status === 401 || r.status === 403) { res.status(502).json({ error: 'traffic service rejected the server key' }); return; }
  res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Cache-Control', q.get('ep') === 'flow' && r.ok ? 'public, s-maxage=120, max-age=60' : 'no-store');
  const buf = Buffer.from(await r.arrayBuffer());
  res.status(r.status).send(q.get('ep') === 'route' ? buf.toString('utf8').split(key).join('') : buf);
}
