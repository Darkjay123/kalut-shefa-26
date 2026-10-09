/* Kalut-Shefa '26 · Elijah & Mary-Ann */
(function(){
const C = window.KS_CONFIG || {};
const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const isTouch = matchMedia('(hover:none)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!window.gsap;
if(hasGsap && !reduce) document.documentElement.classList.add('js-anim');

/* ---------- backend: Vercel API + Upstash ---------- */
function visitorId(){
  let id = localStorage.getItem('ks_vid'); let isNew = false;
  if(!id){ id = (crypto.randomUUID ? crypto.randomUUID() : Date.now()+'-'+Math.random().toString(36).slice(2)); localStorage.setItem('ks_vid',id); isNew=true; }
  return {id,isNew};
}
const API={visits:'/api/visit',rsvps:'/api/rsvp',gifts:'/api/gift'};
async function save(table,row){
  const r=await fetch(API[table],{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(row),keepalive:table==='visits'});
  const d=await r.json().catch(()=>({})); if(!r.ok||!d.ok) throw new Error(d.error||('HTTP '+r.status)); return 'live';
}
(function trackVisit(){
  const v = visitorId(); const p = new URLSearchParams(location.search);
  const ua = navigator.userAgent; const device = /iPad|Tablet/i.test(ua)?'tablet':(/Mobi|Android|iPhone/i.test(ua)?'mobile':'desktop');
  if(sessionStorage.getItem('ks_tracked')) return; sessionStorage.setItem('ks_tracked','1');
  save('visits',{visitor_id:v.id,is_new:v.isNew,referrer:document.referrer||null,device,utm_source:p.get('utm_source')||p.get('ref')||null}).catch(e=>console.warn('visit',e));
})();

/* ---------- toast ---------- */
const toast=(m)=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600);};
const fire=(o={})=>{ if(window.confetti && !reduce) confetti({particleCount:140,spread:90,startVelocity:45,colors:['#6e0f1f','#d8bb8a','#f1dfbd','#5f6b34','#ffffff'],...o}); };

/* ---------- smooth scroll ---------- */
let lenis=null;
if(window.Lenis && !reduce){
  lenis = new Lenis({duration:1.15,smoothWheel:true});
  if(hasGsap){ lenis.on('scroll',()=>window.ScrollTrigger&&ScrollTrigger.update()); gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0); }
  else { const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)}; requestAnimationFrame(raf); }
  lenis.stop();
}
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href'); if(id.length<2) return; const el=$(id); if(!el) return; e.preventDefault();
  document.body.classList.remove('menu-open');
  lenis ? lenis.scrollTo(el,{offset:-10}) : el.scrollIntoView({behavior:'smooth'});
}));

/* ---------- gate ---------- */
const gate=$('#gate'), heroVid=$('#heroVid');
function openGate(){
  if(gate.classList.contains('open')) return;
  gate.classList.add('open');
  fire({particleCount:90,origin:{y:.55}});
  setTimeout(()=>{ if(hasGsap){ gsap.to('.curtain.l',{xPercent:-100,duration:1.4,ease:'expo.inOut'}); gsap.to('.curtain.r',{xPercent:100,duration:1.4,ease:'expo.inOut'}); } gate.classList.add('gone'); },1500);
  setTimeout(()=>{ document.body.classList.remove('locked'); lenis&&lenis.start(); heroIn(); },1900);
  heroVid.play().catch(()=>{});
}
$('#envelope').addEventListener('click',openGate);
$('#envelope').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')openGate()});
/* deep links (#rsvp, #gift from WhatsApp) or ?open skip the envelope */
if((location.hash && location.hash.length>1) || /[?&]open/.test(location.search)){
  gate.classList.add('open','gone'); gate.style.display='none'; document.body.classList.remove('locked'); lenis&&lenis.start();
  setTimeout(()=>{ heroIn(); heroVid.play().catch(()=>{}); const t=location.hash&&$(location.hash); if(t) setTimeout(()=>lenis?lenis.scrollTo(t,{immediate:true}):t.scrollIntoView(),300); },100);
}

/* ---------- hero entrance ---------- */
const names=$('#heroNames');
(function split(){ const html=[]; names.childNodes.forEach(n=>{ if(n.nodeType===3){ n.textContent.split(/(\s+)/).forEach(w=>{ if(!w.trim()){ if(w) html.push(' '); return; } html.push('<span class="w">'+w.split('').map(ch=>`<span class="ch">${ch}</span>`).join('')+'</span>'); }); } else html.push(n.outerHTML); }); names.innerHTML=html.join(''); })();
if(hasGsap && !reduce){ gsap.set('#heroEyebrow',{opacity:0,letterSpacing:'1.2em'}); gsap.set('#heroLogo',{opacity:0,scale:.85,filter:'blur(12px)'}); gsap.set('#heroNames .ch, #heroNames .amp',{opacity:0,y:60,rotateX:-80}); gsap.set('#heroDates > *',{opacity:0,y:30}); gsap.set('#heroCta > *',{opacity:0,y:20}); }
function heroIn(){
  document.getElementById('nav').classList.add('show');
  if(!hasGsap||reduce) return;
  const tl=gsap.timeline();
  tl.to('#heroEyebrow',{opacity:1,letterSpacing:window.innerWidth<700?'0.4em':'0.55em',duration:1.4,ease:'expo.out'}).to('#heroLogo',{opacity:1,scale:1,filter:'blur(0px)',duration:1.6,ease:'expo.out'})
    .to('#heroNames .ch, #heroNames .amp',{opacity:1,y:0,rotateX:0,stagger:.045,duration:1.1,ease:'back.out(1.7)'},'-=1')
    .to('#heroDates > *',{opacity:1,y:0,stagger:.12,duration:.9,ease:'power3.out'},'-=.6')
    .to('#heroCta > *',{opacity:1,y:0,stagger:.12,duration:.8,ease:'power3.out'},'-=.4');
}

/* ---------- nav ---------- */
const nav=$('#nav'), toTop=$('#toTop');
const dock=$('#dock'); let inAction=false;
if('IntersectionObserver' in window){ const seen=new Set(); const io=new IntersectionObserver(es=>{es.forEach(e=>e.isIntersecting?seen.add(e.target):seen.delete(e.target)); inAction=seen.size>0; dock.classList.toggle('show',scrollY>innerHeight*.8&&!inAction);},{threshold:.15}); ['#rsvp','#gift','footer'].forEach(q=>{const el=$(q); el&&io.observe(el);}); }
addEventListener('scroll',()=>{ const y=scrollY; nav.classList.toggle('solid',y>80); toTop.classList.toggle('show',y>900); dock.classList.toggle('show',y>innerHeight*.8&&!inAction); document.body.classList.toggle('dock-on',dock.classList.contains('show')); },{passive:true});
toTop.onclick=()=>lenis?lenis.scrollTo(0):scrollTo({top:0,behavior:'smooth'});
$('#burger').onclick=()=>document.body.classList.toggle('menu-open');

