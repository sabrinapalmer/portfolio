// Problem reports from the app: script errors and failed searches or routes, so bugs seen on phones can be fixed.
// No location, search text or anything about the person is sent; the report is written to the server log only.
export const config = { runtime: 'edge' };

const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/];

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = origin; cors['Vary'] = 'Origin'; }
  else return new Response(null, { status: 403 });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }, cors) });
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors });
  const text = (await req.text()).slice(0, 4000);
  let body; try { body = JSON.parse(text); } catch (e) { return new Response(null, { status: 400, headers: cors }); }
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 20).map(i => ({ k: String(i.k || '').slice(0, 20), m: String(i.m || '').slice(0, 300), t: +i.t || 0 }));
  console.log('[brinamaps]', JSON.stringify({ app: origin.startsWith('capacitor') ? 'ios' : 'web', v: String(body.v || '').slice(0, 20), ua: String(body.ua || '').slice(0, 60), items }));
  return new Response(null, { status: 204, headers: cors });
}
