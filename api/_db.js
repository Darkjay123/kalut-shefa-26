// Tiny Upstash Redis REST client (no npm deps). Works with Vercel's Upstash integration env vars.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function pipe(cmds){
  if(!URL_||!TOKEN) { const e=new Error('Database not connected'); e.code=503; throw e; }
  const r = await fetch(URL_.replace(/\/$/,'')+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+TOKEN,'Content-Type':'application/json'},body:JSON.stringify(cmds)});
  if(!r.ok){ const e=new Error('Database error '+r.status); e.code=502; throw e; }
  const out = await r.json(); return out.map(x=>{ if(x.error) throw new Error(x.error); return x.result; });
}
const clip=(v,n)=>v==null?null:String(v).trim().slice(0,n)||null;
const ip=req=>(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'0';
async function limited(req,key,max,secs){ const k=`ks26:rl:${key}:${ip(req)}`; const [,n]=await pipe([['SET',k,'0','EX',String(secs),'NX'],['INCR',k]]); return n>max; }
function body(req){ let b=req.body; if(typeof b==='string'){ try{ b=JSON.parse(b);}catch(e){ b={}; } } return b||{}; }
function send(res,code,obj){ res.statusCode=code; res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(obj)); }
function fail(res,e){ console.error(e); send(res,e.code||500,{ok:false,error:e.code===503?'not_connected':'server_error'}); }
module.exports={pipe,clip,limited,body,send,fail};
