// Lock screen / Dynamic Island: in the app, directions start a Live Activity, update it as you drive, and end it
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT=new URL('../../',import.meta.url).pathname, CHROME=process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT+'public/map/index.html','utf8');
function enc(coords){let o='',pl=0,pn=0;const e=v=>{v=v<0?~(v<<1):v<<1;let s='';while(v>=0x20){s+=String.fromCharCode((0x20|(v&0x1f))+63);v>>=5}return s+String.fromCharCode(v+63)};
 for(const [a,b] of coords){const A=Math.round(a*1e6),B=Math.round(b*1e6);o+=e(A-pl)+e(B-pn);pl=A;pn=B}return o}
const F=(id,name,lat,lon,v)=>({geometry:{coordinates:[lon,lat]},properties:{osm_type:'N',osm_id:id,name,osm_value:v,street:'Main St',city:'Chicago',state:'Illinois',country:'United States'}});
const A=[41.9,-87.7], shape=[]; for(let i=0;i<=10;i++) shape.push([A[0],A[1]+i*0.0012]); for(let i=1;i<=6;i++) shape.push([A[0]-i*0.0009,A[1]+10*0.0012]);
const corner=shape[10], errs=[], said=[], calls=[];
const trip={summary:{time:600,length:1.2},legs:[{shape:enc(shape),maneuvers:[
 {type:1,instruction:'Drive east on Oak Street.',verbal_succinct_transition_instruction:'Drive east.',street_names:['Oak Street'],begin_shape_index:0,end_shape_index:10,length:0.6,time:300},
 {type:10,instruction:'Turn right onto Pine Avenue.',verbal_succinct_transition_instruction:'Turn right.',verbal_pre_transition_instruction:'Turn right onto Pine Avenue.',street_names:['Pine Avenue'],sign:{exit_toward_elements:[{text:'Downtown'}]},begin_shape_index:10,end_shape_index:16,length:0.35,time:300},
 {type:4,instruction:'You have arrived at your destination.',verbal_succinct_transition_instruction:'You have arrived.',begin_shape_index:16,end_shape_index:16,length:0,time:0}]}]};
