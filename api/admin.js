const crypto=require('crypto');
const {pipe,body,send,fail}=require('./_db');
function authed(req){
  const pw=process.env.ADMIN_PASSWORD||''; const got=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!pw||!got) return false; const a=crypto.createHash('sha256').update(pw).digest(), b=crypto.createHash('sha256').update(got).digest();
  return crypto.timingSafeEqual(a,b);
}
const parse=a=>(a||[]).map(s=>{try{return JSON.parse(s)}catch(e){return null}}).filter(Boolean);
const K={rsvps:'ks26:rsvps',gifts:'ks26:gifts',notes:'ks26:notes',pending:'ks26:notes:pending'};
async function find(key,id){ const [all]=await pipe([['LRANGE',key,'0','-1']]); return (all||[]).find(s=>{try{return JSON.parse(s).id===id}catch(e){return false}}); }
module.exports=async(req,res)=>{
  try{
    if(!process.env.ADMIN_PASSWORD) return send(res,503,{ok:false,error:'no_password_set'});
    if(!authed(req)){ await new Promise(r=>setTimeout(r,600)); return send(res,401,{ok:false,error:'wrong_password'}); }
    if(req.method==='GET'){
      const [v,r,g,n,p,h]=await pipe([['LRANGE','ks26:visits','0','-1'],['LRANGE','ks26:rsvps','0','-1'],['LRANGE','ks26:gifts','0','-1'],
        ['LRANGE','ks26:notes','0','-1'],['LRANGE','ks26:notes:pending','0','-1'],['GET','ks26:hearts']]);
      return send(res,200,{ok:true,visits:parse(v),rsvps:parse(r),gifts:parse(g),notes:parse(n),pending:parse(p),hearts:+h||0});
    }
    if(req.method==='POST'){
      const b=body(req); if(!b.id) return send(res,400,{ok:false});
      if(b.action==='approve'){ const hit=await find(K.pending,b.id); if(hit) await pipe([['LREM',K.pending,'1',hit],['LPUSH',K.notes,hit]]); return send(res,200,{ok:true,approved:!!hit}); }
      if(b.action==='delete'){ const key=K[b.kind]||K.rsvps; const hit=await find(key,b.id); if(hit) await pipe([['LREM',key,'1',hit]]); return send(res,200,{ok:true,deleted:!!hit}); }
      return send(res,400,{ok:false});
    }
    send(res,405,{ok:false});
  }catch(e){ fail(res,e); }
};
