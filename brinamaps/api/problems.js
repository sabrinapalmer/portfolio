// What problems the app has run into lately (script errors, failed searches or routes), counted by kind and message.
// Read from the route server, where /api/log keeps them 30 days. Nothing about the person is in them.
//   /api/problems?days=7   (only from brinamaps.com itself)
export const config = { runtime: 'edge' };

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async function handler(req) {
  const site = req.headers.get('sec-fetch-site'), ref = req.headers.get('referer') || '';
  if (req.headers.get('origin') || !(site === 'same-origin' || /^https:\/\/(www\.)?brinamaps\.com\//.test(ref))) return json(403, { error: 'origin not allowed' });
  const base = (process.env.VALHALLA_URL || '').replace(/\/$/, '');
  const days = Math.min(30, Math.max(0.1, +new URL(req.url).searchParams.get('days') || 7));
  try {
    const r = await fetch(base + '/places/problems?days=' + days, { headers: { 'X-Router-Key': process.env.VALHALLA_KEY || '' }, signal: AbortSignal.timeout(5000) });
    return json(r.ok ? 200 : 502, r.ok ? await r.json() : { error: 'route server ' + r.status });
  } catch (e) { return json(502, { error: 'route server unreachable' }); }
}