/* ---------- cursor + heart trail ---------- */
if(!isTouch && !reduce){
  const cur=$('#cursor'); let cx=innerWidth/2,cy=innerHeight/2,tx=cx,ty=cy;
  const tc=$('#trail'), tctx=tc.getContext('2d'); const parts=[];
  const rs=()=>{tc.width=innerWidth;tc.height=innerHeight}; rs(); addEventListener('resize',rs);
  addEventListener('mousemove',e=>{ tx=e.clientX; ty=e.clientY; if(Math.random()<.35) parts.push({x:tx,y:ty,vx:(Math.random()-.5)*1.2,vy:-Math.random()*1.4-.3,life:1,s:Math.random()*6+5,h:Math.random()<.5}); });
  function heart(c,x,y,s){c.beginPath();c.moveTo(x,y+s/4);c.bezierCurveTo(x,y,x-s/2,y,x-s/2,y+s/4);c.bezierCurveTo(x-s/2,y+s/2,x,y+s*.7,x,y+s);c.bezierCurveTo(x,y+s*.7,x+s/2,y+s/2,x+s/2,y+s/4);c.bezierCurveTo(x+s/2,y,x,y,x,y+s/4);c.fill();}
  (function loop(){ cx+=(tx-cx)*.18; cy+=(ty-cy)*.18; cur.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    tctx.clearRect(0,0,tc.width,tc.height);
    for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx;p.y+=p.vy;p.life-=.022;if(p.life<=0){parts.splice(i,1);continue}
      tctx.globalAlpha=p.life; tctx.fillStyle=p.h?'#d8bb8a':'#b4283b'; if(p.h){heart(tctx,p.x,p.y,p.s)}else{tctx.beginPath();tctx.arc(p.x,p.y,p.s/5,0,7);tctx.fill()} }
    requestAnimationFrame(loop); })();
  $$('a,button,.envelope,.colour,.ev,.masonry figure,.scratch-wrap').forEach(el=>{el.addEventListener('mouseenter',()=>cur.classList.add('hover'));el.addEventListener('mouseleave',()=>cur.classList.remove('hover'));});
  $$('.magnetic').forEach(m=>{ m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect();m.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.3}px,${(e.clientY-r.top-r.height/2)*.4}px)`}); m.addEventListener('mouseleave',()=>m.style.transform=''); });
}

/* ---------- petals + gold dust ---------- */
(function petals(){
  if(reduce) return;
  const c=$('#petals'), x=c.getContext('2d'); let W,H; const P=[];
  const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight}; rs(); addEventListener('resize',rs);
  const N = innerWidth<700?16:30;
  for(let i=0;i<N;i++) P.push(mk(true));
  function mk(init){ const dust=Math.random()<.45; return {x:Math.random()*W,y:init?Math.random()*H:-30,s:dust?Math.random()*2+1:Math.random()*10+8,vy:dust?Math.random()*.4+.15:Math.random()*.9+.5,vx:Math.random()*.6-.3,r:Math.random()*6,vr:(Math.random()-.5)*.03,sw:Math.random()*2,dust,col:['#8f1d2c','#b4283b','#6e0f1f','#c9475a'][Math.floor(Math.random()*4)]}; }
  let t=0;
  (function loop(){ t+=.01; x.clearRect(0,0,W,H);
    for(const p of P){ p.y+=p.vy; p.x+=p.vx+Math.sin(t+p.sw)*.4; p.r+=p.vr;
      if(p.y>H+30){Object.assign(p,mk(false))}
      x.save(); x.translate(p.x,p.y); x.rotate(p.r);
      if(p.dust){ x.globalAlpha=.55+Math.sin(t*3+p.sw)*.35; x.fillStyle='#f1dfbd'; x.shadowColor='#d8bb8a'; x.shadowBlur=8; x.beginPath(); x.arc(0,0,p.s,0,7); x.fill(); }
      else { x.globalAlpha=.75; const g=x.createLinearGradient(-p.s,0,p.s,0); g.addColorStop(0,p.col); g.addColorStop(1,'#3d0610'); x.fillStyle=g; x.beginPath(); x.ellipse(0,0,p.s,p.s*.6,0,0,7); x.fill(); }
      x.restore(); }
    requestAnimationFrame(loop); })();
})();

/* ---------- tilt + glow ---------- */
if(!isTouch) $$('.tilt').forEach(el=>{
  el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    el.style.transform=`perspective(900px) rotateY(${(px-.5)*12}deg) rotateX(${(.5-py)*12}deg)`; el.style.setProperty('--mx',px*100+'%'); el.style.setProperty('--my',py*100+'%');});
  el.addEventListener('mouseleave',()=>el.style.transform='');
});

/* ---------- countdown ---------- */
const EV = C.EVENTS || {trad:{name:'Traditional Wedding',date:'2026-11-21T00:00:00+01:00',label:'Saturday, 21 November 2026'},white:{name:'White Wedding',date:'2026-11-28T00:00:00+01:00',label:'Saturday, 28 November 2026'}};
let cur='trad'; const circ=2*Math.PI*46; const last={};
$$('.cd-unit .prog').forEach(p=>{p.style.strokeDasharray=circ;p.style.strokeDashoffset=circ;});
function setTab(k){ cur=k; $$('#cdTabs button').forEach(b=>b.classList.toggle('active',b.dataset.ev===k));
  const b=$(`#cdTabs button[data-ev="${k}"]`), pill=$('#cdPill'); pill.style.width=b.offsetWidth+'px'; pill.style.transform=`translateX(${b.offsetLeft-5}px)`;
  $('#cdTitle').textContent=EV[k].name; $('#cdDate').textContent=EV[k].label;
  if(hasGsap) gsap.fromTo('#cdTitle',{opacity:0,y:20,filter:'blur(8px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.8,ease:'power3.out'});
  Object.keys(last).forEach(u=>delete last[u]); tick(); }
$$('#cdTabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.ev));
addEventListener('resize',()=>setTab(cur));
function roll(unit,val){ const box=$(`.cd-unit[data-u="${unit}"] .cd-num`); const s=String(val).padStart(2,'0'); if(last[unit]===s) return; last[unit]=s;
  const old=box.querySelector('.n:not(.out)'); const n=document.createElement('span'); n.className='n in'; n.textContent=s; box.appendChild(n);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{n.classList.remove('in'); if(old){old.classList.add('out'); setTimeout(()=>old.remove(),650);} })); }
