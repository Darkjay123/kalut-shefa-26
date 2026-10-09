// Builds a gift record from Paystack's own transaction data (never from what the browser claims).
const {pipe,clip}=require('./_db');
function field(meta,name){ const f=((meta||{}).custom_fields||[]).find(x=>x&&x.variable_name===name); const v=f&&f.value; return v&&v!=='-'&&v!=='Anonymous'?v:null; }
async function record(tx,fallback={}){
  const ref=clip(tx.reference,80); if(!ref) return {ok:false,error:'reference'};
  if(tx.status!=='success') return {ok:false,error:'not_paid'};
  if(tx.currency!=='NGN') return {ok:false,error:'currency'};
  const amount=+tx.amount||0; if(amount<100) return {ok:false,error:'amount'};
  const [fresh]=await pipe([['SET','ks26:giftref:'+ref,'1','NX','EX','31536000']]);
  if(!fresh) return {ok:true,duplicate:true};
  const meta=typeof tx.metadata==='string'?(()=>{try{return JSON.parse(tx.metadata)}catch(e){return {}}})():tx.metadata;
  const row={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),created_at:new Date().toISOString(),
    paid_at:clip(tx.paid_at||tx.paidAt,40),channel:clip(tx.channel,30),
    name:clip(field(meta,'guest')||fallback.name,120),email:clip((tx.customer||{}).email||fallback.email,160),
    amount_kobo:amount,reference:ref,note:clip(field(meta,'note')||fallback.note,600),status:'verified'};
  await pipe([['LPUSH','ks26:gifts',JSON.stringify(row)]]);
  return {ok:true,status:'verified'};
}
module.exports={record};