const b = await chromium.launch({executablePath:CHROME,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx = await b.newContext({viewport:{width:390,height:800},permissions:['geolocation'],geolocation:{latitude:A[0],longitude:A[1]}});
await ctx.addInitScript(() => {
  window.__live = []; let cb = null;
  window.__move = (lat, lon) => cb && cb({ latitude: lat, longitude: lon, accuracy: 5, time: Date.now(), speed: 12, bearing: 90 });
  const BG = { addWatcher: (o, f) => { cb = f; setTimeout(() => f({ latitude: 41.9, longitude: -87.7, accuracy: 5, time: Date.now() }), 30); return Promise.resolve('w'); }, removeWatcher: () => Promise.resolve(), openSettings: () => Promise.resolve() };
  const LIVE = { start: o => (window.__live.push(['start', o]), Promise.resolve({ on: true })), update: o => (window.__live.push(['update', o]), Promise.resolve()), end: o => (window.__live.push(['end', o]), Promise.resolve()) };
  const generic = () => new Proxy({}, { get: () => () => Promise.resolve({}) });
  window.Capacitor = { isNativePlatform: () => true, Plugins: {}, registerPlugin: n => n === 'BackgroundGeolocation' ? BG : n === 'LiveNav' ? LIVE : generic() };
});
const p = await ctx.newPage();
p.on('pageerror',e=>errs.push('PAGE '+e));
await p.route('**/*', async r=>{const u=r.request().url(), J=o=>r.fulfill({contentType:'application/json',body:JSON.stringify(o)});
  if(/\/api\/(fires|firms)\b/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify(/firms/.test(u)?{features:[]}:{at:Date.now(),per:{features:[]},loc:{features:[]}})});
  if(/\/api\/valhalla\/status/.test(u)) return J({ok:true,regions:{illinois:true}});   // the app asks its own route server first
  if(/\/api\/valhalla\/route/.test(u)) return J({trip});
  if(/\/api\/(places|valhalla\/)/.test(u)) return r.fulfill({status:503,contentType:'application/json',body:'{}'});
  if(u.startsWith('http://localhost/map')) return r.fulfill({contentType:'text/html',body:html});
  if(u.includes('maplibre-gl.min.js')) return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.js')});
  if(u.includes('maplibre-gl.min.css')) return r.fulfill({contentType:'text/css',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.css')});
  if(u.includes('openfreemap')) return J({version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#eee'}}]});
  if(u.includes('api.tomtom.com/routing')) { calls.push('tomtom route key='+new URL(u).searchParams.get('key')); return J({routes:[{summary:{travelTimeInSeconds:1020,noTrafficTravelTimeInSeconds:600,trafficDelayInSeconds:400,lengthInMeters:2000}}]}); }
  if(u.includes('api.tomtom.com/traffic')) { if(!calls.includes('tomtom tiles')) calls.push('tomtom tiles'); return r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64')}); }
  if(u.includes('valhalla')) return J({trip});
  if(u.includes('routing.openstreetmap.de')) { calls.push('lane lookup'); return J({code:'Ok',routes:[{legs:[{steps:[{intersections:[{location:[corner[1],corner[0]],lanes:[{valid:false,indications:['left']},{valid:false,indications:['straight']},{valid:true,indications:['straight','right']},{valid:true,indications:['right']}]}]}]}]}]}); }
  if(u.includes('nominatim')) return J([]);
  if(u.includes('photon')&&u.includes('/reverse')) { if(u.includes('amenity:bank')) { calls.push('landmark lookup'); return J({features:[F(31,'First Midwest',corner[0]+0.00005,corner[1]-0.00030,'bank'),F(32,'Taco Hut',corner[0]-0.0002,corner[1]+0.0003,'fast_food')]}); } return J({features: u.includes('osm_tag')?[]:[F(9,'Elm Street',41.9,-87.7)]}); }
  if(u.includes('photon')) return J({features: u.includes('bbox=')?[F(2,'Museum',shape[16][0],shape[16][1])]:[]});
  return r.abort();});
await p.goto('http://localhost/map'); await p.waitForTimeout(1600);
await p.evaluate(() => setPoint('to', { lat: 41.8946, lon: -87.688, label: 'Museum, Main St', name: 'Museum' }));
await p.waitForFunction(() => routes.length > 0, null, { timeout: 8000 }).catch(() => {});
console.log('routes:', await p.evaluate(() => routes.length), await p.textContent('#status'));
await p.waitForTimeout(1500);
await p.click('#go'); await p.waitForTimeout(800);
for (const c of [shape[2], shape[5], shape[8], shape[9]]) { await p.evaluate(([a, o]) => window.__move(a, o), c); await p.waitForTimeout(2300); }
const live = await p.evaluate(() => window.__live);
console.log(JSON.stringify(live.map(([k, o]) => [k, o && (o.dist + ' | ' + o.text + ' | ' + o.sym + ' | ' + o.arrive + ' | ' + o.left + ' | ' + o.dest)]), null, 1));
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
check(live[0] && live[0][0] === 'start' && live[0][1].dest === 'Museum', 'directions start a Live Activity named for the destination');
check(live.some(([k, o]) => k === 'update' && o.sym === 'arrow.turn.up.right' && /Pine Avenue/.test(o.text)), 'updates carry the next turn as a right-turn arrow');
check(live.filter(([k]) => k === 'update').length >= 2, 'it updates as you drive');
await p.click('#endNav'); await p.waitForTimeout(300);
const last = await p.evaluate(() => window.__live.at(-1));
check(last[0] === 'end' && last[1].arrived === false, 'ending early takes it away');
console.log('errors', errs); await b.close(); if (errs.length) process.exit(1);
