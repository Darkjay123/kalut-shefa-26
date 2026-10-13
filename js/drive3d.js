/* Kalut-Shefa '26 · the journey, reborn as a cute cartoon drive.
   No map tiles, nothing to blink: a hand-built low-poly 3D world in the
   wedding palette (burgundy, champagne gold, olive, cream), a well-dressed
   little car, the real road beats as captions, and the couple's venue at
   the end of the road. Three.js r149, vendored locally. */
(function(){
"use strict";
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var WEDDING={burgundy:0x6e0f1f,burgundyDeep:0x4a0a15,gold:0xd8bb8a,goldHot:0xe8cd96,cream:0xf5efe0,white:0xfdfaf3,olive:0x5f6b34,oliveDeep:0x46512a,leaf:0x6f7d3c,asphalt:0x3a2f33,dirt:0x9a7b4f,trunk:0x6b4a2f,skin:0x8a5a3b};
var V={
 trad:{
  eyebrow:"Traditional wedding \u00b7 Sat 21 Nov",
  title:"The road to Nimo",
  venueName:"Nwakor compound",
  venueAddr:"Uruezebaluchi village, Nimo, Anambra State. Behind Assumption Catholic Church (back of Igboka compound).",
  dirLink:"https://www.google.com/maps/dir/?api=1&destination=6.1606062%2C6.9934657&travelmode=driving",
  mapLink:"https://maps.google.com/?cid=2074764864072885148",
  dest:"Nimo", km:27, hudTail:"km to Nimo", banner:"NWAKOR COMPOUND", venue:"gate",
  stops:[
   {f:0,    t:"Upper Iweka, Onitsha", s:"Jump on the Old Road. Abagana first."},
   {f:.3,   t:"The Old Road",         s:"Windows down, gold light, good music."},
   {f:.5,   t:"Almost there",         s:"The goat has right of way. We wait."},
   {f:.75,  t:"Enugu-Ukwu junction",  s:"Ezi-Elias ahead. Turn right towards Nimo."},
   {f:.92,  t:"Nimo",                 s:"The compound lights are close now."},
   {f:1,    t:"Nwakor compound",      s:"Behind Assumption Catholic Church. You have arrived."}
  ]
 },
 white:{
  eyebrow:"White wedding \u00b7 Sat 28 Nov",
  title:"Into Abraka",
  venueName:"Gospel Stars Church",
  venueAddr:"No. 9 Gospel Stars Church Street, off Little London Road, Abraka, Delta State.",
  dirLink:"https://www.google.com/maps/dir/?api=1&destination=5.7852575%2C6.1158144&travelmode=driving",
  mapLink:"https://maps.google.com/?cid=12196887920809216468",
  dest:"Abraka", km:21, hudTail:"km to Abraka", banner:"GOSPEL STARS CHURCH", venue:"church",
  stops:[
   {f:0,   t:"Delta State, Nigeria",     s:"Somewhere in this state, a church is waiting."},
   {f:.35, t:"Into Abraka",              s:"The town slows down for the gate."},
   {f:.62, t:"Little London Road, Abraka",s:"Turn in here. Almost there."},
   {f:1,   t:"Gospel Stars Church",      s:"No. 9 Gospel Stars Church Street, Abraka. You have arrived."}
  ]
 }
};
var DUR=18000, GOAT_AT=.42;
/* speed profile: accelerate, cruise, decelerate -> distance fraction over time */
var SP=(function(){var n=300,A=.07,D=.12,dt=1/n,ys=[],sum=0,prev=0,i,p,v;
 for(i=1;i<=n;i++){p=i*dt;v=p<A?p/A:(p>1-D?(1-p)/D:1);sum+=(v+prev)/2*dt;prev=v;ys.push(sum)}
 var last=ys[n-1];for(i=0;i<n;i++)ys[i]/=last;return ys})();
function distFrac(p){var i=Math.max(0,Math.min(SP.length-1,Math.floor(p*SP.length)));return SP[i]}
var modal=document.getElementById('journeyModal'), mount=document.getElementById('jMap');
if(!modal||!mount||!window.THREE) return;
function $(id){return document.getElementById(id)}
var capT=$('jCapT'),capS=$('jCapS'),capBox=$('jCap'),bar=$('jBar'),beginBtn=$('jBegin'),arrival=$('jArrival'),skip=$('jSkip'),dirBtn=$('jDir'),mapBtn=$('jMapBtn'),again=$('jAgain'),arrName=$('jArrName'),arrAddr=$('jArrAddr'),hud=$('jHud');
var mode=null,liveKey='trad',engine=null,state='idle';
/* ---------- helpers ---------- */
function mat(c,opt){return new THREE.MeshLambertMaterial(Object.assign({color:c},opt||{}))}
function box(w,h,d,c,round){
 var g=new THREE.BoxGeometry(w,h,d);var m=new THREE.Mesh(g,mat(c));return m}
function cyn(rt,rb,h,c,seg){return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||8),mat(c))}
function textTex(lines,opts){
 opts=opts||{};
 var w=opts.w||512,h=opts.h||256,c=document.createElement('canvas');c.width=w;c.height=h;
 var x=c.getContext('2d');
 x.fillStyle=opts.bg||'#f5efe0';x.fillRect(0,0,w,h);
 if(opts.border){x.strokeStyle=opts.border;x.lineWidth=opts.bw||14;x.strokeRect(8,8,w-16,h-16)}
 x.fillStyle=opts.fg||'#6e0f1f';x.textAlign='center';x.textBaseline='middle';
 x.font=(opts.bold===false?'':'bold ')+(opts.size||44)+'px "DM Sans", "Trebuchet MS", sans-serif';
 for(var i=0;i<lines.length;i++)x.fillText(lines[i],w/2,h/2+(i-(lines.length-1)/2)*(opts.size+14));
 var t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
function heartTex(){
 var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');
 x.fillStyle='#b4283b';x.beginPath();
 x.moveTo(32,56);x.bezierCurveTo(8,40,4,26,4,18);x.bezierCurveTo(4,8,12,4,20,4);
 x.bezierCurveTo(26,4,30,8,32,12);x.bezierCurveTo(34,8,38,4,44,4);
 x.bezierCurveTo(52,4,60,8,60,18);x.bezierCurveTo(60,26,56,40,32,56);x.fill();
 return new THREE.CanvasTexture(c)}
/* ---------- the world ---------- */
function Drive(key){
 this.key=key;this.mode=V[key];this.build()}
Drive.prototype.build=function(){
 var self=this;
 this.SMALL=Math.min(window.innerWidth||9999,window.innerHeight||9999)<500;
 this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 this.renderer.outputEncoding=THREE.sRGBEncoding;
 mount.innerHTML='';mount.appendChild(this.renderer.domElement);
 this.scene=new THREE.Scene();
 /* sky: champagne dusk painted as a gradient texture */
 var sc=document.createElement('canvas');sc.width=2;sc.height=256;var sx=sc.getContext('2d');
 var gr=sx.createLinearGradient(0,0,0,256);
 gr.addColorStop(0,'#f7e8d2');gr.addColorStop(.45,'#f3d9b8');gr.addColorStop(.8,'#efd0ac');gr.addColorStop(1,'#e7c39a');
 sx.fillStyle=gr;sx.fillRect(0,0,2,256);
 var skyT=new THREE.CanvasTexture(sc);
 this.scene.background=skyT;
 this.scene.fog=new THREE.Fog(0xf0d6b2,90,340);
 this.camera=new THREE.PerspectiveCamera(55,mount.clientWidth/Math.max(1,mount.clientHeight),.1,600);
 this.scene.add(new THREE.HemisphereLight(0xfff3dd,0x545c2e,.95));
 var sun=new THREE.DirectionalLight(0xffe1b0,.85);sun.position.set(-60,80,-40);this.scene.add(sun);
 /* the road: an S-curve the car never leaves */
 var pts=[[0,0],[4,55],[-8,125],[6,205],[-6,285],[8,360],[-2,435],[0,495],[0,540]];
 this.curve=new THREE.CatmullRomCurve3(pts.map(function(p){return new THREE.Vector3(p[0],0,p[1])}));
 this.len=this.curve.getLength();
 this.ROAD_END=this.len-14; /* car stops short of the gate */
 this.buildRoad();this.buildGround();this.buildScenery();this.buildVenue();this.buildCar();this.buildGoat();this.buildPuffs();
 this.u=0;this.state='attract';this.attractT=0;this.capFired=[];this.goatDone=false;
 this.camPos=new THREE.Vector3();this.camAim=new THREE.Vector3();
 this.clock=new THREE.Clock();
 var self2=this;this.raf=null;
 this.loop=function(ts){self2.frame()};this.raf=requestAnimationFrame(this.loop);
 window.addEventListener('resize',this.onR=function(){self.resize()});};
Drive.prototype.roadPoint=function(d){
 var u=Math.max(0,Math.min(.9995,d/this.len));
 return this.curve.getPointAt(u)};
Drive.prototype.roadDir=function(d){
 var u=Math.max(0,Math.min(.9995,d/this.len));
 return this.curve.getTangentAt(u)};

Drive.prototype.buildRoad=function(){
 var self=this,N=260,w=4.2,pts=[],i;
 for(i=0;i<=N;i++){var u=i/N,c=this.curve.getPointAt(u),t=this.curve.getTangentAt(u);
  var nx=-t.z,nz=t.x; /* normal in XZ */
  pts.push(new THREE.Vector3(c.x+nx*w,0.02,c.z+nz*w));
  pts.push(new THREE.Vector3(c.x-nx*w,0.02,c.z-nz*w))}
 var g=new THREE.BufferGeometry(),verts=[],idx=[];
 for(i=0;i<pts.length;i++)verts.push(pts[i].x,pts[i].y,pts[i].z);
 for(i=0;i<N;i++){var a=2*i,b=2*i+1,c2=2*i+2,d2=2*i+3;idx.push(a,c2,b,b,c2,d2)}
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();
 var road=new THREE.Mesh(g,mat(WEDDING.asphalt));this.scene.add(road);
 /* cream shoulders + gold dashes */
 var self2=this,step=4.5,dd;
 for(dd=2;dd<this.len;dd+=step){
  var p=this.roadPoint(dd),t=this.roadDir(dd),nx=-t.z,nz=t.x;
  var dash=new THREE.Mesh(new THREE.BoxGeometry(.34,.02,2.2),mat(WEDDING.goldHot));
  dash.position.set(p.x,.05,p.z);dash.rotation.y=Math.atan2(t.x,t.z);this.scene.add(dash);
  if(Math.round(dd/step)%3===0){
   var l=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,1.4),mat(WEDDING.cream));
   l.position.set(p.x+nx*(w+.35),.04,p.z+nz*(w+.35));l.rotation.y=Math.atan2(t.x,t.z);this.scene.add(l);
   var r=l.clone();r.position.set(p.x-nx*(w+.35),.04,p.z-nz*(w+.35));this.scene.add(r)}}
};
Drive.prototype.buildGround=function(){
 var g=new THREE.Mesh(new THREE.CircleGeometry(420,40),mat(WEDDING.olive));
 g.rotation.x=-Math.PI/2;g.position.y=-.06;g.scene=this.scene;this.scene.add(g);
 var far=new THREE.Mesh(new THREE.CircleGeometry(560,40),mat(WEDDING.oliveDeep));
 far.rotation.x=-Math.PI/2;far.position.y=-.14;this.scene.add(far);
 /* rolling hills on the horizon */
 var hills=[[180,120],[240,60],[-220,80],[-150,200],[120,260],[-60,320],[200,300],[-260,-60],[90,-180]];
 var hh=this;hills.forEach(function(p,i){
  var h=new THREE.Mesh(new THREE.SphereGeometry(34+(i%3)*14,7,5),mat(i%2?WEDDING.oliveDeep:WEDDING.olive));
  h.scale.y=.42;h.position.set(p[0],-6,p[1]);hh.scene.add(h)})};
