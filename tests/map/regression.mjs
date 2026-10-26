import { chromium } from 'playwright-core';
import fs from 'fs';
const ROOT=new URL('../../',import.meta.url).pathname, CHROME=process.env.CHROME_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const html = fs.readFileSync(ROOT+'brinamaps/public/map/index.html','utf8');
function enc(coords){let o='',pl=0,pn=0;const e=v=>{v=v<0?~(v<<1):v<<1;let s='';while(v>=0x20){s+=String.fromCharCode((0x20|(v&0x1f))+63);v>>=5}return s+String.fromCharCode(v+63)};
 for(const [a,b] of coords){const A=Math.round(a*1e6),B=Math.round(b*1e6);o+=e(A-pl)+e(B-pn);pl=A;pn=B}return o}
const A=[41.9,-87.7], shape=[];
for(let i=0;i<=8;i++) shape.push([A[0],A[1]+i*0.0012]);
for(let i=1;i<=4;i++) shape.push([A[0]-i*0.0009,A[1]+8*0.0012]);
const mk=(time,length,turnType,hw)=>({summary:{time,length},legs:[{shape:enc(shape),maneuvers:[
 {type:1,instruction:'Drive east on Oak Street.',begin_shape_index:0,end_shape_index:8,length:length*0.6,time:time*0.6,highway:hw},
 {type:turnType,instruction:(turnType===15?'Turn left':'Turn right')+' onto Pine Avenue.',verbal_pre_transition_instruction:'Turn onto Pine Avenue.',begin_shape_index:8,end_shape_index:12,length:length*0.4,time:time*0.4,toll:hw},
 {type:4,instruction:'You have arrived at your destination.',begin_shape_index:12,end_shape_index:12,length:0,time:0}]}]});
const F=(id,name,lat,lon,extra={})=>({geometry:{coordinates:[lon,lat]},properties:{osm_type:'N',osm_id:id,name,street:'Main St',city:'Chicago',state:'Illinois',country:'United States',...extra}});
const errs=[], reqs=[];
const b = await chromium.launch({executablePath:CHROME,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx = await b.newContext({viewport:{width:390,height:800},deviceScaleFactor:2,permissions:['geolocation'],geolocation:{latitude:A[0],longitude:A[1]}});
const p = await ctx.newPage();
await p.addInitScript(()=>{ if(!localStorage.getItem('map.prefs')) localStorage.setItem('map.prefs', JSON.stringify({showAll:true})); });
p.on('pageerror',e=>errs.push('PAGE '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|Failed to load/.test(m.text()))errs.push(m.text().slice(0,200))});
await p.route('**/*', async r=>{const u=r.request().url(), J=o=>r.fulfill({contentType:'application/json',body:JSON.stringify(o)});
  if(/\/api\/(fires|firms)\b/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify(/firms/.test(u)?{features:[]}:{at:Date.now(),per:{features:[]},loc:{features:[]}})});
  if(/\/api\/valhalla\/status/.test(u)) return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:false})});
  if(/\/api\/(places|valhalla\/)/.test(u)) return r.fulfill({status:503,contentType:'application/json',body:'{}'});
  if(u.startsWith('http://localhost/map')) return r.fulfill({contentType:'text/html',body:html});
  if(u.includes('maplibre-gl.min.js')) return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.js')});
  if(u.includes('maplibre-gl.min.css')) return r.fulfill({contentType:'text/css',body:fs.readFileSync(ROOT+'node_modules/maplibre-gl/dist/maplibre-gl.css')});
  if(u.includes('openfreemap')) return J({version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#eee'}}]});
  if(u.includes('sources_to_targets')) { const q=JSON.parse(decodeURIComponent(u.split('json=')[1])); reqs.push('matrix '+q.costing+' x'+q.targets.length); return J({sources_to_targets:[q.targets.map((t,i)=>({time: q.costing==='bicycle'? 900-i*200 : 300+i*250}))]}); }
  if(u.includes('trace_attributes')) return r.abort();
  if(u.includes('valhalla')) { const q=JSON.parse(decodeURIComponent(u.split('json=')[1])); reqs.push('route '+JSON.stringify({c:q.costing,o:q.costing_options,x:q.exclude_polygons&&q.exclude_polygons.length,alt:q.alternates})); return J({trip:mk(1500,12.4,15,true),alternates:[{trip:mk(1740,11.8,10,false)},{trip:mk(1900,13,10,false)}]}); }
  if(u.includes('census')) { const cb=new URL(u).searchParams.get('callback'); return r.fulfill({contentType:'text/javascript',body:`${cb}(${JSON.stringify({result:{addressMatches:[{matchedAddress:'144 HAPP RD, NORTHFIELD, IL, 60093',coordinates:{x:-87.7665,y:42.0953}}]}})})`}); }
  if(u.includes('nominatim')) { reqs.push('nomi '+u.split('nominatim.openstreetmap.org')[1].slice(0,60));
    if(u.includes('/reverse')) return J({lat:'41.9',lon:'-87.7',name:'',address:{road:'Elm Street',city:'Chicago',state:'Illinois'}});
    if(/q=(cafe|restaurant|bar|park)/.test(u)) return J([[41.9,-87.695,'Nomi Cafe A'],[41.899,-87.694,'Nomi Cafe B'],[41.8964,-87.6904,'Nomi Cafe C']].map(([la,lo,n])=>({lat:String(la),lon:String(lo),name:n,type:'cafe',address:{road:'Main St',city:'Chicago',state:'Illinois'}})));
    return J([{lat:'42.09525',lon:'-87.76652',name:'',address:{house_number:'144',road:'Happ Road',village:'Northfield',state:'Illinois',postcode:'60093'}}]); }
  if(process.env.DOWN && u.includes('photon')) return process.env.DOWN==='503' ? r.fulfill({status:503,body:'busy'}) : r.abort();
  if(u.includes('photon')&&u.includes('/reverse')) { if(u.includes('osm_tag')) { reqs.push('poi '+u.split('reverse?')[1].replace(/lat=[^&]*&lon=[^&]*&/,'')); return J({features:[F(11,'Cafe One',41.9,-87.695,{osm_value:'cafe'}),F(12,'Cafe Two',41.899,-87.694,{osm_value:'cafe'}),F(13,'Cafe Three',41.898,-87.693,{osm_value:'cafe'})]}); } return J({features:[F(9,'Elm Street',41.9,-87.7)]}); }
  if(u.includes('photon')) return J({features: u.includes('bbox=')?[F(2,'Cafe Close',41.8964,-87.6904)]:[F(3,'Cafe Paris',48.85,2.35)]});
  return r.abort();});
