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
  zStart:5.6, zFollow:15.3, zEnd:17.2, dur:(typeof SAT!=='undefined'&&SAT)?55000:30000, km:27.0, hudTail:"km to Nimo",
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
 map=new maplibregl.Map({container:mapEl,style:SAT?SATSTYLE:'https://tiles.openfreemap.org/styles/liberty',
  center:[mode.start[1],mode.start[0]],zoom:mode.zStart,attributionControl:{compact:false},interactive:false,maxTileCacheSize:600});
 map.on('load',function(){ready=true;try{map.setFadeDuration(SAT?250:300)}catch(e){};polish();if(pendingFit){pendingFit();pendingFit=null}});
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
function arrive(){state='arrived';cancelAnimationFrame(raf);clearTimeout(preTimer);clearTimeout(stage2Timer);modal.classList.remove('ks-pov');bar.style.width='100%';try{if(SAT&&map.getLayer('sat-ref'))map.setLayoutProperty('sat-ref','visibility','visible')}catch(e){};
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
  if(!POV)hud.textContent=(Math.max(0,(1-d)*mode.km)).toFixed(1)+' '+mode.hudTail+' · '+mm+':'+String(ss).padStart(2,'0')+' to the gate';
  hud.classList.add('show');
  var nxt=RT[Math.min(i+1,RT.length-1)],prv=RT[Math.max(i-1,0)];
  var brg=Math.atan2(nxt[0]-prv[0],nxt[1]-prv[1])*180/Math.PI;if(brg<0)brg+=360;
  if(lastBrg===null)lastBrg=brg;lastBrg=lerpAng(lastBrg,brg,.08);
  if(POV){
   var dtS=Math.max(.001,(ts-prevT)/1000);
   var k=(d-prevD)*mode.km*3.6/dtS;if(isFinite(k))kmhS+=(k-kmhS)*.12;
   prevD=d;prevT=ts;
   if(prevRaw===null)prevRaw=brg;
   var dbr=brg-prevRaw;while(dbr>180)dbr-=360;while(dbr<-180)dbr+=360;prevRaw=brg;
   var wt=Math.max(-80,Math.min(80,dbr/dtS*.32));
   wheelAng+=(wt-wheelAng)*.22;
   var wob=Math.sin(ts/280)*Math.min(2.2,kmhS*.045);
   var wsvg=jWheelEl&&jWheelEl.querySelector('svg');if(wsvg)wsvg.style.transform='rotate('+(wheelAng+wob).toFixed(1)+'deg)';
   if(gNum)gNum.textContent=Math.round(kmhS);
   if(gNeedle)gNeedle.style.transform='rotate('+(-120+Math.max(0,Math.min(240,kmhS))/240*240).toFixed(1)+'deg)';
   if(gKm)gKm.textContent=(Math.max(0,(1-d)*mode.km)).toFixed(1);
   if(gEta)gEta.textContent=mm+':'+String(ss).padStart(2,'0')}
  if(POV){
   var lk=posAt(Math.min(ARC.tot,d*ARC.tot+Math.max(ARC.tot*.002,.001)));
   var dz=16.6+(SAT?.6:1.7)*ease(Math.max(0,Math.min(1,p/.06)));
   var dp=(SAT?58:66)*ease(Math.max(0,Math.min(1,p/.05)));
   dz+=.03*Math.sin(ts/620);dp+=.5*Math.sin(ts/900);
   setDone(i);
   map.jumpTo({center:[lk[0],lk[1]],zoom:dz,bearing:lastBrg,pitch:dp})}
  else{
   var zoomT=Math.max(0,Math.min(1,(p-.9)/.1)),zoom=mode.zFollow+.9*ease(zoomT);if(SAT)zoom=Math.min(zoom,15.9);
   var pitchT=Math.max(0,Math.min(1,p/.08)),pitchE=p>.92?Math.max(0,Math.min(1,(1-p)/.08)):1;
   var pitch=52*ease(pitchT)*ease(pitchE);lastPitch=pitch;
   var ahead=posAt(Math.min(ARC.tot,d*ARC.tot+ARC.tot*.022));
   if(car)car.setLngLat([pos[0],pos[1]]);
   if(car&&car.setRotation)car.setRotation(lastBrg);
   setDone(i);
   map.jumpTo({center:[ahead[0],ahead[1]],zoom:zoom,bearing:lastBrg,pitch:pitch})}
  bar.style.width=(d*100).toFixed(1)+'%'}
 else{bar.style.width=(p*100).toFixed(1)+'%'}
 mode.stops.forEach(function(s,si){if(p>=s.f&&!fired[si]){fired[si]=1;setCap(s)}});
 if(p>=1){arrive();return}
 raf=requestAnimationFrame(frame)}