Drive.prototype.tree=function(x,z,s,palm){
 var g=new THREE.Group();
 if(palm){
  var tr=cyn(.14,.22,4.6,WEDDING.trunk,6);tr.position.y=2.3;tr.rotation.z=.08;g.add(tr);
  var fr,i;for(i=0;i<6;i++){var f=new THREE.Mesh(new THREE.ConeGeometry(.5,2.6,4),mat(i%2?WEDDING.leaf:WEDDING.olive));
   f.position.set(Math.cos(i)*1.1,4.7,Math.sin(i)*1.1);f.rotation.z=Math.cos(i)*.9;f.rotation.x=Math.sin(i)*.9;g.add(f)}}
 else{
  var tr2=cyn(.18,.28,1.6,WEDDING.trunk,6);tr2.position.y=.8;g.add(tr2);
  var c1=new THREE.Mesh(new THREE.ConeGeometry(1.5,2.6,7),mat(WEDDING.olive));c1.position.y=2.6;g.add(c1);
  var c2=new THREE.Mesh(new THREE.ConeGeometry(1.1,2.1,7),mat(WEDDING.leaf));c2.position.y=3.7;g.add(c2)}
 g.position.set(x,0,z);if(s)g.scale.setScalar(s);
 g.rotation.y=Math.random()*6.28;this.scene.add(g);return g};
