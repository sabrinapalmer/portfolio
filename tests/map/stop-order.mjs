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
  if(/\/api\/valhalla\/status/.test(u)) return J({ok:true});
  if(/sources_to_targets/.test(u)) { const q=JSON.parse(decodeURIComponent(u.split('json=')[1])); reqs.push('matrix '+q.sources.length);
    const d=(a,b)=>Math.hypot(a.lat-b.lat,a.lon-b.lon)*1e4; return J({sources_to_targets:q.sources.map(s=>q.targets.map(t=>({time:d(s,t)})))}); }
  if(/\/api\/places/.test(u)) return r.fulfill({status:503,contentType:'application/json',body:'{}'});
  if(u.startsWith('http://localhost/map')) return r.fulfill({contentType:'text/html',body:html});
  if(u.includes('maplibre-gl.min.js')) return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.js')});
  if(u.includes('maplibre-gl.min.css')) return r.fulfill({contentType:'text/css',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.css')});
  if(u.includes('openfreemap')) return J({version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#eee'}}]});
  if(u.includes('trace_attributes')) return r.abort();
  if(u.includes('valhalla')) { const q=JSON.parse(decodeURIComponent(u.split('json=')[1])); const L=q.locations; reqs.push('route locs='+L.length+' avoid='+((q.exclude_polygons||[]).length)+' alt='+q.alternates);
    return J({trip:{summary:{time:240*(L.length-1),length:2*(L.length-1)},legs:L.slice(1).map((x,i)=>leg(L[i],x))}}); }
  if(u.includes('nominatim')) return J([]);
  if(u.includes('photon')&&u.includes('/reverse')) return J({features: u.includes('amenity:fuel')?[F(21,'Shell',41.921,-87.681),F(22,'Far Gas',41.99,-87.9)]:u.includes('osm_tag')?[]:[F(9,'Elm Street',41.9,-87.7)]});
  if(u.includes('photon')) return J({features: u.includes('bbox=')?[F(2,'Museum',41.94,-87.66)]:[]});
  return r.abort();});
await p.goto('http://localhost/map'); await p.waitForTimeout(1800);
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) errs.push(msg); };
// Trip north along one line: start 41.90, end 42.00. Stops added out of order should come out sorted north.
const order = await p.evaluate(async () => {
  setPoint('from', { lat: 41.90, lon: -87.70, label: 'Start' });
  setPoint('to', { lat: 42.00, lon: -87.70, label: 'End' }); await route();
  for (const [lat, n] of [[41.98, 'C'], [41.92, 'A'], [41.95, 'B']]) await addStop({ lat, lon: -87.70, name: n, label: n });
  return pts.stops.map(s => s.name).join('');
});
check(order === 'ABC', 'stops go in the fastest order by default (' + order + ')');
check(reqs.some(r => /^matrix 5/.test(r)), 'the order uses drive times from the route server');
await p.evaluate(() => openTrip()); await p.waitForTimeout(300);
const ui = await p.evaluate(() => ({ n: document.querySelectorAll('#tripList .mv').length, msg: $('tripMsg').textContent }));
check(ui.n === 3 && /Fastest order/.test(ui.msg), 'each stop has earlier/later buttons; the sheet says it is the fastest order');
await p.click('#tripList li.stop:nth-of-type(3) .mv button:first-child'); await p.waitForTimeout(500);
const moved = await p.evaluate(() => ({ o: pts.stops.map(s => s.name).join(''), msg: $('tripMsg').textContent, btn: !!document.querySelector('#tripMsg button.reorder'), pins: markers.stops.map(m => m.getElement().textContent).join('') }));
check(moved.o === 'BAC' && /Your order/.test(moved.msg) && moved.btn, 'moving a stop up keeps your order and offers the fastest order back (' + moved.o + ')');
const added = await p.evaluate(async () => { await addStop({ lat: 41.99, lon: -87.70, name: 'D', label: 'D' }); return pts.stops.map(s => s.name).join(''); });
check(added === 'BACD', 'a new stop slots in without reshuffling your order (' + added + ')');
await p.evaluate(() => openTrip()); await p.click('#tripMsg button.reorder'); await p.waitForTimeout(800);
const reset = await p.evaluate(() => pts.stops.map(s => s.name).join(''));
check(reset === 'ABCD', 'Use fastest order sorts them again (' + reset + ')');
// Chips: only the latest one looks busy
const busy = await p.evaluate(async () => {
  closeSheets(); openStops();
  const bs = [...document.querySelectorAll('#stopKinds button')];
  bs[0].click(); bs[1].click(); bs[2].click();
  return bs.filter(b => b.classList.contains('busy')).length;
});
check(busy <= 1, 'tapping several stop kinds: only the latest one blinks (' + busy + ')');
console.log('errors', errs); await b.close();
