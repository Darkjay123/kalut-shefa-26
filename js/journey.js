/* Kalut-Shefa '26 · the journey (road-trip simulation on Leaflet) */
(function(){
"use strict";
var ROUTE=[[6.1334,6.80041],[6.13362,6.8006],[6.13678,6.79898],[6.1384,6.80116],[6.14541,6.81204],[6.14625,6.81518],[6.14846,6.81955],[6.15843,6.84335],[6.15672,6.84462],[6.15302,6.84577],[6.15353,6.85431],[6.15226,6.86386],[6.15214,6.86597],[6.15265,6.8691],[6.16065,6.90687],[6.16399,6.91976],[6.1646,6.92157],[6.16614,6.92323],[6.17063,6.92716],[6.1709,6.92804],[6.17076,6.92948],[6.17043,6.93037],[6.17062,6.93117],[6.17245,6.9332],[6.17372,6.93418],[6.17621,6.93803],[6.17688,6.93963],[6.17806,6.94061],[6.17999,6.94121],[6.18093,6.9425],[6.18181,6.9433],[6.18337,6.947],[6.18364,6.95026],[6.18358,6.95175],[6.18479,6.95645],[6.18501,6.95974],[6.18476,6.96208],[6.18427,6.964],[6.18493,6.9678],[6.18503,6.97333],[6.18538,6.975],[6.18494,6.97751],[6.18518,6.98082],[6.18626,6.98106],[6.18734,6.98046],[6.18721,6.98006],[6.18647,6.97974],[6.18721,6.98006],[6.18734,6.98046],[6.18626,6.98106],[6.18518,6.98082],[6.18518,6.98342],[6.18497,6.98506],[6.18324,6.99111],[6.18225,6.99353],[6.18027,6.99557],[6.17882,6.99659],[6.17738,6.99705],[6.17575,6.99668],[6.17502,6.9968],[6.17219,6.99881],[6.17169,6.99948],[6.17179,7.00232],[6.17136,7.00404],[6.17139,7.00581],[6.1709,7.00832],[6.17119,7.00915],[6.17202,7.01045],[6.17361,7.01174],[6.17266,7.01307],[6.17117,7.01701],[6.17018,7.01901],[6.17056,7.02101],[6.17092,7.02194],[6.17118,7.02376],[6.17103,7.0275],[6.17137,7.02857],[6.17206,7.02945],[6.17188,7.03016],[6.17145,7.03009],[6.17134,7.0297],[6.17201,7.02992],[6.17206,7.02945],[6.17111,7.02797],[6.17101,7.02608],[6.17118,7.02376],[6.17092,7.02194],[6.17056,7.02101],[6.17018,7.01901],[6.17117,7.01701],[6.17266,7.01307],[6.17361,7.01174],[6.17202,7.01045],[6.17119,7.00915],[6.1709,7.00832],[6.17139,7.00581],[6.17136,7.00404],[6.17179,7.00232],[6.17162,6.99981],[6.17088,6.9996],[6.16912,6.99818],[6.16581,6.997],[6.16364,6.99601],[6.16244,6.99496],[6.16127,6.99337],[6.16086,6.99373]];
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
  route:ROUTE,
  zDrive:12.4, zEnd:16.8, dur:26000,
  start:[6.1335230,6.8002695],
  stops:[
   {f:0,     t:"Upper Iweka, Onitsha", s:"Jump on the Old Road. Abagana first."},
   {f:.4381, t:"The Old Road, Abagana",s:"Cruising through Abagana. Keep rolling."},
   {f:.7429, t:"Enugu-Ukwu ahead",     s:"Watch for the junction. Almost there."},
   {f:.85,   t:"Ezi-Elias junction",   s:"Stop here. Turn right towards Nimo."},
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
  zDrive:5.2, zEnd:16.8, dur:9500,
  start:[6.3,6.6],
  stops:[
   {f:0,    t:"Delta State, Nigeria",        s:"Somewhere in this state, a church is waiting."},
   {f:.62,  t:"Little London Road, Abraka",  s:"Turn in here. Almost there."},
   {f:.999, t:"Gospel Stars Church",         s:"No. 9 Gospel Stars Church Street, Abraka."}
  ]
 }
};
var modal=document.getElementById('journeyModal'), mapEl=document.getElementById('jMap');
if(!modal||!mapEl||!window.L) return;
var map=null,line=null,car=null,pin=null,wpDots=[],raf=null,mode=null,t0=0,playing=false,fired=[];
function $(id){return document.getElementById(id)}
var capT=$('jCapT'),capS=$('jCapS'),capBox=$('jCap'),bar=$('jBar'),beginBtn=$('jBegin'),arrival=$('jArrival'),skip=$('jSkip'),dirBtn=$('jDir'),mapBtn=$('jMapBtn'),again=$('jAgain'),arrName=$('jArrName'),arrAddr=$('jArrAddr');
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function divIcon(cls,html,w,h){return L.divIcon({className:'',html:'<div class="'+cls+'">'+html+'</div>',iconSize:[w,h],iconAnchor:[w/2,h-4]})}
function arc(latlngs){var a=[0],tot=0,i;for(i=1;i<latlngs.length;i++){var dx=latlngs[i][0]-latlngs[i-1][0],dy=latlngs[i][1]-latlngs[i-1][1];tot+=Math.sqrt(dx*dx+dy*dy);a.push(tot)}return{a:a,tot:tot}}
function posAt(p){var L=mode.route,r=mode._arc,target=p*r.tot,i=0;
 while(i<L.length-2&&r.a[i+1]<target)i++;
 var seg=(r.a[i+1]-r.a[i])||1e-9,k=Math.max(0,Math.min(1,(target-r.a[i])/seg));
 return[L[i][0]+(L[i+1][0]-L[i][0])*k,L[i][1]+(L[i+1][1]-L[i][1])*k]}
function clearLayers(){wpDots.forEach(function(d){map.removeLayer(d)});wpDots=[];fired=[];
 if(line){map.removeLayer(line);line=null}
 if(car){map.removeLayer(car);car=null}
 if(pin){map.removeLayer(pin);pin=null}}
function initMap(){if(map)return;
 map=L.map(mapEl,{zoomControl:false,attributionControl:true,zoomSnap:.1,zoomDelta:.5,keyboard:false});
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);}
function setCap(s){capBox.classList.remove('hide');capT.textContent=s.t;capS.textContent=s.s;
 capBox.classList.remove('in');void capBox.offsetWidth;capBox.classList.add('in')}
