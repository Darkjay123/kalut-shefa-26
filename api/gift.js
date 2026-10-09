// Card gifts. The browser only sends a reference; the amount, status and payer all come from Paystack
// (GET /transaction/verify with the secret key held in Vercel env). Anything Paystack doesn't confirm is rejected.
const {limited,clip,body,send,fail}=require('./_db');
const {record}=require('./_gift');
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{ok:false});
  try{
    const b=body(req); if(await limited(req,'gift',20,3600)) return send(res,429,{ok:false});
    const reference=clip(b.reference,80); if(!reference||!/^[A-Za-z0-9._=-]+$/.test(reference)) return send(res,400,{ok:false,error:'reference'});
    const sk=process.env.PAYSTACK_SECRET_KEY; if(!sk) return send(res,503,{ok:false,error:'not_configured'});
    const r=await fetch('https://api.paystack.co/transaction/verify/'+encodeURIComponent(reference),{headers:{Authorization:'Bearer '+sk}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.status||!d.data) return send(res,400,{ok:false,error:'not_paid'});
    const out=await record(d.data,{name:b.name,email:b.email,note:b.note});
    send(res,out.ok?200:400,out);
  }catch(e){ fail(res,e); }
};