function ring(unit,frac){ $(`.cd-unit[data-u="${unit}"] .prog`).style.strokeDashoffset=circ*(1-Math.max(0,Math.min(1,frac))); }
function fmt(ms){ if(ms<=0) return 'Today!'; const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5); return `${d}d ${h}h`; }
let celebrated=false;
function tick(){ const now=Date.now(), target=new Date(EV[cur].date).getTime(), diff=target-now;
  const box=$('#cdBox'); const endOfDay=target+864e5;
  if(diff<=0){ box.classList.toggle('is-today', now<endOfDay); if(now<endOfDay && !celebrated){celebrated=true;fire({particleCount:250,spread:160});} }
  else box.classList.remove('is-today');
  const ms=Math.max(0,diff), d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5), m=Math.floor(ms%36e5/6e4), s=Math.floor(ms%6e4/1e3);
  roll('d',d);roll('h',h);roll('m',m);roll('s',s); ring('d',d/60);ring('h',h/24);ring('m',m/60);ring('s',s/60);
  $('#cdHeartbeats').textContent=Math.round(ms/1000*1.2).toLocaleString();
  $('#miniTrad').textContent=fmt(new Date(EV.trad.date)-now); $('#miniWhite').textContent=fmt(new Date(EV.white.date)-now);
}
setTab('trad'); setInterval(tick,1000);
$('.cd-heart').addEventListener('click',e=>fire({particleCount:60,origin:{x:e.clientX/innerWidth,y:e.clientY/innerHeight},shapes:['circle']}));

/* ---------- scroll animations ---------- */
if(hasGsap && window.ScrollTrigger && !reduce){
  gsap.registerPlugin(ScrollTrigger);
  $$('.section-head h2').forEach(h=>{ h.innerHTML=`<span class="h2-mask"><span>${h.innerHTML}</span></span>`; gsap.from(h.querySelector('.h2-mask>span'),{yPercent:110,rotate:3,duration:1.3,ease:'expo.out',scrollTrigger:{trigger:h,start:'top 90%'}}); });
  $$('.reveal').forEach(el=>gsap.to(el,{opacity:1,y:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}}));
  gsap.to('#heroVid, .hero-poster',{yPercent:18,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.hero-content',{yPercent:-30,opacity:0,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.marquee .track',{scrollTrigger:{trigger:'.marquee',start:'top bottom',end:'bottom top',scrub:true},x:-120});
  $$('.word-card .heb').forEach(h=>gsap.from(h,{opacity:0,scale:.6,rotate:-8,duration:1.4,ease:'expo.out',scrollTrigger:{trigger:h,start:'top 85%'}}));
  const mm=gsap.matchMedia();
  mm.add('(min-width: 901px)',()=>{
    const track=$('#storyTrack');
    const dist=()=>track.scrollWidth-innerWidth;
    const tween=gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'#storyPin',pin:true,scrub:1,end:()=>'+='+dist(),invalidateOnRefresh:true,onUpdate:s=>$('#storyBar').style.width=(s.progress*100)+'%'}});
    $$('.chapter .frame img').forEach(img=>gsap.to(img,{scale:1,ease:'none',scrollTrigger:{trigger:img.closest('.chapter'),containerAnimation:tween,start:'left right',end:'right left',scrub:true}}));
    $$('.chapter h3, .chapter p, .chapter .num').forEach(t=>gsap.from(t,{opacity:0,y:50,duration:1,ease:'power3.out',scrollTrigger:{trigger:t,containerAnimation:tween,start:'left 80%'}}));
  });
  mm.add('(max-width: 900px)',()=>{
    $$('.chapter').forEach(ch=>{ gsap.from(ch,{opacity:0,y:80,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:ch,start:'top 85%'}}); const im=ch.querySelector('img'); im&&gsap.to(im,{scale:1,ease:'none',scrollTrigger:{trigger:ch,start:'top bottom',end:'bottom top',scrub:true}}); });
  });
  $$('.colour').forEach((c,i)=>gsap.fromTo(c,{y:120,rotate:i%2?6:-6,opacity:0},{y:0,rotate:0,opacity:1,duration:1.3,ease:'expo.out',delay:i*.08,scrollTrigger:{trigger:'.colour-row',start:'top 90%'}}));
  gsap.from('.bank-card',{rotateY:-35,rotateX:12,opacity:0,duration:1.6,ease:'expo.out',scrollTrigger:{trigger:'.bank-card',start:'top 85%'}});
  addEventListener('load',()=>ScrollTrigger.refresh());
}

