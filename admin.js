(function(){
const C=window.KS_CONFIG||{}; const $=s=>document.querySelector(s);
const live=!!(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&window.supabase);
const sb=live?window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
let data={visits:[],rsvps:[],gifts:[]}, charts={};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const naira=k=>'₦'+(k/100).toLocaleString();
const when=d=>new Date(d).toLocaleString('en-NG',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});

async function init(){
  if(!live){ $('#demoBanner').style.display='block'; $('#logout').style.display='none'; $('#dash').style.display='block'; demo(); render(); return; }
  const {data:{session}}=await sb.auth.getSession();
  if(session){ showDash(); } else { $('#loginView').style.display='block'; }
}
$('#loginBtn').onclick=async()=>{ $('#loginErr').textContent=''; const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value}); if(error){$('#loginErr').textContent=error.message;return;} $('#loginView').style.display='none'; showDash(); };
$('#pw').addEventListener('keydown',e=>{if(e.key==='Enter')$('#loginBtn').click()});
$('#logout').onclick=async()=>{ await sb.auth.signOut(); location.reload(); };
$('#refresh').onclick=()=>live?load():(demo(),render());
async function showDash(){ $('#dash').style.display='block'; await load(); }
async function load(){
  const [v,r,g]=await Promise.all([
    sb.from('visits').select('created_at,visitor_id,device,referrer,utm_source,is_new').order('created_at',{ascending:false}).limit(20000),
    sb.from('rsvps').select('*').order('created_at',{ascending:false}),
    sb.from('gifts').select('*').order('created_at',{ascending:false})]);
  if(v.error||r.error){ alert('Could not load data: '+(v.error||r.error).message+'\nIs this email listed in the admins table?'); return; }
  data={visits:v.data,rsvps:r.data,gifts:g.data||[]}; render();
}
function demo(){
  const now=Date.now(), rnd=n=>Math.floor(Math.random()*n); const names=['Tobi Adeyemi','Chioma Okafor','Efe Omoregie','Blessing Eze','Ifeanyi Obi','Ruth Akpan','David Ogbe','Ada Nwosu'];
  const visits=[]; for(let i=0;i<30;i++){ const n=5+rnd(25)+i*2; for(let j=0;j<n;j++) visits.push({created_at:new Date(now-(29-i)*864e5-rnd(864e5)).toISOString(),visitor_id:'v'+rnd(260),device:['mobile','mobile','mobile','desktop','tablet'][rnd(5)],referrer:['https://web.whatsapp.com/','','https://www.instagram.com/','https://t.co/'][rnd(4)]}); }
  const rsvps=names.map((n,i)=>({created_at:new Date(now-rnd(20)*864e5).toISOString(),full_name:n,phone:'0803'+(1000000+rnd(8999999)),email:null,attending:i===3?'no':'yes',events:i%3===0?['traditional']:['traditional','white'],guests:i===3?0:1+rnd(3),side:['groom','bride','both'][rnd(3)],message:['Congratulations! God bless your home.','So happy for you both!','Ease and abundance indeed 💛',''][rnd(4)]}));
  const gifts=[{created_at:new Date(now-2*864e5).toISOString(),name:'Chioma Okafor',email:'c@example.com',amount_kobo:2000000,note:'Love you guys',reference:'KS26-demo-1'}];
  const loc=k=>JSON.parse(localStorage.getItem('ks_demo_'+k)||'[]');
  data={visits:[...loc('visits'),...visits],rsvps:[...loc('rsvps'),...rsvps],gifts:[...loc('gifts'),...gifts]};
}
function host(r){ try{ if(!r) return 'Direct / WhatsApp app'; const h=new URL(r).hostname.replace('www.',''); return /whatsapp/.test(h)?'WhatsApp':/t\.co|twitter|x\.com/.test(h)?'X (Twitter)':/instagram/.test(h)?'Instagram':/facebook|fb\./.test(h)?'Facebook':h; }catch(e){ return 'Other'; } }
function render(){
  const {visits,rsvps,gifts}=data; const today=new Date().toDateString();
  $('#kVisits').textContent=visits.length.toLocaleString();
  $('#kToday').textContent=visits.filter(v=>new Date(v.created_at).toDateString()===today).length+' today';
  $('#kUnique').textContent=new Set(visits.map(v=>v.visitor_id)).size.toLocaleString();
  const yes=rsvps.filter(r=>r.attending==='yes'); $('#kRsvp').textContent=rsvps.length; $('#kRsvpSplit').textContent=`${yes.length} yes · ${rsvps.length-yes.length} no`;
  const sum=ev=>yes.filter(r=>(r.events||[]).includes(ev)).reduce((a,r)=>a+(r.guests||1),0);
  $('#kTrad').textContent=sum('traditional'); $('#kWhite').textContent=sum('white');
  $('#kGifts').textContent=naira(gifts.reduce((a,g)=>a+(+g.amount_kobo||0),0)); $('#kGiftCount').textContent=gifts.length+' gifts';
  // chart visits
  const days=[...Array(30)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-29+i);return d;});
  const counts=days.map(d=>visits.filter(v=>{const x=new Date(v.created_at);return x>=d&&x<new Date(d.getTime()+864e5)}).length);
  const uniq=days.map(d=>new Set(visits.filter(v=>{const x=new Date(v.created_at);return x>=d&&x<new Date(d.getTime()+864e5)}).map(v=>v.visitor_id)).size);
  if(window.Chart){
    Chart.defaults.color='rgba(251,247,240,.6)'; Chart.defaults.font.family='Jost';
    charts.v&&charts.v.destroy(); const ctx=$('#chartVisits').getContext('2d'); const g=ctx.createLinearGradient(0,0,0,300); g.addColorStop(0,'rgba(216,187,138,.45)'); g.addColorStop(1,'rgba(216,187,138,0)');
    charts.v=new Chart(ctx,{type:'line',data:{labels:days.map(d=>d.toLocaleDateString('en-NG',{day:'numeric',month:'short'})),datasets:[{label:'Visits',data:counts,borderColor:'#d8bb8a',backgroundColor:g,fill:true,tension:.4,pointRadius:0,borderWidth:2},{label:'Unique',data:uniq,borderColor:'#b4283b',tension:.4,pointRadius:0,borderWidth:2}]},options:{plugins:{legend:{labels:{boxWidth:10}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8}},y:{grid:{color:'rgba(216,187,138,.08)'},beginAtZero:true}}}});
    const dev={}; visits.forEach(v=>dev[v.device||'unknown']=(dev[v.device||'unknown']||0)+1);
    charts.d&&charts.d.destroy(); charts.d=new Chart($('#chartDevices'),{type:'doughnut',data:{labels:Object.keys(dev),datasets:[{data:Object.values(dev),backgroundColor:['#6e0f1f','#d8bb8a','#5f6b34','#f1dfbd'],borderColor:'#21060e',borderWidth:3}]},options:{cutout:'68%',plugins:{legend:{position:'bottom',labels:{boxWidth:10}}}}});
  }
  const src={}; visits.forEach(v=>{const h=v.utm_source||host(v.referrer); src[h]=(src[h]||0)+1}); $('#sources').innerHTML=Object.entries(src).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,n])=>`<li><span>${esc(k)}</span><b>${n}</b></li>`).join('');
  table(); $('#giftRows').innerHTML=gifts.map(g=>`<tr><td>${when(g.created_at)}</td><td>${esc(g.name||'Anonymous')}<br><small style="opacity:.6">${esc(g.email)}</small></td><td>${naira(g.amount_kobo)}</td><td class="msg">${esc(g.note)}</td><td><small>${esc(g.reference)}</small></td></tr>`).join('')||'<tr><td colspan="5" style="opacity:.5">No card gifts yet.</td></tr>';
}
function filtered(){ const q=$('#q').value.toLowerCase(), a=$('#fAtt').value, e=$('#fEv').value;
  return data.rsvps.filter(r=>(!a||r.attending===a)&&(!e||(r.events||[]).includes(e))&&(!q||[r.full_name,r.phone,r.email,r.message].join(' ').toLowerCase().includes(q))); }
