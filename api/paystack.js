const crypto=require('crypto');
const {send,fail}=require('./_db');
const {record}=require('./_gift');
function raw(req){ return new Promise((ok,no)=>{ const c=[]; req.on('data',x=>c.push(x)); req.on('end',()=>ok(Buffer.concat(c))); req.on('error',no); }); }
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{ok:false});
  try{
    const sk=process.env.PAYSTACK_SECRET_KEY; if(!sk) return send(res,503,{ok:false});
    const buf=await raw(req); const sig=String(req.headers['x-paystack-signature']||'');
    const want=crypto.createHmac('sha512',sk).update(buf).digest('hex');
    if(sig.length!==want.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want))) return send(res,401,{ok:false});
    let ev={}; try{ ev=JSON.parse(buf.toString('utf8')); }catch(e){}
    if(ev.event==='charge.success'&&ev.data) await record(ev.data);
    send(res,200,{ok:true});
  }catch(e){ fail(res,e); }
};