function warmCorridor(){
 try{
  if(!SAT||!mode||!mode.route||!mode.route.length)return;
  var cs=mode.route,seen={},urls=[];
  function txy(lat,lng,z){var t=Math.pow(2,z),x=(lng+180)/360*t;
   var r=lat*Math.PI/180,y=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*t;
   return[Math.floor(((x%t)+t)%t),Math.max(0,Math.min(t-1,Math.floor(y)))]}
  var zs=POV?[14,16,17]:[14,15];
  for(var i=0;i<cs.length;i+=Math.max(1,Math.round(cs.length/50))){
   for(var zi=0;zi<zs.length;zi++){var z=zs[zi],xy=txy(cs[i][0],cs[i][1],z);
    for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){
     var k=z+':'+(xy[0]+dx)+':'+(xy[1]+dy);
     if(!seen[k]){seen[k]=1;
      urls.push('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/'+z+'/'+(xy[1]+dy)+'/'+(xy[0]+dx))}}}}
  urls=urls.slice(0,420);
  var q=urls.slice();
  (function pump(){var n=0;while(n<8&&q.length){var im=new Image();im.onload=im.onerror=function(){setTimeout(pump,20)};im.src=q.shift();n++}})();
 }catch(e){}}
function loopStart(){if(state!=='prefly')return;state='drive';t0=performance.now();prevD=0;prevT=t0;kmhS=0;wheelAng=0;prevRaw=null;raf=requestAnimationFrame(frame)}
/* white-wedding flight: dive in flat, THEN tilt into 3D once the ground fills the screen
   (a pitched camera at low zoom shows mostly sky - the dead patch caught on QA) */
function stageTwo(){if(state!=='prefly'&&state!=='drive')return;
 map.easeTo({center:[mode.church[1],mode.church[0]],zoom:mode.zEnd,pitch:45,bearing:-25,duration:mode.dur*.45,essential:true})}