Drive.prototype.house=function(x,z,ry,roofC){
 var g=new THREE.Group();
 var body=box(4.4,2.4,3.6,WEDDING.cream);body.position.y=1.2;g.add(body);
 var roof=new THREE.Mesh(new THREE.ConeGeometry(3.6,1.9,4),mat(roofC||WEDDING.burgundy));
 roof.position.y=3.25;roof.rotation.y=Math.PI/4;g.add(roof);
 var door=box(.9,1.4,.1,WEDDING.burgundyDeep);door.position.set(0,.7,1.85);g.add(door);
 var win=box(1.1,.9,.1,WEDDING.goldHot);win.position.set(1.4,1.5,1.85);g.add(win);
 var win2=win.clone();win2.position.x=-1.4;g.add(win2);
 g.position.set(x,0,z);g.rotation.y=ry||0;this.scene.add(g);return g};
Drive.prototype.buildScenery=function(){
 var self=this,i,d,STEP=11;
 for(d=10;d<this.len-30;d+=STEP){
  var p=this.roadPoint(d),t=this.roadDir(d),nx=-t.z,nz=t.x,side=(Math.round(d/STEP)%2?1:-1);
  var off=8+Math.random()*14,x=p.x+nx*off*side,z=p.z+nz*off*side,r=Math.random();
  if(r<.42)this.tree(x,z,.8+Math.random()*.7,false);
  else if(r<.62)this.tree(x,z,.85+Math.random()*.5,true);
  else if(r<.74&&d>this.len*.18&&d<this.len*.75)this.house(x,z,t.x>0?Math.PI/2:-Math.PI/2,Math.random()<.5?WEDDING.burgundy:WEDDING.goldHot);
  else{var b=new THREE.Mesh(new THREE.SphereGeometry(.7,6,5),mat(WEDDING.oliveDeep));b.position.set(x,.3,z);b.scale.y=.7;this.scene.add(b)}}
 /* welcome flowers near the venue */
 for(d=this.len-46;d<this.len-16;d+=3){
  var pv=this.roadPoint(d),tv=this.roadDir(d),nvx=-tv.z,nvz=tv.x;
  [[1],[-1]].forEach(function(s){
   var fl=new THREE.Mesh(new THREE.SphereGeometry(.24,5,4),mat(Math.random()<.5?WEDDING.burgundy:WEDDING.goldHot));
   fl.position.set(pv.x+nvx*(5.6+Math.random()*2)*s[0],.25,pv.z+nvz*(5.6+Math.random()*2)*s[0]);self.scene.add(fl)})}
};
Drive.prototype.balloonCluster=function(x,y,z,n){
 var g=new THREE.Group(),cols=[WEDDING.burgundy,WEDDING.goldHot,WEDDING.cream,WEDDING.burgundyDeep],i;
 for(i=0;i<n;i++){
  var b=new THREE.Mesh(new THREE.SphereGeometry(.34,7,6),mat(cols[i%cols.length]));
  b.position.set((Math.random()-.5)*1.1,y+i*.34+(Math.random()-.5)*.2,(Math.random()-.5)*1.1);g.add(b)}
 g.position.set(x,0,z);this.scene.add(g);return g};
