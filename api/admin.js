const crypto=require('crypto');
const {pipe,body,send,fail}=require('./_db');
function authed(req){
  const pw=process.env.ADMIN_PASSWORD||''; const got=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!pw||!got) return false; const a=crypto.createHash('sha256').update(pw).digest(), b=crypto.createHash('sha256').update(got).digest();
  return crypto.timingSafeEqual(a,b);
}
const parse=a=>(a||[]).map(s=>{try{return JSON.parse(s)}catch(e){return null}}).filter(Boolean);
module.exports=async(req,res)=>{
  try{
    if(!process.env.ADMIN_PASSWORD) return send(res,503,{ok:false,error:'no_password_set'});
    if(!authed(req)){ await new Promise(r=>setTimeout(r,600)); return send(res,401,{ok:false,error:'wrong_password'}); }
    if(req.method==='GET'){
      const [v,r,g]=await pipe([['LRANGE','visits','0','-1'],['LRANGE','rsvps','0','-1'],['LRANGE','gifts','0','-1']]);
      return send(res,200,{ok:true,visits:parse(v),rsvps:parse(r),gifts:parse(g)});
    }
    if(req.method==='POST'){ // delete a spam RSVP or gift entry
      const b=body(req); const kind=b.kind==='gifts'?'gifts':'rsvps';
      if(b.action!=='delete'||!b.id) return send(res,400,{ok:false});
      const [all]=await pipe([['LRANGE',kind,'0','-1']]); const hit=(all||[]).find(s=>{try{return JSON.parse(s).id===b.id}catch(e){return false}});
      if(hit) await pipe([['LREM',kind,'1',hit]]); return send(res,200,{ok:true,deleted:!!hit});
    }
    send(res,405,{ok:false});
  }catch(e){ fail(res,e); }
};
