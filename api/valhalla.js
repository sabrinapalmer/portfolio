// BrinaMaps' own route server (Valhalla, California and Mexico), reached through here so its key stays on the server.
//   /api/valhalla/route?json={...}               (vercel.json maps /api/valhalla/:ep to ?ep=)
//   /api/valhalla/sources_to_targets?json={...}
//   POST /api/valhalla/trace_attributes
// VALHALLA_URL (https://...sslip.io) and VALHALLA_KEY are set in the Vercel project. Answers that do not change
// (routes without traffic) are kept at the edge for an hour.
export const config = { runtime: 'edge' };

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];
const EPS = { route: 3600, sources_to_targets: 3600, trace_attributes: 0, locate: 3600 };
const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = '*'; }
  else if (origin || !(req.headers.get('sec-fetch-site') === 'same-origin' || /^https:\/\/(www\.)?sabrinapalmer\.com\//.test(req.headers.get('referer') || ''))) return json(403, { error: 'origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }, cors) });
  const base = process.env.VALHALLA_URL, key = process.env.VALHALLA_KEY;
  if (!base || !key) return json(503, { error: 'route server not set up' }, Object.assign({ 'Cache-Control': 'public, s-maxage=300' }, cors));
  const u = new URL(req.url), ep = u.searchParams.get('ep');
  if (!(ep in EPS)) return json(404, { error: 'unknown endpoint' }, cors);
  let target = base.replace(/\/$/, '') + '/' + ep, opt = { headers: { 'X-Router-Key': key }, signal: AbortSignal.timeout(15000) };
  if (req.method === 'POST') {
    const body = await req.text(); if (body.length > 400000) return json(413, { error: 'request too large' }, cors);
    opt = Object.assign(opt, { method: 'POST', body, headers: { 'X-Router-Key': key, 'Content-Type': 'application/json' } });
  } else {
    const j = u.searchParams.get('json'); if (!j || j.length > 60000) return json(400, { error: 'bad request' }, cors);
    target += '?json=' + encodeURIComponent(j);
  }
  let r;
  try { r = await fetch(target, opt); } catch (e) { return json(502, { error: 'route server unreachable' }, Object.assign({ 'Cache-Control': 'no-store' }, cors)); }
  const text = await r.text();
  const keep = r.ok && EPS[ep] && req.method !== 'POST';
  return new Response(text, { status: r.status, headers: Object.assign({ 'Content-Type': 'application/json',
    'Cache-Control': keep ? `public, max-age=600, s-maxage=${EPS[ep]}, stale-while-revalidate=${EPS[ep]}` : 'no-store' }, cors) });
}
