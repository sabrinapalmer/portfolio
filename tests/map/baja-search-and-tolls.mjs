// Rosarito, Baja: a "walmart" search should list the local store before the bigger Chula Vista ones, and a trip
// where every route uses the toll road should also offer a toll-free way.
import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT=new URL('../../',import.meta.url).pathname, CHROME=process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT+'brinamaps/public/map/index.html','utf8');
function enc(coords){let o='',pl=0,pn=0;const e=v=>{v=v<0?~(v<<1):v<<1;let s='';while(v>=0x20){s+=String.fromCharCode((0x20|(v&0x1f))+63);v>>=5}return s+String.fromCharCode(v+63)};
 for(const [a,b] of coords){const A=Math.round(a*1e6),B=Math.round(b*1e6);o+=e(A-pl)+e(B-pn);pl=A;pn=B}return o}
const HERE=[32.355,-117.05];
const F=(id,name,lat,lon,city,country)=>({geometry:{coordinates:[lon,lat]},properties:{osm_type:'N',osm_id:id,name,street:'Blvd',city,country}});
const N=(id,name,lat,lon,city)=>({osm_type:'node',osm_id:id,lat:String(lat),lon:String(lon),name,display_name:name+', '+city,address:{city,country:'United States'},importance:0.5});
const CV=[F(1,'Walmart',32.64,-117.08,'Chula Vista','United States'),F(2,'Walmart',32.61,-117.06,'Chula Vista','United States')];
const ROS=F(3,'Walmart',32.37,-117.06,'Rosarito','Mexico');
const errs=[]; let failed=false; const check=(ok,msg)=>{console.log((ok?'ok   ':'FAIL ')+msg); if(!ok){failed=true; errs.push(msg);}};
const b = await chromium.launch({executablePath:CHROME,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx = await b.newContext({viewport:{width:390,height:800},permissions:['geolocation'],geolocation:{latitude:HERE[0],longitude:HERE[1]}});
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
  if(u.includes('valhalla')) {
    const q=JSON.parse(decodeURIComponent(u.split('json=')[1])), A=q.locations[0], B=q.locations.at(-1), o=Object.values(q.costing_options)[0];
    const free=o.use_tolls===0, mid=free?[ (A.lat+B.lat)/2, A.lon+0.05 ]:[ (A.lat+B.lat)/2, A.lon-0.03 ];
    const trip=(t,toll)=>({summary:{time:t,length:40},legs:[{shape:enc([[A.lat,A.lon],mid,[B.lat,B.lon]]),maneuvers:[
      {type:1,instruction:'Head south.',begin_shape_index:0,end_shape_index:1,length:20,time:t/2,toll},
      {type:10,instruction:'Turn right.',begin_shape_index:1,end_shape_index:2,length:20,time:t/2,toll},
      {type:4,instruction:'You have arrived.',begin_shape_index:2,end_shape_index:2,length:0,time:0}]}]});
    return J(free?{trip:trip(4200,false)}:{trip:trip(3000,true),alternates:[{trip:trip(3300,true)}]});
  }
  if(u.includes('nominatim')) return J(u.includes('q=walmart')?[N(1,'Walmart',32.64,-117.08,'Chula Vista'),N(2,'Walmart',32.61,-117.06,'Chula Vista')]:[]);
  if(u.includes('photon')&&u.includes('/reverse')) return J({features:[]});
  if(u.includes('photon')&&u.includes('q=walmart')) {
    const bb=(u.match(/bbox=([^&]+)/)||[])[1];
    if(bb){ const [w,s,e,n]=bb.split(',').map(Number); return J({features:(n-s<0.3?[ROS]:CV)}); }   // the wide box is crowded with US stores
    return J({features:CV});
  }
  if(u.includes('photon')) return J({features:[F(9,'Ensenada',31.86,-116.6,'Ensenada','Mexico')]});
  return r.abort();});
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);
await p.fill('#to','walmart'); await p.waitForTimeout(2500);
const list = await p.$$eval('#suggest li:not(.head):not(.cats)',e=>e.map(x=>x.innerText.replace(/\n/g,' / ')));
console.log('walmart list:', list);
check(list.length>0 && /Rosarito/.test(list[0]), 'Rosarito Walmart listed first');
await p.fill('#to','ensenada'); await p.waitForTimeout(2000); await p.click('#suggest li:not(.head):not(.cats)'); await p.waitForTimeout(2000);
const card = (await p.innerText('#routes')).replace(/\n/g,' / ');
console.log('routes:', card);
const n = await p.evaluate(()=>routes.length), free = await p.evaluate(()=>routes.some(r=>!r.toll));
check(free, 'a toll-free route is offered ('+n+' routes)');
await p.evaluate(()=>{ prefs.noToll=true; }); await p.evaluate(()=>route()); await p.waitForTimeout(1500);
check(await p.evaluate(()=>routes.every(r=>!r.toll)), 'avoid-tolls setting still gives only toll-free routes');
console.log('errors', failed?errs:errs.filter(e=>!/^(ok|FAIL)/.test(e))); await b.close();