/* ---------- scratch card ---------- */
(function scratch(){
  const wrap=$('#scratchWrap'), cv=$('#scratch'), ctx=cv.getContext('2d'); let drawing=false, done=false, dpr=Math.min(devicePixelRatio||1,2);
  function paint(){ const r=wrap.getBoundingClientRect(); cv.width=r.width*dpr; cv.height=r.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    const g=ctx.createLinearGradient(0,0,r.width,r.height); ['#a9874f','#f6e6c4','#d8bb8a','#fff2d6','#b8955c','#e9d3a6'].forEach((c,i,a)=>g.addColorStop(i/(a.length-1),c));
    ctx.globalCompositeOperation='source-over'; ctx.fillStyle=g; ctx.fillRect(0,0,r.width,r.height);
    for(let i=0;i<500;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.35})`;ctx.fillRect(Math.random()*r.width,Math.random()*r.height,1.5,1.5)}
    ctx.fillStyle='#6e0f1f'; ctx.textAlign='center'; ctx.font=`400 ${Math.round(r.width/7)}px "Pinyon Script", cursive`; ctx.fillText('Her answer…',r.width/2,r.height/2-10);
    ctx.font=`500 ${Math.max(10,Math.round(r.width/34))}px Jost, sans-serif`; ctx.fillText('S C R A T C H   H E R E',r.width/2,r.height/2+r.width/10);
    ctx.font=`${Math.round(r.width/9)}px serif`; ctx.fillText('💍',r.width/2,r.height/2-r.width/4); }
  document.fonts ? document.fonts.ready.then(paint) : paint(); addEventListener('resize',()=>{ if(!done) paint(); });
  function pos(e){ const r=cv.getBoundingClientRect(), t=e.touches?e.touches[0]:e; return {x:t.clientX-r.left,y:t.clientY-r.top}; }
  let lastP=null;
  function scr(e){ if(!drawing||done) return; e.preventDefault(); const p=pos(e); ctx.globalCompositeOperation='destination-out'; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=46;
    ctx.beginPath(); ctx.moveTo((lastP||p).x,(lastP||p).y); ctx.lineTo(p.x,p.y); ctx.stroke(); lastP=p; check(); }
  let ct=0; function check(){ if(++ct%8) return; const d=ctx.getImageData(0,0,cv.width,cv.height).data; let clear=0; for(let i=3;i<d.length;i+=64) if(d[i]===0) clear++;
    if(clear/(d.length/64)>.5){ done=true; wrap.classList.add('done'); $('#answer').classList.add('revealed'); $('#scratchNote').textContent='She said YES!! 💍'; const r=wrap.getBoundingClientRect(); fire({particleCount:220,spread:120,origin:{x:(r.left+r.width/2)/innerWidth,y:(r.top+r.height/2)/innerHeight}}); setTimeout(()=>fire({particleCount:120,angle:60,origin:{x:0,y:.7}}),300); setTimeout(()=>fire({particleCount:120,angle:120,origin:{x:1,y:.7}}),500);} }
  ['mousedown','touchstart'].forEach(ev=>cv.addEventListener(ev,e=>{drawing=true;lastP=null;scr(e)},{passive:false}));
  ['mousemove','touchmove'].forEach(ev=>cv.addEventListener(ev,scr,{passive:false}));
  ['mouseup','mouseleave','touchend'].forEach(ev=>cv.addEventListener(ev,()=>{drawing=false;lastP=null}));
})();

/* ---------- video players ---------- */
$$('.vplayer').forEach(box=>{ const v=box.querySelector('video'), b=box.querySelector('.play'); const host=box.closest('.cinema')||box;
  b.addEventListener('click',()=>{ $$('.vplayer video').forEach(o=>{if(o!==v){o.pause();}}); heroVid.pause(); v.controls=true; v.play(); host.classList.add('playing'); });
  v.addEventListener('ended',()=>{ host.classList.remove('playing'); v.controls=false; heroVid.play().catch(()=>{}); });
  v.addEventListener('pause',()=>{ if(v.currentTime<.2) host.classList.remove('playing'); });
});

/* ---------- event cards + calendar ---------- */
$$('.ev').forEach(c=>{ c.addEventListener('click',e=>{ if(e.target.closest('[data-cal]')) return; c.classList.toggle('flipped'); }); c.addEventListener('keydown',e=>{if(e.key==='Enter')c.classList.toggle('flipped')}); });
$$('[data-cal]').forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); const k=a.dataset.cal==='trad'?'trad':'white'; const ev=EV[k];
  const d=new Date(ev.date); const ymd=x=>x.toISOString().slice(0,10).replace(/-/g,''); const start=new Date(d.getTime()+3600e3); const end=new Date(start.getTime()+864e5);
  const title=`Elijah & Mary-Ann · ${ev.name}`; const details='Kalut-Shefa \'26 · '+location.href.split('#')[0];
  if(/iPhone|iPad|Mac/i.test(navigator.userAgent)){
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//KalutShefa26//EN','BEGIN:VEVENT',`UID:${k}-kalutshefa26`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,`DTSTART;VALUE=DATE:${ymd(start)}`,`DTEND;VALUE=DATE:${ymd(end)}`,`SUMMARY:${title}`,`DESCRIPTION:${details}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})); const l=document.createElement('a'); l.href=url; l.download=`${k}-wedding.ics`; l.click();
  } else window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${ymd(start)}/${ymd(end)}&details=${encodeURIComponent(details)}`,'_blank');
}));

/* ---------- colours ---------- */
$$('.colour').forEach(c=>c.addEventListener('click',e=>{ const sec=$('#colours'); sec.style.background=c.dataset.bg;
  const r=c.getBoundingClientRect(); fire({particleCount:70,spread:70,origin:{x:(r.left+r.width/2)/innerWidth,y:(r.top+r.height/3)/innerHeight},colors:[getComputedStyle(c.querySelector('.fill')).backgroundImage.match(/#[0-9a-f]{6}|rgb\([^)]*\)/gi)?.[1]||'#d8bb8a','#ffffff','#d8bb8a']});
  toast(`${c.querySelector('b').textContent}. Great choice ✨`); }));

/* ---------- portraits (pre-wedding shoot) ---------- */
const PORTRAITS=(C.PORTRAITS||[]).filter(Boolean);
const row=$('#portraitRow');
const cam='<svg class="cam" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="4"/></svg>';
if(PORTRAITS.length){
  row.classList.add('real');
  $('#portraitsEyebrow').textContent='The pre-wedding shoot'; $('#portraitsTitle').innerHTML='Elijah <span class="gold-text">&amp;</span> Mary-Ann'; $('#portraitsLead').textContent='Portraits from their pre-wedding shoot. Tap any photo.';
  row.innerHTML=PORTRAITS.map((src,i)=>`<figure class="arch real reveal" data-i="${i}"><img src="${src}" alt="Elijah and Mary-Ann, pre-wedding portrait ${i+1}" loading="lazy"></figure>`).join('');
} else {
  const ph=['ring-red-sm','sun-circle-sm','said-yes-sm'];
  row.innerHTML=ph.map((p,i)=>`<div class="arch ${i===1?'mid':''} reveal"><div class="ph" style="background-image:url(assets/img/${p}.webp)"></div><div class="soon">${i===1?cam+'<b>Coming soon</b><small>Official portraits</small>':i===0?'<b>21.11</b><small>Traditional</small>':'<b>28.11</b><small>White wedding</small>'}</div></div>`).join('');
}
const lb=$('#lightbox'), lbImg=lb.querySelector('img'); let li=0;
const show=i=>{li=(i+PORTRAITS.length)%PORTRAITS.length; lbImg.src=PORTRAITS[li]; lbImg.style.animation='none'; lbImg.offsetHeight; lbImg.style.animation=''; lb.querySelector('.lb-count').textContent=`${li+1} / ${PORTRAITS.length}`;};
$$('#portraitRow .arch.real').forEach(f=>f.onclick=()=>{show(+f.dataset.i); lb.classList.add('open'); lenis&&lenis.stop();});
const closeLb=()=>{lb.classList.remove('open'); lenis&&lenis.start();};
lb.querySelector('.lb-close').onclick=closeLb; lb.querySelector('.lb-prev').onclick=()=>show(li-1); lb.querySelector('.lb-next').onclick=()=>show(li+1);
lb.addEventListener('click',e=>{if(e.target===lb)closeLb()});
addEventListener('keydown',e=>{ if(!lb.classList.contains('open')) return; if(e.key==='Escape')closeLb(); if(e.key==='ArrowLeft')show(li-1); if(e.key==='ArrowRight')show(li+1); });
let sx=0; lb.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true}); lb.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50) show(li+(dx<0?1:-1));});
if(hasGsap&&window.ScrollTrigger&&!reduce) $$('#portraitRow .arch').forEach((f,i)=>gsap.to(f,{opacity:1,y:0,duration:1.2,delay:i*.1,ease:'expo.out',scrollTrigger:{trigger:'#portraitRow',start:'top 88%'}}));

/* ---------- RSVP ---------- */
const form=$('#rsvpForm'); let step=1, guests=1;
const steps=$$('.step',form), bars=$$('.rsvp-steps i',form);
function go(n){ step=n; steps.forEach(s=>s.classList.toggle('active',+s.dataset.step===n)); bars.forEach((b,i)=>b.classList.toggle('on',i<n)); const top=form.getBoundingClientRect().top+scrollY-100; if(Math.abs(scrollY-top)>200) lenis?lenis.scrollTo(top):scrollTo({top,behavior:'smooth'}); }
const err=(n,m)=>$(`[data-err="${n}"]`,form).textContent=m||'';
function valid(n){
  if(n===1){ const nm=form.full_name.value.trim(), ph=form.phone.value.trim(), em=form.email.value.trim();
    if(nm.length<2) return err(1,'Please tell us your name.'),false;
    if(!ph && !em) return err(1,'Add a phone number or email so the couple can reach you.'),false;
    if(em && !/^\S+@\S+\.\S+$/.test(em)) return err(1,'That email looks off.'),false; }
  if(n===2){ const a=form.querySelector('[name=attending]:checked'); if(!a) return err(2,'Let us know if you can make it.'),false;
    if(a.value==='yes' && !form.querySelectorAll('[name=events]:checked').length) return err(2,'Pick at least one celebration.'),false; }
  err(n); return true; }
$$('.next',form).forEach(b=>b.onclick=()=>{ if(!valid(step)) return; const att=form.querySelector('[name=attending]:checked'); if(step===2 && att && att.value==='no'){ go(4); return; } go(step+1); });
$$('.back',form).forEach(b=>b.onclick=()=>{ const att=form.querySelector('[name=attending]:checked'); go(step===4 && att && att.value==='no'?2:step-1); });
form.querySelectorAll('[name=attending]').forEach(r=>r.onchange=()=>{ $('#eventsPick').style.display=r.value==='no'&&r.checked?'none':''; });
$$('.stepper button',form).forEach(b=>b.onclick=()=>{ guests=Math.max(1,Math.min(10,guests+ +b.dataset.d)); const o=$('#guestOut'); o.textContent=guests; if(hasGsap) gsap.fromTo(o,{scale:1.4,color:'#d8bb8a'},{scale:1,color:'#6e0f1f',duration:.5}); });
form.addEventListener('submit',async e=>{ e.preventDefault(); if(form.company.value) return; /* bot */
  const att=form.querySelector('[name=attending]:checked').value;
  const row={ company:form.company.value, full_name:form.full_name.value.trim().slice(0,120), phone:form.phone.value.trim().slice(0,40)||null, email:form.email.value.trim().slice(0,160)||null,
    attending:att, events:att==='yes'?[...form.querySelectorAll('[name=events]:checked')].map(c=>c.value):[], guests:att==='yes'?guests:0,
    side:(form.querySelector('[name=side]:checked')||{}).value||null, message:form.message.value.trim().slice(0,1000)||null, visitor_id:visitorId().id };
  const btn=$('#rsvpSubmit'); btn.disabled=true; btn.textContent='Sending…';
  try{ await save('rsvps',row);
    steps.forEach(s=>s.classList.remove('active')); $('.rsvp-steps',form).style.display='none'; const done=$('#rsvpDone'); done.classList.add('show');
    $('#rsvpDoneMsg').textContent = att==='yes' ? `We can't wait to celebrate with you, ${row.full_name.split(' ')[0]}! Your ${row.guests>1?'party of '+row.guests+' is':'seat is'} noted.` : `Thank you, ${row.full_name.split(' ')[0]}. You'll be missed, and your love is felt.`;
    fire({particleCount:200,spread:130,origin:{y:.6}}); setTimeout(()=>fire({particleCount:100,spread:100,origin:{y:.4}}),400);
    localStorage.setItem('ks_rsvped','1'); const bn=$('#boothName'); if(bn && att==='yes'){ bn.value=row.full_name.split(' ')[0]; bn.dispatchEvent(new Event('input')); }
  }catch(ex){ console.error(ex); err(4,'Something went wrong sending that. Please try again in a moment.'); btn.disabled=false; btn.textContent='Send my RSVP ✦'; }
});

/* ---------- gifts ---------- */
const B=C.BANK||{bank:'Fidelity Bank',number:'6680975235',name:'Elijah Oghenerona Ijabor'};
$('#bankName').textContent=B.bank; $('#acctNum').textContent=B.number.replace(/(\d{4})(\d{3})(\d{3})/,'$1 $2 $3'); $('#acctName').textContent=B.name;
$('#copyAcct').onclick=async()=>{ try{ await navigator.clipboard.writeText(B.number); }catch(e){ const t=document.createElement('textarea'); t.value=B.number; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  toast(`Copied ${B.number} · ${B.bank}`); const r=$('#bankCard').getBoundingClientRect(); fire({particleCount:80,spread:70,origin:{x:(r.left+r.width/2)/innerWidth,y:(r.top+r.height/2)/innerHeight}}); };
$$('#amounts button').forEach(b=>b.onclick=()=>{ $$('#amounts button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); $('#gAmount').value=b.dataset.a; });
$('#gAmount').oninput=()=>$$('#amounts button').forEach(x=>x.classList.toggle('on',x.dataset.a===$('#gAmount').value));
const payBtn=$('#payBtn');
if(C.PAYSTACK_PUBLIC_KEY){ const sp=$('#soonPill'); sp&&sp.remove(); }
if(!C.PAYSTACK_PUBLIC_KEY){ payBtn.disabled=true; payBtn.classList.add('soon'); payBtn.classList.remove('btn-gold'); payBtn.textContent='Card gifts · coming soon'; $('#payNote').textContent='Card payments switch on shortly. Bank transfer to the account on the left works now.'; }
payBtn.onclick=()=>{
  const amt=Math.round(+$('#gAmount').value), name=$('#gName').value.trim(), email=$('#gEmail').value.trim(), note=$('#gNote').value.trim();
  if(!(amt>=100)) return toast('Enter an amount of at least ₦100');
  if(!/^\S+@\S+\.\S+$/.test(email)) return toast('Add your email for the receipt');
  if(!window.PaystackPop) return toast('Payment window is still loading, try again in a second');
  const ref='KS26-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
  const popup=new PaystackPop();
  popup.newTransaction({ key:C.PAYSTACK_PUBLIC_KEY, email, amount:amt*100, currency:'NGN', reference:ref,
    metadata:{custom_fields:[{display_name:'Guest',variable_name:'guest',value:name||'Anonymous'},{display_name:'Note',variable_name:'note',value:note||'-'}]},
    onSuccess:(t)=>{ save('gifts',{name:name||null,email,amount_kobo:amt*100,reference:t.reference||ref,note:note||null,status:'paid_client'}).catch(console.warn);
      toast('Thank you for blessing the couple 💛'); fire({particleCount:260,spread:160}); },
    onCancel:()=>toast('No worries. You can try again anytime.') });
};

/* ---------- love: hearts counter ---------- */
const escH=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LOVE={total:0,pending:0,mine:+(localStorage.getItem('ks_hearts')||0),timer:null};
const fmtN=n=>n.toLocaleString('en-NG');
function showTotal(){ const el=$('#loveCount'); if(el) el.textContent=fmtN(LOVE.total); }
function flushLove(){ if(!LOVE.pending) return; const n=Math.min(60,LOVE.pending); LOVE.pending-=n;
  fetch('/api/love',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({n}),keepalive:true})
    .then(r=>r.json()).then(d=>{ if(d&&d.hearts){ LOVE.total=Math.max(LOVE.total,d.hearts+LOVE.pending); showTotal(); } }).catch(()=>{}); }
function sendHearts(n){ LOVE.pending+=n; LOVE.total+=n; LOVE.mine+=n; localStorage.setItem('ks_hearts',LOVE.mine); showTotal();
  clearTimeout(LOVE.timer); LOVE.timer=setTimeout(flushLove,1200); if(LOVE.pending>=60) flushLove(); }
addEventListener('pagehide',flushLove);
function flyHearts(x,y,k){ if(reduce) return; for(let i=0;i<k;i++){ const h=document.createElement('span'); h.className='fly-heart';
  h.textContent=Math.random()<.15?'💛':'♥'; h.style.left=x+'px'; h.style.top=y+'px'; h.style.color=['#e0405a','#d8bb8a','#f1dfbd','#b4283b'][i%4];
  h.style.setProperty('--dx',(Math.random()*240-120).toFixed(0)+'px'); h.style.setProperty('--dy',(140+Math.random()*220).toFixed(0)+'px');
  h.style.setProperty('--s',(.8+Math.random()*1.2).toFixed(2)); h.style.setProperty('--r',(Math.random()*60-30).toFixed(0)+'deg');
  document.body.appendChild(h); setTimeout(()=>h.remove(),1500); } }
const MILES={1:'Your first heart just landed 💛',10:'Aww. They felt that.',25:'Okay Cupid, we see you 🏹',50:'Mary-Ann is blushing.',100:'Elijah is grinning ear to ear.',200:'Certified hype person of the year 🏆',500:'You might love them more than they love each other 😅'};
const bh=$('#bigHeart');
if(bh){ bh.addEventListener('click',e=>{ const r=bh.getBoundingClientRect(); const x=e.clientX||r.left+r.width/2, y=e.clientY||r.top+r.height/2;
    flyHearts(x,y,isTouch?4:6); sendHearts(1); if(navigator.vibrate) navigator.vibrate(8);
    bh.classList.add('pop'); setTimeout(()=>bh.classList.remove('pop'),140);
    const lab=$('.bh-label',bh); if(lab) lab.style.opacity='0';
    const m=LOVE.mine; $('#loveMine').textContent=MILES[m]||`You've sent ${fmtN(m)} heart${m>1?'s':''}`;
    if(m%25===0) fire({particleCount:90,spread:80,origin:{x:x/innerWidth,y:y/innerHeight}}); });
  if(LOVE.mine) $('#loveMine').textContent=`You've sent ${fmtN(LOVE.mine)} heart${LOVE.mine>1?'s':''} so far. Keep going 💛`;
}