function table(){ const ev={traditional:'Trad',white:'White'}, side={groom:'Elijah',bride:'Mary-ann',both:'Both'};
  $('#rsvpRows').innerHTML=filtered().map(r=>`<tr><td>${when(r.created_at)}</td><td><b style="font-weight:500">${esc(r.full_name)}</b></td><td>${esc(r.phone)}${r.email?'<br><small style="opacity:.6">'+esc(r.email)+'</small>':''}</td><td><span class="pill ${r.attending}">${r.attending==='yes'?'Attending':'Not attending'}</span></td><td>${(r.events||[]).map(x=>ev[x]||x).join(' + ')||'–'}</td><td>${r.guests||'–'}</td><td>${side[r.side]||'–'}</td><td class="msg">${esc(r.message)}</td></tr>`).join('')||'<tr><td colspan="8" style="opacity:.5">No RSVPs yet.</td></tr>'; }
['#q','#fAtt','#fEv'].forEach(s=>$(s).addEventListener('input',table));
$('#csv').onclick=()=>{ const rows=[['created_at','full_name','phone','email','attending','events','guests','side','message'],...filtered().map(r=>[r.created_at,r.full_name,r.phone,r.email,r.attending,(r.events||[]).join('|'),r.guests,r.side,r.message])];
  const csv=rows.map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='kalut-shefa-rsvps.csv'; a.click(); };
init();
})();
