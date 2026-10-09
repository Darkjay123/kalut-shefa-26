const {pipe,clip,limited,body,send,fail}=require('./_db');
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{ok:false});
  try{
    const b=body(req); if(await limited(req,'visit',60,3600)) return send(res,200,{ok:true});
    const row={created_at:new Date().toISOString(),visitor_id:clip(b.visitor_id,64),is_new:!!b.is_new,device:['mobile','desktop','tablet'].includes(b.device)?b.device:'unknown',
      referrer:clip(b.referrer,200),utm_source:clip(b.utm_source,60),country:clip(req.headers['x-vercel-ip-country'],4),city:clip(decodeURIComponent(req.headers['x-vercel-ip-city']||''),60)};
    await pipe([['LPUSH','ks26:visits',JSON.stringify(row)],['LTRIM','ks26:visits','0','49999']]); send(res,200,{ok:true});
  }catch(e){ fail(res,e); }
};
