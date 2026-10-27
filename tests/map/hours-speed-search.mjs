import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT=new URL('../../',import.meta.url).pathname, CHROME=process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT+'brinamaps/public/map/index.html','utf8');
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
  if(/\/api\/(fires|firms)\b/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify(/firms/.test(u)?{features:[]}:{at:Date.now(),per:{features:[]},loc:{features:[]}})});
  if(/\/api\/valhalla\/status/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:false})});
  if(/\/api\/(places|valhalla\/)/.test(u)) return r.fulfill({status:503,contentType:'application/json',body:'{}'});
  if(u.startsWith('http://localhost/map')) return r.fulfill({contentType:'text/html',body:html});
  if(u.includes('maplibre-gl.min.js')) return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.js')});
  if(u.includes('maplibre-gl.min.css')) return r.fulfill({contentType:'text/css',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.css')});
  if(u.includes('openfreemap')) return J({version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#eee'}}]});
  if(u.includes('valhalla')&&!u.includes('trace_attributes')) { const q=JSON.parse(decodeURIComponent(u.split('json=')[1])); const L=q.locations; reqs.push('route locs='+L.length+' avoid='+((q.exclude_polygons||[]).length)+' alt='+q.alternates);
    return J({trip:{summary:{time:240*(L.length-1),length:2*(L.length-1)},legs:L.slice(1).map((x,i)=>leg(L[i],x))}}); }
  if(u.includes('nominatim')&&u.includes('/lookup')) { reqs.push('hours lookup '+new URL(u).searchParams.get('osm_ids')); return J([{osm_type:'node',osm_id:2,extratags:{opening_hours:globalThis.HOURS||'24/7'}}]); }
  if(u.includes('trace_attributes')) { const q=JSON.parse(r.request().postData()); reqs.push('limits pts='+q.shape.length); return J({shape:enc(q.shape.map(x=>[x.lat,x.lon])),edges:[{begin_shape_index:0,end_shape_index:q.shape.length-1,speed_limit:56}]}); }
  if(u.includes('api.geoapify.com')) { reqs.push('geoapify '+new URL(u).pathname+' '+(new URL(u).searchParams.get('text')||new URL(u).searchParams.get('categories'))); return J({features:[{geometry:{type:'Point',coordinates:[-87.69,41.91]},properties:{name:'Geo Cafe',street:'Elm St',housenumber:'5',city:'Chicago',state:'Illinois',country:'United States',categories:['catering','catering.cafe'],datasource:{raw:{osm_type:'n',osm_id:77,opening_hours:'24/7'}}}}]}); }
  if(u.includes('nominatim')) return J([]);
  if(u.includes('photon')&&u.includes('/reverse')) return J({features: u.includes('amenity:fuel')?[F(21,'Shell',41.921,-87.681),F(22,'Far Gas',41.99,-87.9)]:u.includes('osm_tag')?[]:[F(9,'Elm Street',41.9,-87.7)]});
  if(u.includes('photon')) return J({features: u.includes('bbox=')?[F(2,'Museum',41.94,-87.66)]:[]});
  return r.abort();});
await p.goto('http://localhost/map'); await p.waitForTimeout(1800);
const T=(spec,iso)=>p.evaluate(([spec,iso])=>{const s=openState(spec,new Date(iso)); return s? (s.always?'always':s.open?'open until '+s.until.toString().slice(0,21):'closed, next '+(s.next?s.next.toString().slice(0,21):'-')):'unreadable'},[spec,iso]);
console.log('1', await T('Mo-Fr 08:00-17:00; Sa 09:00-13:00; Su off','2026-10-12T10:00'));   // Monday
console.log('2', await T('Mo-Fr 08:00-17:00; Sa 09:00-13:00; Su off','2026-10-10T14:00'));   // Saturday afternoon -> Monday 8
console.log('3', await T('Mo-Th 11:00-22:00; Fr,Sa 11:00-02:00','2026-10-11T01:00'));       // Sunday 1am, still open from Saturday
console.log('4', await T('Mo-Su 07:00-14:00','2026-10-11T15:00'));
console.log('5', await T('08:00-12:00,13:00-18:00','2026-10-11T12:30'));
console.log('6', await T('Apr-Oct: Mo-Su 10:00-18:00','2026-10-11T12:30'), await T('24/7','2026-10-11T12:30'));
globalThis.HOURS='Mo-Su 00:00-00:01';
await p.fill('#to','museum'); await p.waitForTimeout(500); await p.click('#suggest li:not(.head):not(.cats)'); await p.waitForTimeout(2600);
console.log('dest hours:', await p.textContent('#destHours'), '| warn', await p.$eval('#destHours',e=>e.classList.contains('warn')), '|', reqs.filter(x=>/hours/.test(x)));
await p.click('#go'); await p.waitForTimeout(1200);
await p.evaluate(()=>onFix({coords:{latitude:nav.rt.coords[1][0],longitude:nav.rt.coords[1][1],accuracy:5,speed:20,heading:0}})); await p.waitForTimeout(400);
console.log('speedo:', (await p.innerText('#speedo')).replace(/\n/g,' '), '| over', await p.$eval('#speedo',e=>e.classList.contains('over')), '|', reqs.filter(x=>/limits/.test(x)));
await p.click('#openMenu'); await p.waitForTimeout(250); await p.click('#endNav'); await p.waitForTimeout(400); await p.evaluate(()=>clearAll());
await p.click('#openPrefs'); await p.fill('#geoKey','GEOKEY'); await p.click('#geoSave'); console.log('geoMsg:', await p.textContent('#geoMsg')); await p.click('#closePrefs');
await p.fill('#to','geo caf'); await p.waitForTimeout(1500);
console.log('geo search:', await p.$$eval('#suggest li',e=>e.map(x=>x.innerText.replace(/\n/g,' / '))), reqs.filter(x=>/geoapify/.test(x)).slice(0,2));
await p.fill('#to','coffee'); await p.waitForTimeout(2500);
console.log('geo category:', await p.$$eval('#suggest li',e=>e.map(x=>x.innerText.replace(/\n/g,' / '))), reqs.filter(x=>/places/.test(x)).slice(0,1));
console.log('errors', errs); await b.close();
