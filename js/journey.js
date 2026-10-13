/* Kalut-Shefa '26 · the journey — cute cartoon drive edition.
   The map is gone (Praise's verdict: it blinked and it wasn't cute).
   js/drive3d.js now paints the whole road: a low-poly world in the wedding
   palette, a well-dressed car, the real route beats as captions, and the
   couple's venue at the end. This file keeps the modal, the captions and
   the arrival card. */
(function(){
"use strict";
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(id){return document.getElementById(id)}
var modal=$('journeyModal');
if(!modal||!window.DRIVE3D) return;
var capT=$('jCapT'),capS=$('jCapS'),capBox=$('jCap'),bar=$('jBar'),beginBtn=$('jBegin'),
    arrival=$('jArrival'),skip=$('jSkip'),dirBtn=$('jDir'),mapBtn=$('jMapBtn'),
    again=$('jAgain'),arrName=$('jArrName'),arrAddr=$('jArrAddr'),hud=$('jHud'),
    jStart=$('jStart'),jSearch=$('jSearch'),jPlan=$('jPlan');
var liveKey='trad',state='idle';
function setCap(s){capBox.classList.remove('hide');capT.textContent=s.t;capS.textContent=s.s;
 capBox.classList.remove('in');void capBox.offsetWidth;capBox.classList.add('in')}
function showChooser(){if(jStart)jStart.classList.add('show')}
function hideChooser(){if(!jStart)return;jStart.classList.remove('show')}
function beginDrive(){
 if(state==='drive')return;
 hideChooser();beginBtn.classList.remove('show');arrival.classList.remove('show');skip.classList.add('show');
 capBox.classList.add('hide');state='drive';
 var area=(jSearch&&jSearch.value||'').trim();
 var saved=null;try{saved=localStorage.getItem('ks26area')}catch(e){}
 DRIVE3D.begin({key:liveKey,area:area||saved||'',start:true,
  setCap:setCap,
  onArrive:function(){
   state='arrived';skip.classList.remove('show');
   setTimeout(function(){
    arrival.classList.add('show');capBox.classList.add('hide');
    if(window.confetti&&!REDUCE)confetti({particleCount:130,spread:90,origin:{y:.55},
     colors:['#6e0f1f','#d8bb8a','#f5efe0','#5f6b34'],scalar:1.05,zIndex:270})},1400)}})}
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
 showChooser();beginBtn.textContent='Take the drive \u2728';
 modal.classList.add('open');document.documentElement.classList.add('ks-lock');
 window.lenis&&window.lenis.stop();
 DRIVE3D.begin({key:key,area:'',setCap:setCap,onArrive:null,start:false});
 state='idle';
 setTimeout(function(){if(state==='idle')beginBtn.classList.add('show')},350)}
function close(){
 DRIVE3D.dispose();state='idle';hideChooser();
 modal.classList.remove('open');document.documentElement.classList.remove('ks-lock');
 window.lenis&&window.lenis.start()}
beginBtn.addEventListener('click',beginDrive);
again.addEventListener('click',function(){arrival.classList.remove('show');beginDrive()});
skip.addEventListener('click',function(){DRIVE3D.skip()});
$('jClose').addEventListener('click',close);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))close()});
var jbs=document.querySelectorAll('[data-journey]');
for(var i=0;i<jbs.length;i++)(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open(b.getAttribute('data-journey'))})})(jbs[i]);
if(jSearch)jSearch.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();beginDrive()}});
if(jPlan)jPlan.addEventListener('click',function(){arrival.classList.remove('show');showChooser();beginBtn.classList.add('show')});
})();
