// Current US wildfire perimeters and new-fire points (NIFC / WFIGS) for one 2°×2° map square, fetched by the server
// and kept at the edge for an hour. A job warms the squares the app covers every hour, so the phone gets them at once
// and never waits on the fire service while a route is being planned.
//   /api/fires?bbox=-118,32,-116,34     (whole squares on even degrees)
export const config = { runtime: 'edge' };

const WFIGS = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/';
const ORIGINS = [/^https:\/\/(www\.)?sabrinapalmer\.com$/, /^https:\/\/[a-z0-9-]+-sabrinapalmers-projects\.vercel\.app$/, /^https:\/\/portfolio[a-z0-9-]*\.vercel\.app$/,
  /^capacitor:\/\/localhost$/, /^ionic:\/\/localhost$/, /^http:\/\/localhost(:\d+)?$/];
const json = (status, obj, headers) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) });

export default async function handler(req) {
  const origin = req.headers.get('origin') || '', cors = {};
  if (origin && ORIGINS.some(o => o.test(origin))) { cors['Access-Control-Allow-Origin'] = '*'; }   // '*': one cached copy for the website and the app alike
  else if (origin || !(req.headers.get('sec-fetch-site') === 'same-origin' || /^https:\/\/(www\.)?sabrinapalmer\.com\//.test(req.headers.get('referer') || ''))) return json(403, { error: 'origin not allowed' });
  const b = (new URL(req.url).searchParams.get('bbox') || '').split(',').map(Number);
  if (b.length !== 4 || b.some(n => !Number.isInteger(n) || n % 2) || b[2] - b[0] !== 2 || b[3] - b[1] !== 2 || Math.abs(b[1]) > 88 || Math.abs(b[0]) > 180)
    return json(400, { error: 'bad box: use a 2-degree square on even degrees' }, cors);
  const geo = `&geometry=${b.join(',')}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`;
  const get = async url => { const r = await fetch(url, { signal: AbortSignal.timeout(12000) }); if (!r.ok) throw new Error('fire data ' + r.status); const d = await r.json(); if (d.error) throw new Error('fire data error'); return d; };
  try {
    const [per, loc] = await Promise.all([
      get(WFIGS + 'WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName,attr_IncidentSize,attr_PercentContained,poly_DateCurrent&geometryPrecision=4&maxAllowableOffset=0.002' + geo),
      get(WFIGS + 'WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=' + encodeURIComponent("IncidentTypeCategory='WF'") + '&outFields=IncidentName,IncidentSize,PercentContained,FireDiscoveryDateTime' + geo)
    ]);
    // An hour fresh; for two more hours an older copy is served at once while a new one is fetched behind it
    return json(200, { at: Date.now(), per: { features: per.features || [] }, loc: { features: loc.features || [] } },
      Object.assign({ 'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=7200' }, cors));
  } catch (e) {
    return json(502, { error: 'fire data unavailable' }, Object.assign({ 'Cache-Control': 'no-store' }, cors));
  }
}