Drive.prototype.sign=function(x,z,ry,tex,w,h,yBase){
 var g=new THREE.Group();
 var post=cyn(.09,.09,h,WEDDING.trunk,6);post.position.y=h/2;g.add(post);
 var face=new THREE.Mesh(new THREE.PlaneGeometry(w,h*.5),new THREE.MeshBasicMaterial({map:tex}));
 face.position.y=h*.72;if(ry!==0)face.rotation.y=ry;g.add(face);
 var face2=face.clone();face2.rotation.y=ry+Math.PI;g.add(face2);
 g.position.set(x,0,z);this.scene.add(g);return g};
Drive.prototype.buildVenue=function(){
 var self=this,end=this.curve.getPointAt(.9995),t=this.curve.getTangentAt(.9995),nx=-t.z,nz=t.x,g=new THREE.Group();
 if(this.mode.venue==='gate'){
  [[-5.2],[5.2]].forEach(function(s){
   var pillar=box(1.5,4.6,1.5,WEDDING.cream);pillar.position.set(end.x+nx*s[0],2.3,end.z+nz*s[0]);self.scene.add(pillar);
   var cap=box(1.9,.5,1.9,WEDDING.goldHot);cap.position.set(end.x+nx*s[0],4.75,end.z+nz*s[0]);self.scene.add(cap);
   self.balloonCluster(end.x+nx*s[0],5.1,end.z+nz*s[0],7)});
  var beam=new THREE.Mesh(new THREE.BoxGeometry(11.6,.9,.7),mat(WEDDING.cream));
  beam.position.set(end.x,5.35,end.z);beam.rotation.y=Math.atan2(nx,nz)+Math.PI/2;this.scene.add(beam);
  var ban=new THREE.Mesh(new THREE.PlaneGeometry(9.4,.8),new THREE.MeshBasicMaterial({map:textTex([this.mode.banner],{size:52,fg:'#6e0f1f',bg:'#f5efe0'})}));
  ban.position.set(end.x,5.35,end.z);ban.rotation.y=Math.atan2(nx,nz);this.scene.add(ban);
  var ban2=ban.clone();ban2.rotation.y=Math.atan2(nx,nz)+Math.PI;this.scene.add(ban2);
  /* red carpet through the gate */
  var carp=this.roadPoint(this.len-9),carpT=this.roadDir(this.len-9);
  var carpet=new THREE.Mesh(new THREE.PlaneGeometry(6,9),mat(WEDDING.burgundy));
  carpet.rotation.x=-Math.PI/2;carpet.rotation.z=-Math.atan2(carpT.x,carpT.z);
  carpet.position.set(carp.x,.03,carp.z);this.scene.add(carpet);
  this.tree(end.x+nx*13,end.z+nz*13,1.2,true);this.tree(end.x-nx*13,end.z-nz*13,1.2,true);
  this.tree(end.x+nx*18,end.z+nz*18,1,false);this.tree(end.x-nx*18,end.z-nz*18,1.1,false)}
 else{
  var ch=new THREE.Group();
  var nave=box(9,4.2,7,WEDDING.white);nave.position.y=2.1;ch.add(nave);
  var roof=new THREE.Mesh(new THREE.CylinderGeometry(4.9,4.9,8.6,3,1),mat(WEDDING.cream));
  roof.rotation.z=Math.PI/2;roof.rotation.y=Math.PI/2;roof.scale.y=.62;roof.position.y=4.9;ch.add(roof);
  var tower=box(2.6,6.4,2.6,WEDDING.white);tower.position.set(0,3.2,4.6);ch.add(tower);
  var steeple=new THREE.Mesh(new THREE.ConeGeometry(2,2.6,4),mat(WEDDING.burgundy));steeple.position.set(0,7.7,4.6);steeple.rotation.y=Math.PI/4;ch.add(steeple);
  var crossM=new THREE.Mesh(new THREE.BoxGeometry(.16,1.5,.16),mat(WEDDING.goldHot));crossM.position.set(0,9.6,4.6);ch.add(crossM);
  var crossT=new THREE.Mesh(new THREE.BoxGeometry(.8,.16,.16),mat(WEDDING.goldHot));crossT.position.set(0,9.9,4.6);ch.add(crossT);
  var door=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.6,.2),mat(WEDDING.burgundy));door.position.set(0,1.3,5.95);ch.add(door);
  var win=new THREE.Mesh(new THREE.CircleGeometry(.7,8),new THREE.MeshBasicMaterial({color:WEDDING.goldHot}));
  win.position.set(0,3.4,6.01);ch.add(win);
  ch.position.set(end.x,0,end.z);ch.rotation.y=Math.atan2(t.x,t.z);this.scene.add(ch);
  this.balloonCluster(end.x+nx*6.5,1.2,end.z+nz*6.5,8);this.balloonCluster(end.x-nx*6.5,1.2,end.z-nz*6.5,8);
  var bb=new THREE.Mesh(new THREE.PlaneGeometry(7.6,.8),new THREE.MeshBasicMaterial({map:textTex([this.mode.banner],{size:46,fg:'#f5efe0',bg:'#6e0f1f'})}));
  bb.position.set(end.x+nx*8.5,2.6,end.z+nz*8.5);bb.rotation.y=Math.atan2(nx,nz)-Math.PI/2;this.scene.add(bb);
  this.tree(end.x+nx*16,end.z+nz*16,1.1,false);this.tree(end.x-nx*16,end.z-nz*16,1.1,false)}
 /* guest's home-town sign near the start */
 var sp=this.roadPoint(26),st=this.roadDir(26),snx=-st.z,snz=st.x;
 this.areaSign=this.sign(sp.x+snx*6.4,sp.z+snz*6.4,Math.atan2(snx,snz),
  textTex(["THIS WAY","TO "+this.mode.dest.toUpperCase()+" \u279c"],{size:40,fg:'#f5efe0',bg:'#6e0f1f',border:'#d8bb8a',bw:10}),3.4,1.9,1.2);
};
Drive.prototype.buildCar=function(){
 var g=new THREE.Group(),self=this;
 var body=box(2.1,.75,4.1,WEDDING.burgundy);body.position.y=.72;g.add(body);
 var hood=box(1.9,.5,.9,WEDDING.burgundyDeep);hood.position.set(0,.95,1.7);g.add(hood);
 var cabin=box(1.75,.72,2.1,WEDDING.white);cabin.position.set(0,1.42,-.25);g.add(cabin);
 var glass=box(1.6,.5,.1,0x2a1a20);glass.position.set(0,1.45,.82);g.add(glass);
 [[.85,1.35],[-.85,1.35],[.85,-1.35],[-.85,-1.35]].forEach(function(w){
  var wh=cyn(.42,.42,.3,0x241d20,10);wh.rotation.z=Math.PI/2;wh.position.set(w[0],.42,w[1]);g.add(wh);
  var hub=cyn(.2,.2,.32,WEDDING.goldHot,8);hub.rotation.z=Math.PI/2;hub.position.set(w[0],.42,w[1]);g.add(hub);
  (self.wheels=self.wheels||[]).push(wh,hub)});
 var bump=box(2.0,.3,.2,WEDDING.goldHot);bump.position.set(0,.5,2.05);g.add(bump);
 var bump2=bump.clone();bump2.position.z=-2.05;g.add(bump2);
 var hl=new THREE.Mesh(new THREE.SphereGeometry(.14,6,6),new THREE.MeshBasicMaterial({color:0xfff2cf}));
 hl.position.set(.7,.85,2.12);g.add(hl);var hl2=hl.clone();hl2.position.x=-.7;g.add(hl2);
 /* the bow on the roof */
 var bow=new THREE.Group(),bm=mat(WEDDING.goldHot);
 var bl=new THREE.Mesh(new THREE.SphereGeometry(.24,6,5),bm);bl.scale.set(1.3,.7,.9);bl.position.x=-.26;bow.add(bl);
 var br=bl.clone();br.position.x=.26;bow.add(br);
 var knot=new THREE.Mesh(new THREE.SphereGeometry(.13,6,5),bm);bow.add(knot);
 bow.position.set(0,1.95,-.25);g.add(bow);
 /* blob shadow */
 var sh=new THREE.Mesh(new THREE.CircleGeometry(1.7,16),new THREE.MeshBasicMaterial({color:0x2a0c12,transparent:true,opacity:.28}));
 sh.rotation.x=-Math.PI/2;sh.position.y=.03;g.add(sh);
 this.scene.add(g);this.car=g};
