// Forwards Premium traffic requests to TomTom with the key kept on the server.
//   /api/traffic?ep=route&locs=<lat,lon:lat,lon>&<TomTom routing parameters>
//   /api/traffic?ep=flow&style=relative0|relative0-dark&z=&x=&y=
// TOMTOM_KEY is set in the Vercel project settings.
// Every request carries t=<pass>, issued by /api/premium only for an active App Store subscription.
import { checkPass } from './_premium.js';

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];

export default async function handler(req, res) {
  const origin = req.headers.origin || '', referer = req.headers.referer || '';
  const from = origin || (referer ? new URL(referer).origin : '');
  if (from && ORIGINS.some(o => o.test(from))) { if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); } }
  else if (from) { res.status(403).json({ error: 'origin not allowed' }); return; }
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.status(204).end(); return; }
  if (req.method !== 'GET' && !(req.method === 'POST' && new URL(req.url, 'http://local').searchParams.get('ep') === 'route')) { res.status(405).json({ error: 'wrong method' }); return; }

  const key = process.env.TOMTOM_KEY;
  if (!key) { res.status(503).json({ error: 'traffic is not configured' }); return; }
  const url = new URL(req.url, 'http://local'), q = url.searchParams;
  if (!checkPass(q.get('t'))) { res.status(401).json({ error: 'Premium pass missing or expired' }); return; }
  let target;
  if (q.get('ep') === 'route') {
    const locs = q.get('locs') || '';
    if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?(:-?\d+(\.\d+)?,-?\d+(\.\d+)?){1,5}$/.test(locs)) { res.status(400).json({ error: 'bad locations' }); return; }
    const out = new URLSearchParams();
    for (const [k, v] of q) if (!['ep', 'locs', 'key', 't'].includes(k) && !k.startsWith('_vercel')) out.append(k, v);
    out.set('key', key);
    target = `https://api.tomtom.com/routing/1/calculateRoute/${locs}/json?` + out.toString();
  } else if (q.get('ep') === 'flow') {
    const style = q.get('style') === 'relative0-dark' ? 'relative0-dark' : 'relative0', z = +q.get('z'), x = +q.get('x'), y = +q.get('y');
    if (![z, x, y].every(Number.isInteger) || z < 0 || z > 22) { res.status(400).json({ error: 'bad tile' }); return; }
    target = `https://api.tomtom.com/traffic/map/4/tile/flow/${style}/${z}/${x}/${y}.png?tileSize=256&key=${encodeURIComponent(key)}`;
  } else { res.status(404).json({ error: 'unknown endpoint' }); return; }

  let r;
  let opt = { signal: AbortSignal.timeout(12000) };
  if (req.method === 'POST') {   // a route that avoids areas sends them as a JSON body
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (body.length > 20000) { res.status(413).json({ error: 'request too large' }); return; }
    opt = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: opt.signal };
  }
  try { r = await fetch(target, opt); } catch (e) { res.status(502).json({ error: 'traffic service unreachable' }); return; }
  if (r.status === 401 || r.status === 403) { res.status(502).json({ error: 'traffic service rejected the server key' }); return; }
  res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Cache-Control', q.get('ep') === 'flow' && r.ok ? 'public, s-maxage=120, max-age=60' : 'no-store');
  const buf = Buffer.from(await r.arrayBuffer());
  res.status(r.status).send(q.get('ep') === 'route' ? buf.toString('utf8').split(key).join('') : buf);
}