/* ---------- love jar ---------- */
let notesKey=null;
function renderNotes(notes){ const w=$('#notesWall'); if(!w) return; const key=notes.map(n=>n.id).join(); if(key===notesKey) return; notesKey=key;
  const tones=['','olive','blush'];
  const card=(n,i)=>`<div class="paper ${tones[i%3]}" style="--rot:${(i*37)%7-3}deg"><p>“${escH(n.note)}”</p><b>${escH(n.name||'A guest')}</b></div>`;
  if(!notes.length){ w.className='notes-wall static'; w.innerHTML=`<div class="lane"><div class="paper empty"><p>The jar is waiting for its first note. Will it be yours?</p><b>Kalut-Shefa '26</b></div></div>`; return; }
  if(notes.length<4 || reduce){ w.className='notes-wall static'; w.innerHTML=`<div class="lane">${notes.slice(0,12).map(card).join('')}</div>`; return; }
  w.className='notes-wall'; const lanes=notes.length>=8?[notes.filter((_,i)=>i%2===0),notes.filter((_,i)=>i%2===1)]:[notes];
  w.innerHTML=lanes.map((l,li)=>{ const c=l.map((n,i)=>card(n,i+li)).join(''); return `<div class="lane ${li?'rev':''}" style="--t:${Math.max(30,l.length*9)}s">${c}${c}</div>`; }).join('');
}
async function loadLove(){ try{ const r=await fetch('/api/love',{cache:'no-store'}); const d=await r.json(); if(!d.ok) return;
  LOVE.total=Math.max(LOVE.total,(d.hearts||0)+LOVE.pending); showTotal(); renderNotes(d.notes||[]); }catch(e){ renderNotes([]); } }
