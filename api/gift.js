const {pipe,clip,limited,body,send,fail}=require('./_db');
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{ok:false});
  try{
    const b=body(req); if(await limited(req,'gift',20,3600)) return send(res,429,{ok:false});
    const row={id:Date.now().toString(36),created_at:new Date().toISOString(),name:clip(b.name,120),email:clip(b.email,160),
      amount_kobo:Math.max(0,parseInt(b.amount_kobo)||0),reference:clip(b.reference,80),note:clip(b.note,600),status:clip(b.status,30)||'reported'};
    await pipe([['LPUSH','gifts',JSON.stringify(row)]]); send(res,200,{ok:true});
  }catch(e){ fail(res,e); }
};