Drive.prototype.buildGoat=function(){
 var g=new THREE.Group();
 var body=box(1.05,.55,.5,0xf3ead8);body.position.y=.55;g.add(body);
 var head=box(.42,.4,.36,0xf3ead8);head.position.set(.68,.78,0);g.add(head);
 var horn=cyn(.03,.05,.3,0xbfa374,5);horn.position.set(.78,1.05,.12);horn.rotation.z=-.5;g.add(horn);
 var horn2=horn.clone();horn2.position.z=-.12;g.add(horn2);
 var leg,i;for(i=0;i<4;i++){leg=box(.1,.42,.1,0xd9cbb2);leg.position.set((i<2?.35:-.35),.21,(i%2?.16:-.16));g.add(leg)}
 var spot=box(.4,.3,.06,WEDDING.burgundyDeep);spot.position.set(0,.62,.27);g.add(spot);
 g.visible=false;this.scene.add(g);this.goat=g;this.goatSide=1};
Drive.prototype.runGoat=function(dt,dist){
 if(this.goatT>=1.9){this.goat.visible=false;return}
 this.goatT+=dt;
 var gdir=this.roadDir(Math.min(this.len-6,dist+60));
 var gp=this.roadPoint(Math.min(this.len-6,dist+60));
 var across=(this.goatT/1.9-.5)*18;
 this.goat.position.set(gp.x-gdir.z*across*this.goatSide,0,gp.z+gdir.x*across*this.goatSide);
 this.goat.rotation.y=Math.atan2(gdir.x,gdir.z)+(this.goatSide>0?Math.PI/2:-Math.PI/2);
 this.goat.visible=true;
 var hop=(this.goatT*7)%2;this.goat.position.y=hop<1?.05*hop:.05*(2-hop)};