await p.goto('http://localhost/map'); await p.waitForTimeout(1500);
// address search
await p.fill('#to','144 Happ Rd Northfield'); await p.waitForTimeout(1200);
console.log('address results', await p.$$eval('#suggest li',e=>e.map(x=>x.innerText.replace(/\n/g,' / '))));
await p.fill('#to','cafe'); await p.waitForTimeout(1300);
console.log('category list', await p.$$eval('#suggest li',e=>e.map(x=>x.innerText.replace(/\n/g,' / '))), 'pins', await p.$$eval('.opt',e=>e.length));
await p.click('#suggest li:not(.head):not(.cats)'); await p.waitForTimeout(1500);
console.log('cards', await p.$$eval('#routes button',e=>e.map(x=>x.innerText.replace(/\n/g,' / '))));
console.log('why', (await p.innerText('#why')).replace(/\n/g,' / '));
const box = await p.$eval('#go',e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),Math.round(r.top)]});
console.log('start btn box', box, 'from=', await p.inputValue('#from'));
await p.click('#routes button:nth-child(2)'); await p.waitForTimeout(300);
console.log('why alt', (await p.innerText('#why')).replace(/\n/g,' / '));
await p.click('#toggleSteps'); await p.waitForTimeout(200); await p.click('#toggleSteps');
// prefs
await p.click('#openRouteOpts'); await p.click('[data-pref=noHwy]'); await p.click('[data-pref=simple]'); await p.waitForTimeout(300); await p.click('#routeOpts [data-close]');
await p.click('#mode [data-mode=rig]'); await p.waitForTimeout(500);
console.log(reqs.slice(-2).join('\n'));
// avoid a spot via map click
await p.mouse.click(40, 300, {button:'right'}); await p.waitForTimeout(400);
console.log('popup', await p.$$eval('.pop button',e=>e.map(x=>x.textContent)));
await p.click('.pop button:nth-child(3)'); await p.waitForTimeout(800);
console.log(reqs.slice(-1)[0], '| flags:', (await p.innerText('#why .flags')).replace(/\n/g,' | '));
// nav
await p.click('#mode [data-mode=auto]'); await p.waitForTimeout(500);
await p.click('#go'); await p.waitForTimeout(600);
const read=async()=>p.evaluate(()=>({nav:document.body.classList.contains('nav'),dist:navDist.textContent,text:navText.textContent,arrow:!!navArrow.querySelector('svg'),left:navLeft.textContent,bearing:Math.round(map.getBearing()),pitch:Math.round(map.getPitch())}));
const at=async(c)=>{await ctx.setGeolocation({latitude:c[0],longitude:c[1],accuracy:5});await p.waitForTimeout(1300);return JSON.stringify(await read())};
console.log('nav start', await at(shape[1]));
console.log('after turn', await at(shape[10]));
console.log('arrive', await at(shape[12]), await p.evaluate(()=>document.body.classList.contains('arrived')+' '+arrivedAt.textContent));
await p.click('#arrivedOk'); await p.waitForTimeout(300);
console.log('quick chips', await p.$$eval('#quick button',e=>e.map(x=>x.textContent)));
// meet
await p.click('#openMeet'); await p.fill('#friend','cafe'); await p.waitForTimeout(500); await p.click('#meetSuggest li');
await p.click('[data-meet=friendMode] [data-v=bicycle]'); await p.click('#meetGo'); await p.waitForTimeout(1200);
console.log('meet', await p.$$eval('#meetResults li',e=>e.map(x=>x.innerText.replace(/\n/g,' / '))), '|', await p.textContent('#meetMsg'));
console.log(reqs.filter(x=>/^(poi|matrix)/.test(x)).join('\n'));
await p.click('#meetResults li span'); await p.waitForTimeout(1200);
console.log('after meet pick: dest=', await p.textContent('#destName'), 'routes', await p.$$eval('#routes button',e=>e.length));
console.log('errors', errs);
await b.close();
