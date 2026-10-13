/* Kalut-Shefa '26 · the journey (GPS-style drive simulation on Leaflet) */
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
  zFollow:13, zEnd:16.8, dur:30000, km:27.0, hudTail:"km to Nimo",
  pois:[{f:0,e:"🚌",n:"Upper Iweka"},{f:.7273,e:"🏘️",n:"Abagana"},{f:.9328,e:"🚦",n:"Enugu-Ukwu"}],
  stops:[
   {f:0,     t:"Upper Iweka, Onitsha", s:"Jump on the Old Road. Abagana first."},
   {f:.7273, t:"The Old Road, Abagana",s:"Cruising through Abagana. Keep rolling."},
   {f:.9328, t:"Enugu-Ukwu junction",  s:"Ezi-Elias ahead. Turn right towards Nimo."},
   {amb:1,f:.42, t:"The Old Road",        s:"Windows down, the dotted line hums toward Nimo."},
   {amb:1,f:.8,  t:"Almost there",        s:"The compound lights are close now."},
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
  zFollow:5.2, zEnd:16.8, dur:9500, hudText:"En route to Abraka", pois:[],
  stops:[
   {f:0,    t:"Delta State, Nigeria",        s:"Somewhere in this state, a church is waiting."},
   {amb:1,f:.5, t:"Into Abraka",          s:"The town slows down for the gate."},
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
var modal=document.getElementById('journeyModal'), mapEl=document.getElementById('jMap');
if(!modal||!mapEl||!window.L) return;
var map=null,line=null,car=null,rotEl=null,pin=null,wpDots=[],poiDots=[],raf=null,mode=null,hud=$('jHud'),
    t0=0,state='idle',preTimer=null,fired=[],lastBrg=null;
function $(id){return document.getElementById(id)}
var capT=$('jCapT'),capS=$('jCapS'),capBox=$('jCap'),bar=$('jBar'),beginBtn=$('jBegin'),arrival=$('jArrival'),skip=$('jSkip'),dirBtn=$('jDir'),mapBtn=$('jMapBtn'),again=$('jAgain'),arrName=$('jArrName'),arrAddr=$('jArrAddr');
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function divIcon(cls,html,w,h){return L.divIcon({className:'',html:'<div class="'+cls+'">'+html+'</div>',iconSize:[w,h],iconAnchor:[w/2,h-4]})}
function arc(latlngs){var a=[0],tot=0,i;for(i=1;i<latlngs.length;i++){var dx=latlngs[i][0]-latlngs[i-1][0],dy=latlngs[i][1]-latlngs[i-1][1];tot+=Math.sqrt(dx*dx+dy*dy);a.push(tot)}return{a:a,tot:tot}}
function posAt(dist){var P=mode.route,r=mode._arc,i=0;
 while(i<P.length-2&&r.a[i+1]<dist)i++;
 var seg=(r.a[i+1]-r.a[i])||1e-9,k=Math.max(0,Math.min(1,(dist-r.a[i])/seg));
 return[P[i][0]+(P[i+1][0]-P[i][0])*k,P[i][1]+(P[i+1][1]-P[i][1])*k,i]}
function lerpAng(a,b,k){var d=b-a;while(d>180)d-=360;while(d<-180)d+=360;return a+d*k}
function clearLayers(){wpDots.forEach(function(d){map.removeLayer(d)});wpDots=[];
 poiDots.forEach(function(d){map.removeLayer(d)});poiDots=[];fired=[];lastBrg=null;
 if(line){map.removeLayer(line);line=null}
 if(car){map.removeLayer(car);car=null;rotEl=null}
 if(pin){map.removeLayer(pin);pin=null}}
function initMap(){if(map)return;
 map=L.map(mapEl,{zoomControl:false,attributionControl:true,zoomSnap:.1,zoomDelta:.5,keyboard:false});
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);}
function setCap(s){capBox.classList.remove('hide');capT.textContent=s.t;capS.textContent=s.s;
 capBox.classList.remove('in');void capBox.offsetWidth;capBox.classList.add('in')}
function dropPin(){if(pin)return;pin=L.marker(mode.church,{icon:divIcon('ks-pin','<span class="ks-pin-i">♥</span>',44,48),keyboard:false,zIndexOffset:900}).addTo(map);
 var el=pin.getElement();if(el)el.querySelector('.ks-pin').classList.add('drop')}
function arrive(){state='arrived';cancelAnimationFrame(raf);clearTimeout(preTimer);bar.style.width='100%';
 hud.classList.remove('show');
 setCap(mode.stops[mode.stops.length-1]);dropPin();
 if(car){car.setLatLng(mode.church);var cel=car.getElement();if(cel)cel.classList.remove('driving')}
 if(REDUCE)map.setView(mode.church,mode.zEnd,{animate:false});
 else{map.stop();map.flyTo(mode.church,mode.zEnd,{duration:1.6,easeLinearity:.25})}
 setTimeout(function(){arrival.classList.add('show');skip.classList.remove('show');capBox.classList.add('hide');
  if(window.confetti&&!REDUCE)confetti({particleCount:120,spread:85,origin:{y:.55},colors:['#6e0f1f','#d8bb8a','#f5efe0','#5f6b34'],scalar:1.05,zIndex:270})},1600)}
function frame(ts){
 if(state!=='drive')return;
 var p=Math.min(1,(ts-t0)/mode.dur);
 var pos=null,i=null;
 if(mode.route){var d=distFrac(p),dOut=posAt(d*mode._arc.tot);pos=[dOut[0],dOut[1]];i=dOut[2];
  if(!isFinite(pos[0])||!isFinite(pos[1])){raf=requestAnimationFrame(frame);return}
  var remS=(1-p)*mode.dur/1000, mm=Math.floor(remS/60), ss=Math.floor(remS%60);
  hud.textContent=(Math.max(0,(1-d)*mode.km)).toFixed(1)+' '+mode.hudTail+' · '+mm+':'+String(ss).padStart(2,'0')+' to the gate';hud.classList.add('show');
  var RT=mode.route,nxt=RT[Math.min(i+1,RT.length-1)],prv=RT[Math.max(i-1,0)];
  var brg=Math.atan2(nxt[1]-prv[1],nxt[0]-prv[0])*180/Math.PI;if(brg<0)brg+=360;
  if(lastBrg===null)lastBrg=brg;lastBrg=lerpAng(lastBrg,brg,.12);
  car.setLatLng(pos);if(rotEl)rotEl.style.transform='rotate('+(lastBrg+90).toFixed(1)+'deg)';
  map.panTo(pos,{animate:false});bar.style.width=(d*100).toFixed(1)+'%'}
 else{bar.style.width=(p*100).toFixed(1)+'%'}
 mode.stops.forEach(function(s,si){if(p>=s.f&&!fired[si]){fired[si]=1;setCap(s);
  if(mode.route&&!s.amb&&s.f>0&&s.f<.999&&pos)wpDots.push(L.marker(pos,{icon:L.divIcon({className:'',html:'<div class="wp-dot"></div>',iconSize:[12,12],iconAnchor:[6,6]}),interactive:false}).addTo(map))}});
 if(p>=1){arrive();return}
 raf=requestAnimationFrame(frame)}
function loopStart(){if(state!=='prefly')return;state='drive';t0=performance.now();raf=requestAnimationFrame(frame)}
function startJourney(){if(state==='prefly'||state==='drive')return;
 beginBtn.classList.remove('show');arrival.classList.remove('show');skip.classList.add('show');
 if(mode.hudText){hud.textContent=mode.hudText;hud.classList.add('show')}
 clearLayers();state='prefly';
 if(mode.route){line=L.polyline(mode.route,{color:'#d8bb8a',weight:3.5,opacity:.9,dashArray:'1 9',lineCap:'round'}).addTo(map);
  mode._arc=arc(mode.route);
  car=L.marker(mode.route[0],{icon:divIcon('ride-car','<span class="ride-rot">'+CAR+'</span>',30,52),keyboard:false,zIndexOffset:800}).addTo(map);
  var el=car.getElement();if(el){rotEl=el.querySelector('.ride-rot');el.classList.add('driving')}
  (mode.pois||[]).forEach(function(p){var pp=posAt(p.f*mode._arc.tot);
   poiDots.push(L.marker(pp,{icon:divIcon('poi','<div class="poi-chip"><span>'+p.e+'</span>'+p.n+'</div>',118,26),interactive:false,keyboard:false}).addTo(map))});
  if(REDUCE)map.setView(mode.route[0],mode.zFollow,{animate:false});
  else map.flyTo(mode.route[0],mode.zFollow,{duration:1.6,easeLinearity:.3});
  preTimer=setTimeout(loopStart,1700)}
 else{if(REDUCE){map.setView(mode.church,mode.zEnd,{animate:false});preTimer=setTimeout(loopStart,400)}
  else map.flyTo(mode.church,mode.zEnd,{duration:mode.dur/1000,easeLinearity:.18});
  preTimer=setTimeout(loopStart,900)}}
function open(key){mode=V[key];initMap();map.invalidateSize();map.stop();state='idle';
 hud.classList.remove('show');
 $('jEyebrow').textContent=mode.eyebrow;$('jTitle').textContent=mode.title;
 arrName.textContent=mode.venueName;arrAddr.textContent=mode.venueAddr;
 dirBtn.href=mode.dirLink;mapBtn.href=mode.mapLink;
 clearLayers();capBox.classList.add('hide');arrival.classList.remove('show');skip.classList.remove('show');
 modal.classList.add('open');document.documentElement.classList.add('ks-lock');
 window.lenis&&window.lenis.stop();
 if(REDUCE){beginBtn.classList.remove('show');
  if(mode.route){line=L.polyline(mode.route,{color:'#d8bb8a',weight:3.5,opacity:.9}).addTo(map);mode._arc=arc(mode.route);
   map.fitBounds(L.latLngBounds(mode.route).pad(.25))}
  else map.setView(mode.church,mode.zEnd);
  arrive();return}
 if(mode.route)map.fitBounds(L.latLngBounds(mode.route).pad(.25));
 else map.setView(mode.start,mode.zFollow);
 setTimeout(function(){if(state==='idle')beginBtn.classList.add('show')},450)}
function close(){cancelAnimationFrame(raf);clearTimeout(preTimer);state='idle';map.stop();
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
window.addEventListener('resize',function(){if(modal.classList.contains('open'))map.invalidateSize()});
})();