function dropPin(){pin=L.marker(mode.church,{icon:divIcon('ks-pin','<span class="ks-pin-i">♥</span>',44,48),keyboard:false,zIndexOffset:900}).addTo(map);
 var el=pin.getElement();if(el)el.querySelector('.ks-pin').classList.add('drop')}
function arrive(){playing=false;cancelAnimationFrame(raf);bar.style.width='100%';
 setCap(mode.stops[mode.stops.length-1]);dropPin();
 if(REDUCE)map.setView(mode.church,mode.zEnd,{animate:false});
 else map.flyTo(mode.church,mode.zEnd,{duration:1.6});
 setTimeout(function(){arrival.classList.add('show');skip.classList.remove('show');capBox.classList.add('hide');
  if(window.confetti&&!REDUCE)confetti({particleCount:120,spread:85,origin:{y:.55},colors:['#6e0f1f','#d8bb8a','#f5efe0','#5f6b34'],scalar:1.05,zIndex:270})},1500)}
function frame(ts){if(!playing)return;
 var p=Math.min(1,(ts-t0)/mode.dur),e=ease(p);
 bar.style.width=(p*100).toFixed(1)+'%';
 var pos,z;
 if(mode.route){pos=posAt(e);car.setLatLng(pos);z=mode.zDrive+2.1*Math.min(1,p*1.6);map.setView(pos,z,{animate:false})}
 else{pos=[mode.start[0]+(mode.church[0]-mode.start[0])*e,mode.start[1]+(mode.church[1]-mode.start[1])*e];
  z=mode.zDrive+(mode.zEnd-mode.zDrive)*Math.pow(e,1.25);map.setView(pos,z,{animate:false})}
 mode.stops.forEach(function(s,i){if(p>=s.f&&!fired[i]){fired[i]=1;setCap(s);
  if(mode.route&&s.f>0&&s.f<.999&&pos)wpDots.push(L.marker(pos,{icon:L.divIcon({className:'',html:'<div class="wp-dot"></div>',iconSize:[12,12],iconAnchor:[6,6]}),interactive:false}).addTo(map))}});
 if(p>=1){arrive();return}
 raf=requestAnimationFrame(frame)}
function startJourney(){beginBtn.classList.remove('show');arrival.classList.remove('show');skip.classList.add('show');clearLayers();
 if(mode.route){line=L.polyline(mode.route,{color:'#d8bb8a',weight:3.5,opacity:.9,dashArray:'1 9',lineCap:'round'}).addTo(map);
  mode._arc=arc(mode.route);
  car=L.marker(mode.route[0],{icon:divIcon('ride-car','🚗',40,44),keyboard:false,zIndexOffset:800}).addTo(map);
  map.setView(mode.route[0],mode.zDrive,{animate:false})}
 else map.setView(mode.start,mode.zDrive,{animate:false});
 t0=performance.now();playing=true;
 setTimeout(function(){raf=requestAnimationFrame(frame)},700)}
function open(key){mode=V[key];initMap();map.invalidateSize();
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
 else map.setView(mode.start,mode.zDrive);
 setTimeout(function(){beginBtn.classList.add('show')},450)}
function close(){cancelAnimationFrame(raf);playing=false;modal.classList.remove('open');
 document.documentElement.classList.remove('ks-lock');window.lenis&&window.lenis.start()}
beginBtn.addEventListener('click',startJourney);
again.addEventListener('click',startJourney);
skip.addEventListener('click',function(){t0=-1e12});
$('jClose').addEventListener('click',close);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))close()});
var jbs=document.querySelectorAll('[data-journey]');
for(var i=0;i<jbs.length;i++)(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open(b.getAttribute('data-journey'))})})(jbs[i]);
window.addEventListener('resize',function(){if(modal.classList.contains('open'))map.invalidateSize()});
})();