Drive.prototype.buildPuffs=function(){
 var tex=heartTex(),i,self=this;
 this.puffs=[];
 for(i=0;i<10;i++){
  var s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:0}));
  s.scale.setScalar(.5);this.scene.add(s);this.puffs.push({s:s,t:-1})}};

/* ---------- animation ---------- */
Drive.prototype.capPose=function(){
 var self=this,c=this.curve.getPointAt(.9995),t=this.curve.getTangentAt(.9995),nx=-t.z,nz=t.x;
 return new THREE.Vector3(c.x+nx*16,26,c.z+nz*16)};
Drive.prototype.attract=function(dt){
 var self=this,t=this.attractT+=dt,a=Math.sin(t*.16)*.5;
 var look=this.roadPoint(this.len*.82);
 this.camera.position.lerp(new THREE.Vector3(look.x+Math.sin(a)*30,14+Math.sin(t*.09)*3,look.z-Math.cos(a)*30),.02);
 this.camera.lookAt(look.x,2,look.z)};
Drive.prototype.frame=function(){
 var self=this;
 try{if(!this.paused&&!document.hidden)this.tick(Math.min(this.clock.getDelta(),.1))}
 catch(e){/* one bad frame must never freeze the drive */}
 this.renderer.render(this.scene,this.camera);
 this.raf=requestAnimationFrame(this.loop)};
