const {pipe,clip,limited,body,send,fail}=require('./_db');
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{ok:false});
  try{
    const b=body(req); if(b.company) return send(res,200,{ok:true}); // honeypot
    if(await limited(req,'rsvp',15,3600)) return send(res,429,{ok:false,error:'slow_down'});
    const name=clip(b.full_name,120); if(!name) return send(res,400,{ok:false,error:'name'});
    const att=b.attending==='no'?'no':'yes';
    const ev=Array.isArray(b.events)?b.events.filter(x=>x==='traditional'||x==='white'):[];
    const row={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),created_at:new Date().toISOString(),full_name:name,phone:clip(b.phone,40),email:clip(b.email,160),
      attending:att,events:att==='yes'?ev:[],guests:att==='yes'?Math.max(1,Math.min(10,parseInt(b.guests)||1)):0,
      side:['groom','bride','both'].includes(b.side)?b.side:null,message:clip(b.message,1000),visitor_id:clip(b.visitor_id,64)};
    await pipe([['LPUSH','rsvps',JSON.stringify(row)]]);
    send(res,200,{ok:true});
  }catch(e){ fail(res,e); }
};
