// Downloads every toll booth and toll gantry in Mexico, the US and Canada from OpenStreetMap (Overpass) and writes
// brinamaps/public/map/data/tolls.json as [[lat, lon], ...]. Run by the "Toll booths" GitHub workflow each week.
import fs from 'fs';
const HOSTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
// One query per country (the server looks up the country outline itself), which is far fewer requests than boxes
const countries = ['MX', 'US', 'CA'];
const pause = ms => new Promise(r => setTimeout(r, ms));
async function ask(cc) {
  const q = `[out:json][timeout:600][maxsize:200000000];area["ISO3166-1"="${cc}"][admin_level=2]->.a;(node["barrier"="toll_booth"](area.a);node["highway"="toll_gantry"](area.a););out skel qt;`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const host = HOSTS[attempt % HOSTS.length];
    try {
      const r = await fetch(host, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BrinaMaps toll list (https://brinamaps.com)' }, signal: AbortSignal.timeout(700000) });
      if (!r.ok) throw new Error(host + ' ' + r.status);
      const j = await r.json(); if (!Array.isArray(j.elements)) throw new Error('bad answer');
      if (j.remark && /runtime error|timed out/i.test(j.remark)) throw new Error(j.remark);
      return j.elements.map(e => [+e.lat.toFixed(5), +e.lon.toFixed(5)]);
    } catch (e) { console.log('retry', cc, e.message); await pause(20000); }
  }
  throw new Error('gave up on ' + cc);
}
const all = [];
for (const cc of countries) { const got = await ask(cc); all.push(...got); console.log(cc, got.length); }
const seen = new Set(), out = all.filter(p => { const k = p.join(','); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
if (out.length < 1000) throw new Error('too few booths (' + out.length + '), not saving');
fs.mkdirSync('brinamaps/public/map/data', { recursive: true });
fs.writeFileSync('brinamaps/public/map/data/tolls.json', JSON.stringify({ at: new Date().toISOString().slice(0, 10), booths: out }));
console.log('saved', out.length);
