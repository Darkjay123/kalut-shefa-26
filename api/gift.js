// Card gifts. With PAYSTACK_SECRET_KEY set (Vercel env var, never in the browser), every gift is checked
// with Paystack before it is recorded, using Paystack's own amount. Without it, rows are kept as "unverified".
const {pipe,clip,limited,body,send,fail}=require('./_db');
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{ok:false});
  try{
    const b=body(req); if(await limited(req,'gift',20,3600)) return send(res,429,{ok:false});
    const reference=clip(b.reference,80); if(!reference||!/^[A-Za-z0-9._=-]+$/.test(reference)) return send(res,400,{ok:false,error:'reference'});
    const [fresh]=await pipe([['SET','ks26:giftref:'+reference,'1','NX','EX','31536000']]);
    if(!fresh) return send(res,200,{ok:true,duplicate:true});
    let amount=Math.max(0,parseInt(b.amount_kobo)||0), email=clip(b.email,160), status='unverified';
    const sk=process.env.PAYSTACK_SECRET_KEY;
    if(sk){
      const r=await fetch('https://api.paystack.co/transaction/verify/'+encodeURIComponent(reference),{headers:{Authorization:'Bearer '+sk}});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.status||!d.data||d.data.status!=='success'){ await pipe([['DEL','ks26:giftref:'+reference]]); return send(res,400,{ok:false,error:'not_paid'}); }
      amount=+d.data.amount||0; email=clip((d.data.customer||{}).email,160)||email; status='verified';
    }
    const row={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),created_at:new Date().toISOString(),name:clip(b.name,120),email,
      amount_kobo:amount,reference,note:clip(b.note,600),status};
    await pipe([['LPUSH','ks26:gifts',JSON.stringify(row)]]); send(res,200,{ok:true,status});
  }catch(e){ fail(res,e); }
};
