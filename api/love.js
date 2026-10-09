// Public love: GET = hearts total + approved love-jar notes; POST {n} = add hearts; POST {kind:'note'} = drop a note (waits for approval)
const {pipe,clip,limited,body,send,fail}=require('./_db');
const pub=a=>(a||[]).map(s=>{try{const o=JSON.parse(s);return {id:o.id,name:o.name,note:o.note,side:o.side||null,created_at:o.created_at}}catch(e){return null}}).filter(Boolean);
module.exports=async(req,res)=>{
  try{
    if(req.method==='GET'){
      const [h,n]=await pipe([['GET','ks26:hearts'],['LRANGE','ks26:notes','0','79']]);
      return send(res,200,{ok:true,hearts:+h||0,notes:pub(n)});
    }
    if(req.method!=='POST') return send(res,405,{ok:false});
    const b=body(req);
    if(b.kind==='note'){
      if(b.company) return send(res,200,{ok:true}); // honeypot
      if(await limited(req,'note',6,3600)) return send(res,429,{ok:false,error:'slow_down'});
      const note=clip(b.note,280); if(!note||note.length<3) return send(res,400,{ok:false,error:'note'});
      const row={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),created_at:new Date().toISOString(),name:clip(b.name,60)||'A guest',note,
        side:['groom','bride','both'].includes(b.side)?b.side:null};
      await pipe([['LPUSH','ks26:notes:pending',JSON.stringify(row)],['LTRIM','ks26:notes:pending','0','1999']]);
      return send(res,200,{ok:true});
    }
    if(await limited(req,'love',40,60)) return send(res,429,{ok:false,error:'slow_down'});
    const n=Math.max(1,Math.min(60,parseInt(b.n)||1));
    const [h]=await pipe([['INCRBY','ks26:hearts',String(n)]]);
    send(res,200,{ok:true,hearts:+h||0});
  }catch(e){ fail(res,e); }
};