function startJourney(){if(state==='prefly'||state==='drive')return;
 hideChooser();beginBtn.classList.remove('show');arrival.classList.remove('show');skip.classList.add('show');
 if(mode.hudText){hud.textContent=mode.hudText;hud.classList.add('show')}
 clearLayers();state='prefly';
 var go=function(){
  if(mode.route){
   RT=toGL(mode.route);ARC=arc(RT);routeLayers();
   try{if(SAT&&map.getLayer('sat-ref'))map.setLayoutProperty('sat-ref','visibility','none')}catch(e){}
   if(POV){modal.classList.add('ks-pov');var gT=$('gKmT');if(gT)gT.textContent=mode.hudTail;
    var ds=Math.round(mode.dur/1000);
    if(gKm)gKm.textContent=mode.km.toFixed(1);
    if(gEta)gEta.textContent=Math.floor(ds/60)+':'+String(ds%60).padStart(2,'0')}
   if(!POV){
    car=new maplibregl.Marker({element:elFor('ride-car','<span class="ride-rot">'+CAR+'</span>'),anchor:'center'})
     .setLngLat(RT[0]).addTo(map);
    var cel=car.getElement();if(cel)cel.classList.add('driving')}
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
function open(key){mode=V[key];liveKey=key;initMap();state='idle';showChooser();
 hud.classList.remove('show');
 $('jEyebrow').textContent=mode.eyebrow;$('jTitle').textContent=mode.title;
 arrName.textContent=mode.venueName;arrAddr.textContent=mode.venueAddr;
 dirBtn.href=mode.dirLink;mapBtn.href=mode.mapLink;
 clearLayers();RT=null;ARC=null;capBox.classList.add('hide');arrival.classList.remove('show');skip.classList.remove('show');
 modal.classList.add('open');document.documentElement.classList.add('ks-lock');
 warmCorridor();
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
function close(){cancelAnimationFrame(raf);clearTimeout(preTimer);clearTimeout(stage2Timer);state='idle';hideChooser();
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

/* ---- personalized journey: any guest, their own road ----
   GPS or a typed hometown -> OSRM plots the real driving route -> the same
   chase-cam drive runs from THEIR doorstep to the venue. Free rails:
   OSRM demo router + Photon geocoder (no keys, no billing). */
var jStart=$('jStart'),jGeo=$('jGeo'),jSearch=$('jSearch'),jSug=$('jSug'),jPlan=$('jPlan'),
    liveKey='trad',phT=null,sugData=[],sugOn=-1;
function showChooser(){if(jStart)jStart.classList.add('show');renderRecent()}
function hideChooser(){if(!jStart)return;jStart.classList.remove('show');jSug.classList.remove('open')}
function hav(a,b){var R=6371,d=Math.PI/180,dLa=(b[0]-a[0])*d,dLo=(b[1]-a[1])*d,
 la=a[0]*d,lb=b[0]*d,h=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(la)*Math.cos(lb)*Math.sin(dLo/2)*Math.sin(dLo/2);
 return 2*R*Math.asin(Math.sqrt(h))*1.25}
function thin(cs,n){if(cs.length<=n)return cs;var out=[],s=(cs.length-1)/(n-1),i;for(i=0;i<n;i++)out.push(cs[Math.round(i*s)]);return out}
function fetchRoute(from,to,cb){
 var ctl=('AbortController' in window)?new AbortController():null,
     tm=ctl?setTimeout(function(){try{ctl.abort()}catch(e){}},9000):null,
     url='https://router.project-osrm.org/route/v1/driving/'+from[1]+','+from[0]+';'+to[1]+','+to[0]+'?overview=full&geometries=geojson';
 fetch(url,ctl?{signal:ctl.signal}:undefined)
  .then(function(r){return r.json()})
  .then(function(j){if(tm)clearTimeout(tm);
   if(j&&j.code==='Ok'&&j.routes&&j.routes[0]&&j.routes[0].geometry&&j.routes[0].geometry.coordinates&&j.routes[0].geometry.coordinates.length>1)cb(null,j.routes[0]);
   else cb('bad')})
  .catch(function(){if(tm)clearTimeout(tm);cb('fail')})}
function goLive(from,label,key){
 hideChooser();beginBtn.classList.remove('show');arrival.classList.remove('show');
 hud.classList.remove('show');skip.classList.remove('show');capBox.classList.add('hide');
 modal.classList.add('open');document.documentElement.classList.add('ks-lock');window.lenis&&window.lenis.stop();
 mode=V[key];liveKey=key;initMap();requestAnimationFrame(function(){if(map)map.resize()});
 hud.textContent='Plotting your route\u2026';hud.classList.add('show');
 try{history.replaceState(null,'','?from='+from[0].toFixed(5)+','+from[1].toFixed(5)+'&w='+key+(label?'&n='+encodeURIComponent(label):'')+'#events')}catch(e){}
 try{localStorage.setItem('ks26trip',JSON.stringify({lat:from[0],lng:from[1],label:label,w:key}))}catch(e){}
 fetchRoute(from,V[key].church,function(err,r){
  var cs,km;
  if(!err&&r&&r.geometry){cs=r.geometry.coordinates;km=r.distance/1000}
  else{cs=[[from[1],from[0]],[V[key].church[1],V[key].church[0]]];km=hav(from,V[key].church)}
  cs=thin(cs,900);
  var dest=key==='trad'?'Nimo':'Abraka',home=label||'Your location';
  mode={eyebrow:V[key].eyebrow,
   title:label?('From '+label+' to '+dest):('Your road to '+dest),
   venueName:V[key].venueName,venueAddr:V[key].venueAddr,dirLink:V[key].dirLink,mapLink:V[key].mapLink,
   church:V[key].church,route:cs.map(function(c){return[c[1],c[0]]}),start:[from[0],from[1]],
   zStart:5.6,zFollow:15.3,zEnd:V[key].zEnd,
   dur:Math.max(18000,Math.min(SAT?80000:50000,14000+km*700*(SAT?1.6:1))),km:km,
   hudTail:key==='trad'?'km to Nimo':'km to Abraka',pois:[],
   stops:[{f:0,t:home,s:'The drive to '+(key==='trad'?'Nwakor compound':'Gospel Stars Church')+' begins.'},
    {amb:1,f:.45,t:'On the road',s:err?'The map drew you a straight line. The road will forgive.':'Every kilometre is part of the story.'},
    {f:.92,t:'Almost there',s:key==='trad'?'The compound lights are close now.':'The town slows down for the gate.'},
    {f:.999,t:V[key].venueName,s:'You have arrived.'}]};
  $('jEyebrow').textContent=mode.eyebrow;$('jTitle').textContent=mode.title;
  arrName.textContent=mode.venueName;arrAddr.textContent=mode.venueAddr;
  dirBtn.href=mode.dirLink;mapBtn.href=mode.mapLink;
  clearLayers();RT=null;ARC=null;state='idle';warmCorridor();
  startJourney()})}
function phQuery(q){
 fetch('https://photon.komoot.io/api/?q='+encodeURIComponent(q)+'&limit=6&lat=5.9&lon=6.4&lang=en')
  .then(function(r){return r.json()})
  .then(function(j){sugData=((j&&j.features)||[]).filter(function(f){return f.geometry&&f.geometry.coordinates}).slice(0,6);renderSug()})
  .catch(function(){sugData=[];jSug.innerHTML='<div class="js-none">Search is taking a nap. Try the city name alone.</div>';jSug.classList.add('open')})}
function renderSug(){
 if(!sugData.length){jSug.innerHTML='<div class="js-none">Nothing found. Try a town or city name.</div>';jSug.classList.add('open');return}
 jSug.innerHTML=sugData.map(function(f,i){
  var p=f.properties||{},label=p.name||p.city||p.state||'Place',
      sub=[(p.city&&p.city!==label)?p.city:null,p.state,p.country].filter(Boolean).join(' \u00b7 ');
  return '<button type="button" data-i="'+i+'">'+label+(sub?'<small>'+sub+'</small>':'')+'</button>'}).join('');
 sugOn=-1;jSug.classList.add('open')}
function markSug(){var bs=jSug.querySelectorAll('button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',i===sugOn)}
function pickSug(i){
 var f=sugData[i];if(!f)return;
 var p=f.properties||{},label=p.name||p.city||'Your location';
 jSearch.blur();jSug.classList.remove('open');
 goLive([f.geometry.coordinates[1],f.geometry.coordinates[0]],label,liveKey)}
if(jGeo)jGeo.addEventListener('click',function(){
 if(!navigator.geolocation){jGeo.textContent='No location on this device - type it instead';
  setTimeout(function(){jGeo.textContent='\U0001F4CD Use my location'},3200);return}
 var old=jGeo.textContent;jGeo.textContent='Locating\u2026';
 navigator.geolocation.getCurrentPosition(function(p){jGeo.textContent=old;
   goLive([p.coords.latitude,p.coords.longitude],null,liveKey)},
  function(){jGeo.textContent='Could not read it - type your area instead';
   setTimeout(function(){jGeo.textContent=old},3200);try{jSearch.focus()}catch(e){}},
  {enableHighAccuracy:true,timeout:10000,maximumAge:60000})});
if(jSearch){
 jSearch.addEventListener('input',function(){var q=jSearch.value.trim();
  clearTimeout(phT);if(q.length<2){jSug.classList.remove('open');return}
  phT=setTimeout(function(){phQuery(q)},380)});
 jSearch.addEventListener('keydown',function(e){
  if(e.key==='Enter'){e.preventDefault();pickSug(sugOn>-1?sugOn:0)}
  else if(e.key==='ArrowDown'){e.preventDefault();sugOn=Math.min(sugData.length-1,sugOn+1);markSug()}
  else if(e.key==='ArrowUp'){e.preventDefault();sugOn=Math.max(-1,sugOn-1);markSug()}
  else if(e.key==='Escape'){e.stopPropagation();jSug.classList.remove('open')}});
 jSearch.addEventListener('blur',function(){setTimeout(function(){jSug.classList.remove('open')},220)})}
if(jSug)jSug.addEventListener('mousedown',function(e){
 var b=e.target&&e.target.closest?e.target.closest('button'):null;if(b)pickSug(+b.getAttribute('data-i'))});
if(jPlan)jPlan.addEventListener('click',function(){arrival.classList.remove('show');open(liveKey)});
function renderRecent(){
 var r=null;try{r=JSON.parse(localStorage.getItem('ks26trip')||'null')}catch(e){}
 var box=document.getElementById('jRecent');if(!box)return;
 if(r&&isFinite(r.lat)&&isFinite(r.lng)&&(r.w==='trad'||r.w==='white')){
  box.innerHTML='<button type="button" class="js-chip" id="jRecentBtn">\u21ba Again from '+(r.label||'my location')+'</button>';
  var rb=document.getElementById('jRecentBtn');
  if(rb)rb.addEventListener('click',function(){goLive([r.lat,r.lng],r.label,r.w)})}
 else box.innerHTML=''}


/* ---- cockpit view: first-person dash, live steering wheel, horn ---- */
var POV=false;
try{POV=localStorage.getItem('ks26cam')==='pov'}catch(e){}
var jWheelEl=$('jWheel'),gNum=$('gNum'),gNeedle=$('gNeedle'),gKm=$('gKm'),gEta=$('gEta'),prevD=0,prevT=0,kmhS=0,wheelAng=0,prevRaw=null;
function camLabel(){var b=$('jCam');if(b)b.textContent=POV?'\uD83C\uDFA5 Chase view':'\uD83D\uDEDE Cockpit view'}
camLabel();
var cBtn=$('jCam');
if(cBtn)cBtn.addEventListener('click',function(){
 POV=!POV;
 try{localStorage.setItem('ks26cam',POV?'pov':'chase')}catch(e){}
 camLabel();});

/* ---- view toggle: night vector map <-> real satellite imagery (Esri World Imagery,
   free with attribution, no key; place labels overlaid on top) ---- */
var SAT=true;
try{SAT=localStorage.getItem('ks26view')!=='night'}catch(e){}
var SATSTYLE={version:8,
 sources:{
  sat:{type:'raster',tileSize:256,maxzoom:17,
   tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
   attribution:'\u00a9 Esri, Maxar, Earthstar Geographics, and the GIS User Community'},
  ref:{type:'raster',tileSize:256,maxzoom:17,
   tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
   attribution:''}},
 layers:[{id:'sat-img',type:'raster',source:'sat',paint:{'raster-fade-duration':250}},
         {id:'sat-ref',type:'raster',source:'ref',paint:{'raster-fade-duration':250,'raster-opacity':.9}}]};
function toggleSat(){
 if(!map||state!=='idle')return;
 SAT=!SAT;
 jViewBtn();
 if(SAT)map.setStyle(SATSTYLE);
 else{map.setStyle('https://tiles.openfreemap.org/styles/liberty');polished=false}
 afterStyle(function(){
  try{map.setFadeDuration(SAT?250:300)}catch(e){}
  if(!SAT)polish();
  if(RT&&ARC&&mode&&mode.route){['ks-done','ks-done-glow','ks-full'].forEach(function(s){try{map.removeLayer(s)}catch(e){}});try{map.removeSource('ks-route')}catch(e){};routeLayers()}
 })}
function afterStyle(cb){var done=false,iv=null;
 var f=function(){if(done)return;var ok=false;try{ok=map.isStyleLoaded()}catch(e){ok=false}if(!ok)return;
  done=true;if(iv)clearInterval(iv);cb()};
 map.once('style.load',f);iv=setInterval(f,250);setTimeout(function(){if(iv)clearInterval(iv)},6000)}
function jViewBtn(){var b=$('jView');if(b)b.textContent=SAT?'\uD83C\uDF03 Night map':'\U0001F6F0 Satellite view'}
var vBtn=$('jView');if(vBtn)vBtn.addEventListener('click',toggleSat);
jViewBtn();

/* shared link boot: ?from=lat,lng&w=trad&n=Warri replays that guest's exact drive */
(function(){var q=new URLSearchParams(location.search),
 f=q.get('from'),w=q.get('w'),n=q.get('n');
 if(f&&/^[-0-9.]+,[-0-9.]+$/.test(f)&&(w==='trad'||w==='white')){
  var p=f.split(','),la=+p[0],ln=+p[1];
  if(isFinite(la)&&isFinite(ln)&&Math.abs(la)<=85&&ln>=-180&&ln<=180&&Math.abs(la)+Math.abs(ln)>0.01)
   setTimeout(function(){goLive([la,ln],n||null,w)},600)}})();

})();
