/* Kalut-Shefa '26 · the journey — MapLibre GL vector drive.
   Research-backed rework: vector tiles (OpenFreeMap, free, no key, no limits),
   3D chase camera (pitch + bearing follow the road, the way navigation apps
   film their routes), a route line that draws itself as you drive, and the
   basemap restyled into the wedding palette at the tile level, not a CSS filter. */
(function(){
"use strict";
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var V={
 trad:{
  eyebrow:"Traditional wedding · Sat 21 Nov",
  title:"The road to Nimo",
  venueName:"Nwakor compound",
  venueAddr:"Uruezebaluchi village, Nimo, Anambra State. Behind Assumption Catholic Church (back of Igboka compound).",
  dirLink:"https://www.google.com/maps/dir/?api=1&destination=6.1606062%2C6.9934657&travelmode=driving",
  mapLink:"https://maps.google.com/?cid=2074764864072885148",
  church:[6.1606062,6.9934657],
  route:window.KS_ROUTE_TRAD||null,
  start:[6.1335230,6.8002695],
  zStart:5.6, zFollow:15.3, zEnd:17.2, dur:30000, km:27.0, hudTail:"km to Nimo",
  pois:[{f:0,e:"🚌",n:"Upper Iweka"},{f:.7273,e:"🏘️",n:"Abagana"},{f:.9328,e:"🚦",n:"Enugu-Ukwu"}],
  stops:[
   {f:0,     t:"Upper Iweka, Onitsha", s:"Jump on the Old Road. Abagana first."},
   {amb:1,f:.42, t:"The Old Road",        s:"Windows down, the dotted line hums toward Nimo."},
   {f:.7273, t:"The Old Road, Abagana",s:"Cruising through Abagana. Keep rolling."},
   {amb:1,f:.8,  t:"Almost there",        s:"The compound lights are close now."},
   {f:.9328, t:"Enugu-Ukwu junction",  s:"Ezi-Elias ahead. Turn right towards Nimo."},
   {f:.999,  t:"Nwakor compound",      s:"Behind Assumption Catholic Church. You have arrived."}
  ]
 },
 white:{
  eyebrow:"White wedding · Sat 28 Nov",
  title:"Into Abraka",
  venueName:"Gospel Stars Church",
  venueAddr:"No. 9 Gospel Stars Church Street, off Little London Road, Abraka, Delta State.",
  dirLink:"https://www.google.com/maps/dir/?api=1&destination=5.7852575%2C6.1158144&travelmode=driving",
  mapLink:"https://maps.google.com/?cid=12196887920809216468",
  church:[5.7852575,6.1158144],
  route:null,
  start:[6.3,6.6],
  zStart:5.6, zFollow:5.2, zEnd:16.8, dur:9500, hudText:"En route to Abraka", pois:[],
  stops:[
   {f:0,    t:"Delta State, Nigeria",        s:"Somewhere in this state, a church is waiting."},
   {amb:1,f:.5, t:"Into Abraka",           s:"The town slows down for the gate."},
   {f:.62,  t:"Little London Road, Abraka",  s:"Turn in here. Almost there."},
   {f:.999, t:"Gospel Stars Church",         s:"No. 9 Gospel Stars Church Street, Abraka."}
  ]
 }
};
/* speed profile: accelerate, cruise, decelerate -> distance fraction over time */
var SP=(function(){var n=300,A=.07,D=.12,dt=1/n,ys=[],sum=0,prev=0,i,p,v;
 for(i=1;i<=n;i++){p=i*dt;v=p<A?p/A:(p>1-D?(1-p)/D:1);sum+=(v+prev)/2*dt;prev=v;ys.push(sum)}
 var last=ys[n-1];for(i=0;i<n;i++)ys[i]/=last;return ys})();
function distFrac(p){var i=Math.max(0,Math.min(SP.length-1,Math.floor(p*SP.length)));return SP[i]}
var CAR='<svg width="30" height="52" viewBox="0 0 30 52" xmlns="http://www.w3.org/2000/svg">'
 +'<rect x="0" y="8" width="5" height="10" rx="2" fill="#141414"/><rect x="25" y="8" width="5" height="10" rx="2" fill="#141414"/>'
 +'<rect x="0" y="34" width="5" height="10" rx="2" fill="#141414"/><rect x="25" y="34" width="5" height="10" rx="2" fill="#141414"/>'
 +'<rect x="3" y="3" width="24" height="46" rx="9" fill="#6e0f1f" stroke="#3f0a13" stroke-width="1.5"/>'
 +'<rect x="13" y="6" width="4" height="40" rx="2" fill="#d8bb8a" opacity=".38"/>'
 +'<rect x="7" y="12" width="16" height="9" rx="3.5" fill="#d8bb8a" opacity=".9"/>'
 +'<rect x="7" y="31" width="16" height="8" rx="3.5" fill="#d8bb8a" opacity=".55"/>'
 +'<rect x="7" y="45" width="16" height="3" rx="1.5" fill="#d8bb8a" opacity=".8"/></svg>';
var HEART='<svg width="44" height="48" viewBox="0 0 44 48" xmlns="http://www.w3.org/2000/svg"><path d="M22 44C10 34 3 26.5 3 17.5 3 10 8.6 5 15.4 5c3 0 5.2 1.2 6.6 3.2C23.4 6.2 25.6 5 28.6 5 35.4 5 41 10 41 17.5c0 9-7 16.5-19 26.5z" fill="#b4283b" stroke="#d8bb8a" stroke-width="2.5"/></svg>';
var modal=document.getElementById('journeyModal'), mapEl=document.getElementById('jMap');
if(!modal||!mapEl||!window.maplibregl) return;
function $(id){return document.getElementById(id)}
var map=null,ready=false,pendingFit=null,polished=false,
    car=null,pin=null,poiDots=[],raf=null,mode=null,hud=$('jHud'),
    t0=0,state='idle',preTimer=null,stage2Timer=null,fired=[],lastBrg=null,lastPitch=0,
    RT=null,ARC=null;
var capT=$('jCapT'),capS=$('jCapS'),capBox=$('jCap'),bar=$('jBar'),beginBtn=$('jBegin'),arrival=$('jArrival'),skip=$('jSkip'),dirBtn=$('jDir'),mapBtn=$('jMapBtn'),again=$('jAgain'),arrName=$('jArrName'),arrAddr=$('jArrAddr');
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function lerpAng(a,b,k){var d=b-a;while(d>180)d-=360;while(d<-180)d+=360;return a+d*k}
/* route: stored as [lat,lng] (map-friendly) -> MapLibre wants [lng,lat] */
function toGL(latlngs){return latlngs.map(function(c){return [c[1],c[0]]})}
function arc(cs){var a=[0],tot=0,i;for(i=1;i<cs.length;i++){var dx=cs[i][0]-cs[i-1][0],dy=cs[i][1]-cs[i-1][1];tot+=Math.sqrt(dx*dx+dy*dy);a.push(tot)}return{a:a,tot:tot}}
function posAt(dist){var P=RT,r=ARC,i=0;
 while(i<P.length-2&&r.a[i+1]<dist)i++;
 var seg=(r.a[i+1]-r.a[i])||1e-9,k=Math.max(0,Math.min(1,(dist-r.a[i])/seg));
 return[P[i][0]+(P[i+1][0]-P[i][0])*k,P[i][1]+(P[i+1][1]-P[i][1])*k,i]}
function elFor(cls,html){var d=document.createElement('div');d.className=cls;d.innerHTML=html;return d}
/* ---- the basemap, restyled into the wedding palette (vector, once, on load) ---- */
function polish(){
 if(polished)return;polished=true;
 var C={bg:'#150710',water:'#1f0a14',road:'#3b1523',roadMinor:'#2b1019',path:'#241017',building:'#280d19',land:'#1b0a12',label:'#d8bb8a',halo:'#150710'};
 map.getStyle().layers.forEach(function(l){
  var id=(l.id||'').toLowerCase();
  try{
   if(l.type==='background'){map.setPaintProperty(l.id,'background-color',C.bg);return}
   if(id.indexOf('water')>-1||id.indexOf('river')>-1||id.indexOf('lake')>-1||id.indexOf('sea')>-1||id.indexOf('ocean')>-1){
    if(l.type==='fill')map.setPaintProperty(l.id,'fill-color',C.water);
    else if(l.type==='line')map.setPaintProperty(l.id,'line-color',C.water);return}
   if(id.indexOf('building')>-1&&l.type==='fill'){
    map.setPaintProperty(l.id,'fill-color',C.building);
    try{map.setPaintProperty(l.id,'fill-outline-color','#3a1220')}catch(e){}return}
   if(id.indexOf('building')>-1&&l.type==='fill-extrusion'){
    map.setPaintProperty(l.id,'fill-extrusion-color',C.building);
    try{map.setPaintProperty(l.id,'fill-extrusion-opacity',.92)}catch(e){}return}
   if((id.indexOf('park')>-1||id.indexOf('landcover')>-1||id.indexOf('landuse')>-1||id.indexOf('forest')>-1||id.indexOf('grass')>-1)&&l.type==='fill'){
    map.setPaintProperty(l.id,'fill-color',C.land);return}
   if(l.type==='line'){
    var col=id.indexOf('tunnel')>-1?C.path:(id.indexOf('minor')>-1||id.indexOf('service')>-1||id.indexOf('street')>-1||id.indexOf('track')>-1||id.indexOf('path')>-1||id.indexOf('pedestrian')>-1||id.indexOf('rail')>-1||id.indexOf('transit')>-1?C.roadMinor:C.road);
    map.setPaintProperty(l.id,'line-color',col);return}
   if(l.type==='symbol'&&l.layout&&l.layout['text-field']){
    map.setPaintProperty(l.id,'text-color',C.label);
    try{map.setPaintProperty(l.id,'text-halo-color',C.halo);map.setPaintProperty(l.id,'text-halo-width',1.3)}catch(e){}return}
  }catch(e){}
 });
}
function initMap(){
 if(map)return;
 map=new maplibregl.Map({container:mapEl,style:'https://tiles.openfreemap.org/styles/liberty',
  center:[mode.start[1],mode.start[0]],zoom:mode.zStart,attributionControl:{compact:false},interactive:false});
 map.on('load',function(){ready=true;polish();if(pendingFit){pendingFit();pendingFit=null}});
}
function clearLayers(){
 poiDots.forEach(function(d){d.remove()});poiDots=[];fired=[];lastBrg=null;lastPitch=0;
 if(car){car.remove();car=null}
 if(pin){pin.remove();pin=null}
 if(map&&RT){
  ['ks-done','ks-done-glow','ks-full'].forEach(function(s){try{map.removeLayer(s)}catch(e){}});
  try{map.removeSource('ks-route')}catch(e){}}
}
function routeLayers(){
 var src={type:'Feature',geometry:{type:'LineString',coordinates:RT}};
 map.addSource('ks-route',{type:'geojson',data:{type:'FeatureCollection',features:[
  {type:'Feature',properties:{id:0},geometry:src.geometry},
  {type:'Feature',properties:{id:1},geometry:{type:'LineString',coordinates:[]}}]}});
 map.addLayer({id:'ks-full',type:'line',source:'ks-route',filter:['==','id',0],
  layout:{'line-cap':'round'},paint:{'line-color':'rgba(216,187,138,.38)','line-width':3,'line-dasharray':[0,2.2]}});
 map.addLayer({id:'ks-done-glow',type:'line',source:'ks-route',filter:['==','id',1],
  layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'rgba(216,187,138,.28)','line-width':11,'line-blur':6}});
 map.addLayer({id:'ks-done',type:'line',source:'ks-route',filter:['==','id',1],
  layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#d8bb8a','line-width':4.5}});
 var full=src.geometry.coordinates;
 map.getSource('ks-route').setData({type:'FeatureCollection',features:[
  {type:'Feature',properties:{id:0},geometry:{type:'LineString',coordinates:full}},
  {type:'Feature',properties:{id:1},geometry:{type:'LineString',coordinates:[]}}]});
}
function setDone(i){
 try{map.getSource('ks-route').setData({type:'FeatureCollection',features:[
  {type:'Feature',properties:{id:0},geometry:{type:'LineString',coordinates:RT}},
  {type:'Feature',properties:{id:1},geometry:{type:'LineString',coordinates:RT.slice(0,i+1)}}]})}catch(e){}
}
function setCap(s){capBox.classList.remove('hide');capT.textContent=s.t;capS.textContent=s.s;
 capBox.classList.remove('in');void capBox.offsetWidth;capBox.classList.add('in')}
function dropPin(){
 if(pin)return;
 var el=elFor('ks-pin-wrap','<div class="ks-pin"><span class="ks-pin-i">'+HEART+'</span></div>');
 pin=new maplibregl.Marker({element:el,anchor:'bottom',offset:[0,2]}).setLngLat([mode.church[1],mode.church[0]]).addTo(map);
 var p=el.querySelector('.ks-pin');if(p)p.classList.add('drop')}
function arrive(){state='arrived';cancelAnimationFrame(raf);clearTimeout(preTimer);clearTimeout(stage2Timer);bar.style.width='100%';
 hud.classList.remove('show');
 setCap(mode.stops[mode.stops.length-1]);dropPin();
 if(car){car.setLngLat([mode.church[1],mode.church[0]]);var cel=car.getElement();if(cel)cel.classList.remove('driving')}
 if(REDUCE)map.jumpTo({center:[mode.church[1],mode.church[0]],zoom:mode.zEnd,pitch:0,bearing:0});
 else map.easeTo({center:[mode.church[1],mode.church[0]],zoom:mode.zEnd,pitch:0,bearing:0,duration:1600});
 setTimeout(function(){arrival.classList.add('show');skip.classList.remove('show');capBox.classList.add('hide');
  if(window.confetti&&!REDUCE)confetti({particleCount:120,spread:85,origin:{y:.55},colors:['#6e0f1f','#d8bb8a','#f5efe0','#5f6b34'],scalar:1.05,zIndex:270})},1600)}
function frame(ts){
 if(state!=='drive')return;
 var p=Math.min(1,(ts-t0)/mode.dur);
 if(RT){
  var d=distFrac(p),dOut=posAt(d*ARC.tot),pos=dOut,i=dOut[2];
  if(!isFinite(pos[0])||!isFinite(pos[1])){raf=requestAnimationFrame(frame);return}
  var remS=(1-p)*mode.dur/1000, mm=Math.floor(remS/60), ss=Math.floor(remS%60);
  hud.textContent=(Math.max(0,(1-d)*mode.km)).toFixed(1)+' '+mode.hudTail+' · '+mm+':'+String(ss).padStart(2,'0')+' to the gate';hud.classList.add('show');
  var nxt=RT[Math.min(i+1,RT.length-1)],prv=RT[Math.max(i-1,0)];
  var brg=Math.atan2(nxt[0]-prv[0],nxt[1]-prv[1])*180/Math.PI;if(brg<0)brg+=360;
  if(lastBrg===null)lastBrg=brg;lastBrg=lerpAng(lastBrg,brg,.08);
  var zoomT=Math.max(0,Math.min(1,(p-.9)/.1)),zoom=mode.zFollow+.9*ease(zoomT);
  var pitchT=Math.max(0,Math.min(1,p/.08)),pitchE=p>.92?Math.max(0,Math.min(1,(1-p)/.08)):1;
  var pitch=52*ease(pitchT)*ease(pitchE);lastPitch=pitch;
  var ahead=posAt(Math.min(ARC.tot,d*ARC.tot+ARC.tot*.022));
  if(car)car.setLngLat([pos[0],pos[1]]);
  if(car&&car.setRotation)car.setRotation(lastBrg);
  setDone(i);
  map.jumpTo({center:[ahead[0],ahead[1]],zoom:zoom,bearing:lastBrg,pitch:pitch});
  bar.style.width=(d*100).toFixed(1)+'%'}
 else{bar.style.width=(p*100).toFixed(1)+'%'}
 mode.stops.forEach(function(s,si){if(p>=s.f&&!fired[si]){fired[si]=1;setCap(s)}});
 if(p>=1){arrive();return}
 raf=requestAnimationFrame(frame)}
function loopStart(){if(state!=='prefly')return;state='drive';t0=performance.now();raf=requestAnimationFrame(frame)}
/* white-wedding flight: dive in flat, THEN tilt into 3D once the ground fills the screen
   (a pitched camera at low zoom shows mostly sky - the dead patch caught on QA) */
function stageTwo(){if(state!=='prefly'&&state!=='drive')return;
 map.easeTo({center:[mode.church[1],mode.church[0]],zoom:mode.zEnd,pitch:45,bearing:-25,duration:mode.dur*.45,essential:true})}
function startJourney(){if(state==='prefly'||state==='drive')return;
 beginBtn.classList.remove('show');arrival.classList.remove('show');skip.classList.add('show');
 if(mode.hudText){hud.textContent=mode.hudText;hud.classList.add('show')}
 clearLayers();state='prefly';
 var go=function(){
  if(mode.route){
   RT=toGL(mode.route);ARC=arc(RT);routeLayers();
   car=new maplibregl.Marker({element:elFor('ride-car','<span class="ride-rot">'+CAR+'</span>'),anchor:'center'})
    .setLngLat(RT[0]).addTo(map);
   var cel=car.getElement();if(cel)cel.classList.add('driving');
   (mode.pois||[]).forEach(function(p){
    var pp=posAt(p.f*ARC.tot);
    poiDots.push(new maplibregl.Marker({element:elFor('poi','<div class="poi-chip"><span>'+p.e+'</span>'+p.n+'</div>'),anchor:'bottom',offset:[0,-6],rotationAlignment:'viewport'})
     .setLngLat([pp[0],pp[1]]).addTo(map))});
   if(REDUCE)map.jumpTo({center:RT[0],zoom:mode.zFollow,pitch:0,bearing:0});
   else map.flyTo({center:RT[0],zoom:mode.zFollow,pitch:0,bearing:0,duration:1600,essential:true});
   preTimer=setTimeout(loopStart,1700)}
  else{RT=null;ARC=null;
   if(REDUCE){map.jumpTo({center:[mode.church[1],mode.church[0]],zoom:mode.zEnd,pitch:0,bearing:0});preTimer=setTimeout(loopStart,400)}
   else{map.flyTo({center:[mode.church[1],mode.church[0]],zoom:10.5,pitch:0,bearing:-15,duration:mode.dur*.55,essential:true});
    stage2Timer=setTimeout(stageTwo,900+mode.dur*.55);
    preTimer=setTimeout(loopStart,900)}}};
 if(ready)go();else pendingFit=go}
function open(key){mode=V[key];initMap();state='idle';
 hud.classList.remove('show');
 $('jEyebrow').textContent=mode.eyebrow;$('jTitle').textContent=mode.title;
 arrName.textContent=mode.venueName;arrAddr.textContent=mode.venueAddr;
 dirBtn.href=mode.dirLink;mapBtn.href=mode.mapLink;
 clearLayers();RT=null;ARC=null;capBox.classList.add('hide');arrival.classList.remove('show');skip.classList.remove('show');
 modal.classList.add('open');document.documentElement.classList.add('ks-lock');
 window.lenis&&window.lenis.stop();
 requestAnimationFrame(function(){map.resize()});
 if(REDUCE){beginBtn.classList.remove('show');
  if(mode.route){RT=toGL(mode.route);ARC=arc(RT);
   var fit=function(){routeLayers();
    var minL=Math.min.apply(null,RT.map(function(c){return c[0]})),maxL=Math.max.apply(null,RT.map(function(c){return c[0]})),
        minA=Math.min.apply(null,RT.map(function(c){return c[1]})),maxA=Math.max.apply(null,RT.map(function(c){return c[1]}));
    map.jumpTo({center:[(minL+maxL)/2,(minA+maxA)/2],zoom:10.4,pitch:0,bearing:0})};
   if(ready)fit();else pendingFit=fit}
  else map.jumpTo({center:[mode.church[1],mode.church[0]],zoom:mode.zEnd,pitch:0,bearing:0});
  arrive();return}
 /* full-route overview on open: route source not added yet, use raw coords */
 var overview=function(){
  var c=mode.route?mode.route.map(function(x){return[x[1],x[0]]}):null;
  if(c){var minL=Math.min.apply(null,c.map(function(q){return q[0]})),maxL=Math.max.apply(null,c.map(function(q){return q[0]})),
      minA=Math.min.apply(null,c.map(function(q){return q[1]})),maxA=Math.max.apply(null,c.map(function(q){return q[1]}));
   map.fitBounds([[minL-.08,minA-.08],[maxL+.08,maxA+.08]],{duration:0})}
  else map.jumpTo({center:[mode.start[1],mode.start[0]],zoom:mode.zFollow,pitch:0,bearing:0})};
 if(ready)overview();else pendingFit=overview;
 setTimeout(function(){if(state==='idle')beginBtn.classList.add('show')},450)}
function close(){cancelAnimationFrame(raf);clearTimeout(preTimer);clearTimeout(stage2Timer);state='idle';
 modal.classList.remove('open');document.documentElement.classList.remove('ks-lock');window.lenis&&window.lenis.start()}
beginBtn.addEventListener('click',startJourney);
again.addEventListener('click',startJourney);
skip.addEventListener('click',function(){
 if(state==='prefly'){clearTimeout(preTimer);state='drive';t0=-1e12;arrive()}
 else if(state==='drive'){t0=-1e12}});
$('jClose').addEventListener('click',close);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))close()});
var jbs=document.querySelectorAll('[data-journey]');
for(var i=0;i<jbs.length;i++)(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open(b.getAttribute('data-journey'))})})(jbs[i]);
window.addEventListener('resize',function(){if(modal.classList.contains('open'))map.resize()});
})();