Drive.prototype.tick=function(dt){
 var self=this,dur=this.dur||DUR;
 if(this.state==='attract'){this.attract(dt);return}
 if(this.state!=='drive')return;
 this.t+=dt*1000;
 var p=Math.min(1,this.t/dur),d=distFrac(p),dist=d*this.ROAD_END;
 var pos=this.roadPoint(dist),dir=this.roadDir(dist),nx=-dir.z,nz=dir.x;
 /* car: heading + bob + curve lean */
 var roll=0;
 if(this.prevDir){var dotc=THREE.MathUtils.clamp(this.prevDir.dot(dir),-1,1);roll=THREE.MathUtils.clamp((Math.asin(dotc))*6,-.14,.14)}
 this.prevDir=dir.clone();
 var heading=Math.atan2(dir.x,dir.z);
 this.car.position.set(pos.x,.06+Math.sin(this.t/120)*.03,pos.z);
 this.car.rotation.y=heading;this.car.rotation.x=0;this.car.rotation.z=roll;
 var spin=dt*26*(1-p*.35);this.wheels.forEach(function(w){w.rotation.x+=spin});
 /* goat: trots across the road just past mid-journey */
 if(!this.goatDone&&d>=GOAT_AT){this.goatDone=true;this.goatT=0}
 if(this.goatDone)this.runGoat(dt,dist);
 /* chase camera with lag and breathing: parked BEHIND the car */
 var back=9.5,height=4.6;
 var camAt=this.roadPoint(Math.max(0,dist-back));
 var desired=new THREE.Vector3(camAt.x+nx*1.1,height,camAt.z+nz*1.1);
 this.camPos.lerp(desired,.055);
 var aim=this.roadPoint(Math.min(this.len,dist+26));
 this.camAim.lerp(new THREE.Vector3(aim.x,1.6,aim.z),.08);
 var breathe=Math.sin(this.t/460)*.14;
 this.camera.position.set(this.camPos.x,this.camPos.y+breathe,this.camPos.z);
 this.camera.lookAt(this.camAim);
 /* arrival sweep: rise to frame the gate */
 if(p>.94){var k=(p-.94)/.06;
  this.camera.position.y+=k*3.2*k;this.camera.position.x-=dir.x*k*2.4;this.camera.position.z-=dir.z*k*2.4}
 /* heart puffs from the exhaust */
 if(Math.random()<.12){for(var qi=0;qi<this.puffs.length;qi++){var q=this.puffs[qi];
  if(q.t<0){q.t=0;q.s.position.set(pos.x-dir.x*2.2+ (Math.random()-.5)*.4,.5,pos.z-dir.z*2.2);break}}}
 for(var pi=0;pi<this.puffs.length;pi++){var pp2=this.puffs[pi];
  if(pp2.t>=0){pp2.t+=dt;var f2=pp2.t/1.6;
   pp2.s.position.y+=dt*1.1;pp2.s.position.x+=dt*.5*(pp2.s.position.x>pos.x?1:-1)*.3;
   pp2.s.material.opacity=Math.max(0,1-f2)*.85;pp2.s.scale.setScalar(.35+f2*.5);
   if(f2>=1){pp2.t=-1;pp2.s.material.opacity=0}}}
 /* progress, hud, captions */
 if(bar)bar.style.width=(d*100).toFixed(1)+'%';
 if(hud){hud.textContent=Math.max(0,Math.round((1-d)*this.mode.km))+' '+this.mode.hudTail+' \u2661';hud.classList.add('show')}
 for(var si=0;si<this.mode.stops.length;si++){var s=this.mode.stops[si];
  if(p>=s.f&&si>=this.mode.stops.length-1){}
  if(p>=s.f&&!this.capFired[si]){this.capFired[si]=1;if(setCap)setCap(s)}}
 if(p>=1){this.arrive()}};