const loveSec=$('#love'); let lovePoll=null;
if(loveSec){ new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ loadLove(); clearInterval(lovePoll); lovePoll=setInterval(loadLove,25000); } else clearInterval(lovePoll); }),{rootMargin:'400px'}).observe(loveSec); }
const nf=$('#noteForm'), nn=$('#nNote');
if(nf){ nn.addEventListener('input',()=>$('#nCount').textContent=nn.value.length+' / 280');
  nf.addEventListener('submit',async e=>{ e.preventDefault(); const hp=nf.querySelector('[name=company]').value; if(hp) return;
    const note=nn.value.trim(); if(note.length<3){ $('#noteErr').textContent='Write a few words first.'; return; } $('#noteErr').textContent='';
    const btn=$('#noteBtn'); btn.disabled=true; btn.textContent='Folding it up…';
    try{ const r=await fetch('/api/love',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'note',name:$('#nName').value.trim(),note,company:hp})});
      const d=await r.json().catch(()=>({})); if(!r.ok||!d.ok) throw new Error(d.error||('HTTP '+r.status));
      nf.classList.remove('sent'); void nf.offsetWidth; nf.classList.add('sent'); nn.value=''; $('#nCount').textContent='0 / 280';
      toast('Your note is in the jar 💌 It shows up here once the couple read it.'); const rr=nf.getBoundingClientRect(); fire({particleCount:70,spread:70,origin:{x:.5,y:(rr.top+rr.height/2)/innerHeight}}); sendHearts(1);
    }catch(ex){ $('#noteErr').textContent=/slow/.test(ex.message)?'That is a lot of love! Give it a little while and try again.':'That did not send. Please try again in a moment.'; }
    btn.disabled=false; btn.textContent='Drop it in the jar ✦'; }); }

