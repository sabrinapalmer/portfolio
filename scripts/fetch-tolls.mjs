// Downloads every toll booth and toll gantry in Mexico, the US and Canada from OpenStreetMap (Overpass) and writes
// public/map/data/tolls.json as [[lat, lon], ...]. Run by the "Toll booths" GitHub workflow each week.
import fs from 'fs';
const HOSTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
// Boxes small enough for the public servers: [south, west, north, east]
const boxes = [];
for (let lat = 14; lat < 72; lat += 6) for (let lon = -170; lon < -52; lon += 10) boxes.push([lat, lon, lat + 6, lon + 10]);
const pause = ms => new Promise(r => setTimeout(r, ms));
async function ask(b) {
  const q = `[out:json][timeout:120];(node["barrier"="toll_booth"](${b.join(',')});node["highway"="toll_gantry"](${b.join(',')}););out skel qt;`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const host = HOSTS[attempt % HOSTS.length];
    try {
      const r = await fetch(host, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BrinaMaps toll list (https://www.sabrinapalmer.com/map)' }, signal: AbortSignal.timeout(180000) });
      if (!r.ok) throw new Error(host + ' ' + r.status);
      const j = await r.json(); if (!Array.isArray(j.elements)) throw new Error('bad answer');
      if (j.remark && /runtime error|timed out/i.test(j.remark)) throw new Error(j.remark);
      return j.elements.map(e => [+e.lat.toFixed(5), +e.lon.toFixed(5)]);
    } catch (e) { console.log('retry', b.join(','), e.message); await pause(15000 * (attempt + 1)); }
  }
  throw new Error('gave up on ' + b.join(','));
}
const all = [];
for (const b of boxes) { const got = await ask(b); all.push(...got); console.log(b.join(','), got.length); await pause(3000); }
const seen = new Set(), out = all.filter(p => { const k = p.join(','); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
if (out.length < 1000) throw new Error('too few booths (' + out.length + '), not saving');
fs.mkdirSync('public/map/data', { recursive: true });
fs.writeFileSync('public/map/data/tolls.json', JSON.stringify({ at: new Date().toISOString().slice(0, 10), booths: out }));
console.log('saved', out.length);
