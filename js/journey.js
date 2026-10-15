/* Kalut-Shefa '26 · the journey — cartoon-film drive edition.
   Tap the card, the drive starts. Skip lands you at the door with directions.
   js/drive3d.js paints the world: cel-shaded palette world, Kenney assets,
   drifting clouds, the well-dressed car, the venue at the end of the road. */
(function(){
"use strict";
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(id){return document.getElementById(id)}
var modal=$('journeyModal');
if(!modal||!window.DRIVE3D) return;
var capT=$('jCapT'),capS=$('jCapS'),capBox=$('jCap'),bar=$('jBar'),beginBtn=$('jBegin'),
    arrival=$('jArrival'),skip=$('jSkip'),dirBtn=$('jDir'),mapBtn=$('jMapBtn'),
    again=$('jAgain'),arrName=$('jArrName'),arrAddr=$('jArrAddr'),hud=$('jHud'),jPlan=$('jPlan');
var liveKey='trad',state='idle',jSnd=$('jSound');
function setCap(s){capBox.classList.remove('hide');capT.textContent=s.t;capS.textContent=s.s;
 capBox.classList.remove('in');void capBox.offsetWidth;capBox.classList.add('in')}
function beginDrive(){
 modal.classList.add('film');
 var ft=$('jFilmTitle');
 if(ft)ft.textContent=(liveKey==='trad')?'The road to Nimo':'Into Abraka';
 clearTimeout(beginDrive._ft);
 beginDrive._ft=setTimeout(function(){modal.classList.remove('film-title')},3200);
 modal.classList.add('film-title');
 if(state==='drive')return;
 beginBtn.classList.remove('show');arrival.classList.remove('show');skip.classList.add('show');
 capBox.classList.add('hide');state='drive';
 DRIVE3D.begin({key:liveKey,area:'',start:true,
  setCap:setCap,
  onArrive:function(){
   state='arrived';skip.classList.remove('show');modal.classList.remove('film');
   var ft=$('jFilmTitle');
   if(ft){ft.textContent='You have arrived';modal.classList.add('film-title');
    clearTimeout(beginDrive._at);beginDrive._at=setTimeout(function(){modal.classList.remove('film-title')},3200)}
   setTimeout(function(){
    arrival.classList.add('show');capBox.classList.add('hide');
    if(window.confetti&&!REDUCE)confetti({particleCount:130,spread:90,origin:{y:.55},
     colors:['#6e0f1f','#d8bb8a','#f5efe0','#5f6b34'],scalar:1.05,zIndex:270})},900)}})}
function open(key){
 liveKey=key;state='idle';
 $('jEyebrow').textContent=key==='trad'?'Traditional wedding \u00b7 Sat 21 Nov':'White wedding \u00b7 Sat 28 Nov';
 $('jTitle').textContent=key==='trad'?'The road to Nimo':'Into Abraka';
 arrName.textContent=key==='trad'?'Nwakor compound':'Gospel Stars Church';
 arrAddr.textContent=key==='trad'
  ?'Uruezebaluchi village, Nimo, Anambra State. Behind Assumption Catholic Church (back of Igboka compound).'
  :'No. 9 Gospel Stars Church Street, off Little London Road, Abraka, Delta State.';
 dirBtn.href=key==='trad'
  ?'https://www.google.com/maps/dir/?api=1&destination=6.1606062%2C6.9934657&travelmode=driving'
  :'https://www.google.com/maps/dir/?api=1&destination=5.7852575%2C6.1158144&travelmode=driving';
 mapBtn.href=key==='trad'?'https://maps.google.com/?cid=2074764864072885148':'https://maps.google.com/?cid=12196887920809216468';
 capBox.classList.add('hide');arrival.classList.remove('show');skip.classList.remove('show');
 if(hud)hud.classList.remove('show');
 if(bar)bar.style.width='0%';
 modal.classList.add('open');document.documentElement.classList.add('ks-lock');
 window.lenis&&window.lenis.stop();
 var sndOn=true;try{sndOn=localStorage.getItem('ks26sound')!=='0'}catch(e){}
 if(jSnd)jSnd.classList.toggle('off',!sndOn);
 DRIVE3D.begin({key:key,area:'',setCap:setCap,onArrive:null,start:false});
 state='idle';
 /* straight to the drive: no questions, just the road */
 setTimeout(function(){if(state==='idle')beginDrive()},750)}
function close(){
 modal.classList.remove('film');modal.classList.remove('film-title');
 DRIVE3D.dispose();state='idle';
 modal.classList.remove('open');document.documentElement.classList.remove('ks-lock');
 window.lenis&&window.lenis.start()}
beginBtn.addEventListener('click',beginDrive);
again.addEventListener('click',function(){arrival.classList.remove('show');state='idle';beginDrive()});
skip.addEventListener('click',function(){DRIVE3D.skip()});
if(jSnd)jSnd.addEventListener('click',function(){
 var on=!jSnd.classList.toggle('off');
 try{localStorage.setItem('ks26sound',on?'1':'0')}catch(e){}
 DRIVE3D.setSound(on)});
$('jClose').addEventListener('click',close);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))close()});
var jbs=document.querySelectorAll('[data-journey]');
for(var i=0;i<jbs.length;i++)(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open(b.getAttribute('data-journey'))})})(jbs[i]);
if(jPlan)jPlan.addEventListener('click',function(){arrival.classList.remove('show');state='idle';beginDrive()});
})();