Drive.prototype.begin=function(area){
 if(this.state==='drive')return;
 if(area)try{localStorage.setItem('ks26area',area)}catch(e){}
 this.dur=DUR;this.t=0;this.state='drive';this.capFired=[];this.goatDone=false;this.goatT=0;
 /* sign carries the guest's town */
 if(area&&this.areaSign){
  var tex=textTex([area.toUpperCase()+" \u279c "+this.mode.dest.toUpperCase()],{size:44,fg:'#f5efe0',bg:'#6e0f1f',border:'#d8bb8a',bw:10});
  this.areaSign.children[1].material.map=tex;this.areaSign.children[2].material.map=tex}
 this.clock.getDelta()};
Drive.prototype.skip=function(){if(this.state!=='drive'){if(this.state==='attract')this.begin();else return}
 this.t=(this.dur||DUR)+1};
Drive.prototype.restart=function(){this.state='drive';this.t=0;this.capFired=[];this.goatDone=false;this.goatT=0;this.clock.getDelta()};
Drive.prototype.arrive=function(){
 var self=this;
 if(this.state==='arrived')return;this.state='arrived';
 if(hud)hud.classList.remove('show');
 if(bar)bar.style.width='100%';
 if(setCap)setCap(this.mode.stops[this.mode.stops.length-1]);
 /* the car glides the last stretch and rests at the gate */
 var rest=this.roadPoint(this.ROAD_END),rt=this.roadDir(this.ROAD_END);
 this.car.position.set(rest.x,.06,rest.z);this.car.rotation.y=Math.atan2(rt.x,rt.z);
 /* camera: rise into a beauty shot of the venue */
 var end=this.curve.getPointAt(.9995),t=this.curve.getTangentAt(.9995),nx=-t.z,nz=t.x;
 this.camAimT=new THREE.Vector3(end.x,2.5,end.z);
 this.camT=new THREE.Vector3(end.x-dir.x*0-nx*0+(t.x*0),7.5,end.z-t.z*13);
 if(onArrive)onArrive()};
Drive.prototype.resize=function(){
 if(!this.camera)return;
 this.camera.aspect=mount.clientWidth/Math.max(1,mount.clientHeight);
 this.camera.updateProjectionMatrix();this.renderer.setSize(mount.clientWidth,mount.clientHeight)};
Drive.prototype.destroy=function(){
 cancelAnimationFrame(this.raf);window.removeEventListener('resize',this.onR);
 mount.innerHTML='';this.renderer.dispose()};
/* camera arrival beauty shot: smoothed toward the venue */
var camAimT=null,camT=null;
Drive.prototype.arriveRest=function(dt){
};
/* ---------- journey.js facing API ---------- */
var onArrive=null,setCap=null;
window.DRIVE3D={
 begin:function(opts){
  opts=opts||{};onArrive=opts.onArrive||null;setCap=opts.setCap||null;
  if(!engine||engine.key!==opts.key){if(engine)engine.destroy();engine=new Drive(opts.key)}
  if(REDUCE&&opts.start){engine.begin(opts.area);engine.skip();engine.resize();return}
  if(opts.start)engine.begin(opts.area);
  else{engine.state='attract';engine.attractT=0}
  engine.resize()},
 skip:function(){if(engine)engine.skip()},
 restart:function(){if(engine)engine.restart()},
 dispose:function(){if(engine){engine.destroy();engine=null}},
 active:function(){return !!engine}
};
})();