/* ---------- double-tap a photo to love it ---------- */
const lovable='.chapter .frame, .reply-card .scratch-wrap, .colour';
function bigLove(x,y){ if(!reduce){ const h=document.createElement('span'); h.className='big-love'; h.textContent='♥'; h.style.left=x+'px'; h.style.top=y+'px'; document.body.appendChild(h); setTimeout(()=>h.remove(),1100); flyHearts(x,y,4); } sendHearts(1); }
if(!isTouch) document.addEventListener('dblclick',e=>{ if(e.target.closest&&e.target.closest(lovable)){ e.preventDefault(); getSelection&&getSelection().removeAllRanges(); bigLove(e.clientX,e.clientY); } });
let lastTap=0, lastEl=null;
document.addEventListener('touchend',e=>{ const t=e.target.closest&&e.target.closest(lovable); if(!t) return; const now=Date.now();
  if(now-lastTap<320 && lastEl===t){ const p=e.changedTouches[0]; bigLove(p.clientX,p.clientY); lastTap=0; e.preventDefault(); } else { lastTap=now; lastEl=t; } },{passive:false});

/* ---------- photo booth ---------- */
(function booth(){
  const cv=$('#boothCanvas'); if(!cv) return; const g=cv.getContext('2d'); const W=1080,H=1350; cv.setAttribute('data-lenis-prevent','');
  const st={img:null,zoom:1,ox:0,oy:0,line:"I'll be there",theme:'burg',name:''};
  const TH={burg:{bg1:'#7a1424',bg2:'#2a040c',ink:'#fbf7f0',acc:'#d8bb8a',pill:'#d8bb8a',pillInk:'#3d0610',logo:'#e9d3a6'},
    olive:{bg1:'#6b783b',bg2:'#232910',ink:'#fbf7f0',acc:'#e9d3a6',pill:'#e9d3a6',pillInk:'#2c3316',logo:'#f1dfbd'},
    gold:{bg1:'#efdcb6',bg2:'#c7a26a',ink:'#3d0610',acc:'#6e0f1f',pill:'#6e0f1f',pillInk:'#fbf7f0',logo:'#6e0f1f'},
    ivory:{bg1:'#ffffff',bg2:'#f1e7d6',ink:'#3d0610',acc:'#a9874f',pill:'#6e0f1f',pillInk:'#fbf7f0',logo:'#6e0f1f'}};
  const logo=new Image(); logo.src='assets/img/logo.webp'; logo.onload=()=>req();
  const tinted={}; function logoFor(c){ if(tinted[c]) return tinted[c]; if(!logo.complete||!logo.naturalWidth) return null; const o=document.createElement('canvas'); o.width=logo.naturalWidth; o.height=logo.naturalHeight; const x=o.getContext('2d'); x.drawImage(logo,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=c; x.fillRect(0,0,o.width,o.height); return tinted[c]=o; }
  const A={x:120,y:96,w:840,h:840};
  function arch(c,pad){ const x=A.x-pad,y=A.y-pad,w=A.w+pad*2,h=A.h+pad*2,r=w/2,k=26; c.beginPath(); c.moveTo(x,y+r); c.arc(x+r,y+r,r,Math.PI,0); c.lineTo(x+w,y+h-k); c.quadraticCurveTo(x+w,y+h,x+w-k,y+h); c.lineTo(x+k,y+h); c.quadraticCurveTo(x,y+h,x,y+h-k); c.closePath(); }
  const HP=new Path2D('M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4.5 6 4.5c2.1 0 3.5 1.2 4.2 2.4h1.6c.7-1.2 2.1-2.4 4.2-2.4 3.7 0 5.6 3.9 4 7.2C19.5 16.4 12 21 12 21z');
  function heart(x,y,s){ g.save(); g.translate(x,y); g.scale(s/24,s/24); g.translate(-12,-12); g.fill(HP); g.restore(); }
  function pill(x,y,w,h){ const r=h/2; g.beginPath(); g.moveTo(x+r,y); g.lineTo(x+w-r,y); g.arc(x+w-r,y+r,r,-Math.PI/2,Math.PI/2); g.lineTo(x+r,y+h); g.arc(x+r,y+r,r,Math.PI/2,Math.PI*1.5); g.closePath(); }
  const ls=v=>{ if('letterSpacing' in g) g.letterSpacing=v; };
  function draw(){ const t=TH[st.theme];
    const bg=g.createLinearGradient(0,0,W,H); bg.addColorStop(0,t.bg1); bg.addColorStop(1,t.bg2); g.fillStyle=bg; g.fillRect(0,0,W,H);
    const rg=g.createRadialGradient(W/2,500,80,W/2,500,720); rg.addColorStop(0,'rgba(255,240,210,.16)'); rg.addColorStop(1,'rgba(255,240,210,0)'); g.fillStyle=rg; g.fillRect(0,0,W,H);
    g.globalAlpha=.5; g.strokeStyle=t.acc; g.lineWidth=2; g.strokeRect(34,34,W-68,H-68); g.globalAlpha=1;
    g.save(); arch(g,0); g.clip();
    if(st.img){ const iw=st.img.naturalWidth, ih=st.img.naturalHeight, s=Math.max(A.w/iw,A.h/ih)*st.zoom, dw=iw*s, dh=ih*s, mx=(dw-A.w)/2, my=(dh-A.h)/2;
      st.ox=Math.max(-mx,Math.min(mx,st.ox)); st.oy=Math.max(-my,Math.min(my,st.oy)); g.drawImage(st.img,A.x+A.w/2-dw/2+st.ox,A.y+A.h/2-dh/2+st.oy,dw,dh);
      const vg=g.createLinearGradient(0,A.y+A.h-240,0,A.y+A.h); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.35)'); g.fillStyle=vg; g.fillRect(A.x,A.y+A.h-240,A.w,240);
    } else { const pg=g.createLinearGradient(0,A.y,0,A.y+A.h); pg.addColorStop(0,'rgba(0,0,0,.18)'); pg.addColorStop(1,'rgba(0,0,0,.38)'); g.fillStyle=pg; g.fillRect(A.x,A.y,A.w,A.h);
      g.fillStyle=t.acc; g.globalAlpha=.85; heart(W/2,430,130); g.globalAlpha=1; g.fillStyle=t.ink; g.textAlign='center'; g.textBaseline='middle';
      g.font='italic 400 52px "Playfair Display", Georgia, serif'; g.fillText('Your photo here',W/2,580); g.font='400 28px "DM Sans", system-ui, sans-serif'; g.globalAlpha=.75; g.fillText('Tap to add one',W/2,640); g.globalAlpha=1; }
    g.restore();
    g.strokeStyle=t.acc; g.lineWidth=5; arch(g,14); g.stroke(); g.lineWidth=1.5; arch(g,28); g.stroke();
    g.fillStyle=t.acc; [[78,300,28],[1004,230,22],[72,770,18],[1008,660,30],[150,92,14],[930,1000,0]].forEach(([x,y,s])=>s&&heart(x,y,s));
    g.textAlign='center'; g.textBaseline='middle'; g.font='italic 500 52px "Playfair Display", Georgia, serif';
    const label=st.line+'  ♥', pw=g.measureText(label).width+96, ph=94, py=A.y+A.h-ph/2+6;
    g.save(); g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=24; g.shadowOffsetY=8; g.fillStyle=t.pill; pill(W/2-pw/2,py,pw,ph); g.fill(); g.restore();
    g.fillStyle=t.pillInk; g.fillText(label,W/2,py+ph/2+2);
    g.textBaseline='alphabetic'; g.fillStyle=t.ink; g.font='400 74px "Playfair Display", Georgia, serif'; g.fillText('Elijah & Mary-Ann',W/2,1088);
    g.fillStyle=t.acc; g.font='500 30px "DM Sans", system-ui, sans-serif'; ls('3px'); g.fillText('TRADITIONAL 21.11  ·  WHITE 28.11  ·  2026',W/2,1140); ls('0px');
    const lg=logoFor(t.logo); if(lg){ const lh=92, lw=lh*lg.width/lg.height; g.drawImage(lg,W/2-lw/2,1166,lw,lh); }
    g.fillStyle=t.ink; g.globalAlpha=.75; g.font='400 27px "DM Sans", system-ui, sans-serif'; ls('2px'); g.fillText((st.name?st.name+'  ·  ':'')+'#KalutShefa26',W/2,1300); ls('0px'); g.globalAlpha=1;
  }
  let raf=0; const req=()=>{ if(!raf) raf=requestAnimationFrame(()=>{ raf=0; draw(); }); };
  const fontsReady=document.fonts?Promise.all(['italic 500 52px "Playfair Display"','400 74px "Playfair Display"','500 30px "DM Sans"'].map(f=>document.fonts.load(f))).catch(()=>{}):Promise.resolve();
  new IntersectionObserver((es,o)=>es.forEach(en=>{ if(en.isIntersecting){ fontsReady.then(draw); o.disconnect(); } }),{rootMargin:'300px'}).observe(cv); draw();
  const file=$('#boothFile'), zoom=$('#boothZoom');
  file.addEventListener('change',()=>{ const f=file.files[0]; if(!f) return; const im=new Image();
    im.onload=()=>{ st.img=im; st.zoom=1; st.ox=st.oy=0; zoom.value=1; draw(); $('#boothHint').textContent='Looking good! Drag to move it, pinch or slide to zoom.'; const r=cv.getBoundingClientRect(); fire({particleCount:60,spread:70,origin:{x:(r.left+r.width/2)/innerWidth,y:(r.top+r.height/3)/innerHeight}}); };
    im.onerror=()=>toast("That photo didn't open. Try a JPG or PNG."); im.src=URL.createObjectURL(f); file.value=''; });
  const ptrs=new Map(); let pinch0=1, zoom0=1; const k=()=>W/cv.getBoundingClientRect().width;
  cv.addEventListener('pointerdown',e=>{ if(!st.img){ file.click(); return; } cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch0=Math.hypot(a.x-b.x,a.y-b.y)||1; zoom0=st.zoom; } });
  cv.addEventListener('pointermove',e=>{ const p=ptrs.get(e.pointerId); if(!p) return;
    if(ptrs.size===1){ st.ox+=(e.clientX-p.x)*k(); st.oy+=(e.clientY-p.y)*k(); }
    p.x=e.clientX; p.y=e.clientY;
    if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; st.zoom=Math.max(1,Math.min(3,zoom0*Math.hypot(a.x-b.x,a.y-b.y)/pinch0)); zoom.value=st.zoom; }
    req(); });
  const up=e=>ptrs.delete(e.pointerId); cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ if(!st.img) return; e.preventDefault(); st.zoom=Math.max(1,Math.min(3,st.zoom-e.deltaY*.0015)); zoom.value=st.zoom; req(); },{passive:false});
  zoom.addEventListener('input',()=>{ st.zoom=+zoom.value; req(); });
  $('#boothName').addEventListener('input',e=>{ st.name=e.target.value.trim(); req(); });
  const seg=(id,key)=>$$('#'+id+' button').forEach(b=>b.addEventListener('click',()=>{ $$('#'+id+' button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); st[key]=b.dataset.v; req(); }));
  seg('boothLine','line'); seg('boothTheme','theme');
  async function out(share){ if(!st.img){ toast('Add your photo first 📸'); file.click(); return; } draw();
    const b=await new Promise(r=>cv.toBlob(r,'image/jpeg',.92)); const f=new File([b],'kalut-shefa-26.jpg',{type:'image/jpeg'});
    if(share && navigator.canShare && navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],text:"See you at Kalut-Shefa '26 💛 #KalutShefa26"}); return; }catch(e){ if(e.name==='AbortError') return; } }
    const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    toast('Saved! Post it on your status 💛'); }
  $('#boothShare').addEventListener('click',()=>out(true)); $('#boothSave').addEventListener('click',()=>out(false));
})();

})();
