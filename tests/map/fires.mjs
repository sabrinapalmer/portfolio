import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT=new URL('../../',import.meta.url).pathname, CHROME=process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT+'public/map/index.html','utf8');
function enc(coords){let o='',pl=0,pn=0;const e=v=>{v=v<0?~(v<<1):v<<1;let s='';while(v>=0x20){s+=String.fromCharCode((0x20|(v&0x1f))+63);v>>=5}return s+String.fromCharCode(v+63)};
 for(const [a,b] of coords){const A=Math.round(a*1e6),B=Math.round(b*1e6);o+=e(A-pl)+e(B-pn);pl=A;pn=B}return o}
const F=(id,name,lat,lon)=>({geometry:{coordinates:[lon,lat]},properties:{osm_type:'N',osm_id:id,name,street:'Main St',city:'Chicago',state:'Illinois',country:'United States'}});
const errs=[], reqs=[];
const line=(a,b,n=10)=>Array.from({length:n+1},(_,i)=>[a.lat+(b.lat-a.lat)*i/n, a.lon+(b.lon-a.lon)*i/n]);
const leg=(a,b,arr)=>({shape:enc(line(a,b)),maneuvers:[{type:1,instruction:'Drive on Oak Street.',street_names:['Oak Street'],begin_shape_index:0,end_shape_index:5,length:1,time:120},{type:10,instruction:'Turn right onto Pine Avenue.',street_names:['Pine Avenue'],begin_shape_index:5,end_shape_index:10,length:1,time:120},{type:4,instruction:'You have arrived at your destination.',begin_shape_index:10,end_shape_index:10,length:0,time:0}]});
const b = await chromium.launch({executablePath:CHROME,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx = await b.newContext({viewport:{width:390,height:800},deviceScaleFactor:2,permissions:['geolocation'],geolocation:{latitude:41.9,longitude:-87.7}});
const p = await ctx.newPage();
p.on('pageerror',e=>errs.push('PAGE '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load/.test(m.text()))errs.push(m.text().slice(0,200))});
await p.route('**/*', async r=>{const u=r.request().url(), J=o=>r.fulfill({contentType:'application/json',body:JSON.stringify(o)});
  if(u.startsWith('http://localhost/map')) return r.fulfill({contentType:'text/html',body:html});
  if(u.includes('maplibre-gl.min.js')) return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.js')});
  if(u.includes('maplibre-gl.min.css')) return r.fulfill({contentType:'text/css',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.css')});
  if(u.includes('openfreemap')) return J({version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#eee'}}]});
  if(u.includes('trace_attributes')) return r.abort();
  if(u.includes('arcgis.com')) { reqs.push('fires '+(u.includes('Perimeters')?'perimeters':'points')); const d=globalThis.FIRE_DOWN; if(d) return r.fulfill({status:500,body:'x'});
    if(u.includes('Perimeters')) return J({type:'FeatureCollection',features:[{type:'Feature',properties:{poly_IncidentName:'Test',attr_IncidentSize:4200,attr_PercentContained:15,poly_DateCurrent:Date.now()-3*3600e3},geometry:{type:'Polygon',coordinates:[[[-87.685,41.915],[-87.675,41.915],[-87.675,41.925],[-87.685,41.925],[-87.685,41.915]]]}},
      {type:'Feature',properties:{poly_IncidentName:'Old',attr_IncidentSize:900,attr_PercentContained:100,poly_DateCurrent:Date.now()-9*86400e3},geometry:{type:'Polygon',coordinates:[[[-87.70,41.95],[-87.69,41.95],[-87.69,41.96],[-87.70,41.96],[-87.70,41.95]]]}}]});
    return J({type:'FeatureCollection',features:[{type:'Feature',properties:{IncidentName:'Test',IncidentSize:4200,PercentContained:15,FireDiscoveryDateTime:Date.now()-86400e3},geometry:{type:'Point',coordinates:[-87.68,41.92]}},
      {type:'Feature',properties:{IncidentName:'New Start',IncidentSize:2,PercentContained:0,FireDiscoveryDateTime:Date.now()-3600e3},geometry:{type:'Point',coordinates:[-88.2,42.3]}},
      {type:'Feature',properties:{IncidentName:'WILDFIRE TRAINING',IncidentSize:0.01,FireDiscoveryDateTime:Date.now()-3600e3},geometry:{type:'Point',coordinates:[-87.66,41.90]}}]}); }
  if(u.includes('valhalla')) { const q=JSON.parse(decodeURIComponent(u.split('json=')[1])); const L=q.locations; const ex=(q.exclude_locations||[]).length; reqs.push('route avoidPolys='+((q.exclude_polygons||[]).length)+' excl='+ex);
    if(ex && globalThis.NO_WAY) return r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'No path could be found for input'})});
    const a=L[0], z=L[L.length-1], via={lat:(a.lat+z.lat)/2, lon:(a.lon+z.lon)/2 + (ex?0.1:0)};
    return J({trip:{summary:{time:ex?420:300,length:3},legs:[{shape:enc([...line(a,via),...line(via,z).slice(1)]),maneuvers:[{type:1,instruction:'Drive.',street_names:['Oak'],begin_shape_index:0,end_shape_index:10,length:1.5,time:200},{type:10,instruction:'Turn right.',street_names:['Pine'],begin_shape_index:10,end_shape_index:20,length:1.5,time:200},{type:4,instruction:'Arrive.',begin_shape_index:20,end_shape_index:20,length:0,time:0}]}]}}); }
  if(u.includes('nominatim')) return J([]);
  if(u.includes('photon')&&u.includes('/reverse')) return J({features: u.includes('amenity:fuel')?[F(21,'Shell',41.921,-87.681),F(22,'Far Gas',41.99,-87.9)]:u.includes('osm_tag')?[]:[F(9,'Elm Street',41.9,-87.7)]});
  if(u.includes('photon')) return J({features: u.includes('bbox=')?[F(2,'Museum',41.94,-87.66)]:[]});
  return r.abort();});
const inFire=()=>p.evaluate(()=>zoneHits(routes[selected].coords).length);
await p.goto('http://localhost/map'); await p.waitForTimeout(1800);
await p.fill('#to','museum'); await p.waitForTimeout(500); await p.click('#suggest li:not(.head)'); await p.waitForTimeout(2000);
console.log('requests:', reqs.join(' | '));
console.log('fires loaded:', await p.evaluate(()=>fires.map(f=>f.name+(f.active?' active':' inactive')+(f.rings?' outline':' circle')).join(', ')));
console.log('route avoids fire:', (await inFire())===0, '| status:', JSON.stringify(await p.textContent('#status')), '| drawn zones', await p.evaluate(()=>map.querySourceFeatures? map.getSource('zones')._data.features.length : -1));
const xy=await p.evaluate(()=>{const q=map.project([-87.68,41.92]);return [q.x,q.y]}); await p.mouse.click(xy[0],xy[1]); await p.waitForTimeout(400);
console.log('tap fire popup:', (await p.$$eval('.pop',e=>e.map(x=>x.innerText.replace(/\n/g,' / ')))).join(' || '));
await p.evaluate(()=>{ if(mapPop){mapPop.remove();mapPop=null} });
reqs.length=0; globalThis.NO_WAY=true; await p.evaluate(()=>route()); await p.waitForTimeout(1500);
console.log('no way around:', JSON.stringify(await p.textContent('#status')), '| warn style', await p.$eval('#status',e=>e.classList.contains('warn')), '|', reqs.join(' | '));
globalThis.NO_WAY=false;
// large avoided area, fires off
await p.evaluate(()=>{prefs.fires=false; drawZones();}); reqs.length=0;
await p.evaluate(()=>addAvoid(41.92,-87.68,1600)); await p.waitForTimeout(1500);
console.log('area avoid:', reqs.join(' | '), '| avoids:', (await inFire())===0, '| zones drawn', await p.evaluate(()=>map.getSource('zones')._data.features.length));
await p.evaluate(()=>{avoid.length=0; store('map.avoid',avoid); drawAvoid();}); reqs.length=0;
await p.evaluate(()=>addAvoid(41.92,-87.68)); await p.waitForTimeout(1500);
console.log('spot avoid:', reqs.join(' | '), '| avoids:', (await inFire())===0);
await p.evaluate(()=>{avoid.length=0; store('map.avoid',avoid); drawAvoid(); prefs.fires=true; fireAt=0;}); globalThis.FIRE_DOWN=true; reqs.length=0;
await p.evaluate(()=>route()); await p.waitForTimeout(1500);
console.log('fire data down:', await p.textContent('#fireMsg'), '| status', await p.textContent('#status'), '| routed', await p.evaluate(()=>routes.length));
console.log('errors', errs); await b.close();
