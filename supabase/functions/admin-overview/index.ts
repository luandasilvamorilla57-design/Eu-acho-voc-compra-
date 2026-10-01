import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const APP_ORIGIN='https://radar-do-brique.vercel.app'
function corsHeaders(req:Request){
  const origin=req.headers.get('origin')||''
  const local=/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const allowed=origin===APP_ORIGIN||local
  return {
    'Access-Control-Allow-Origin':allowed?origin:APP_ORIGIN,
    'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin',
    'Cache-Control':'no-store'
  }
}

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json; charset=utf-8"}});

Deno.serve(async(req:Request)=>{
  const cors=corsHeaders(req)
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido"},405);

  const url=Deno.env.get("SUPABASE_URL")||"";
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!key)return json({error:"Serviço indisponível."},503);

  try{
    const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
    if(!token)return json({error:"Sessão ausente."},401);
    const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:userError}=await admin.auth.getUser(token);
    if(userError||!user)return json({error:"Sessão inválida."},401);

    const {data:owner}=await admin.from("radar_config").select("acesso_total").eq("user_id",user.id).maybeSingle();
    if(owner?.acesso_total!==true)return json({error:"Acesso administrativo restrito."},403);

    const {data:billing}=await admin.from("billing_config").select("ambiente").eq("id",1).single();
    const env=String(billing?.ambiente||"test");
    const monthStart=new Date();
    monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0);
    const dayStart=new Date();dayStart.setUTCHours(0,0,0,0);
    const dayAgo=new Date(Date.now()-86400000).toISOString();

    const [
      usersResp,configsResp,subsResp,usageResp,analysisCount,purchaseCount,soldCount,draftCount,errorCount,recentErrors
    ]=await Promise.all([
      admin.auth.admin.listUsers({page:1,perPage:1000}),
      admin.from("radar_config").select("user_id,plano_atual,acesso_total,onboarding_concluido,data_atualizacao"),
      admin.from("assinaturas").select("user_id,plano,status,valor,gateway,ambiente,proxima_cobranca,ultimo_pagamento_em,valido_ate,updated_at").eq("ambiente",env).order("updated_at",{ascending:false}),
      admin.from("uso_plano_eventos").select("user_id,tipo,status,created_at").gte("created_at",monthStart.toISOString()),
      admin.from("analises").select("id",{count:"exact",head:true}),
      admin.from("compras").select("id",{count:"exact",head:true}),
      admin.from("compras").select("id",{count:"exact",head:true}).eq("status","vendido"),
      admin.from("anuncios_revenda").select("id",{count:"exact",head:true}),
      admin.from("client_errors").select("id",{count:"exact",head:true}).gte("created_at",dayAgo),
      admin.from("client_errors").select("context,message,created_at,user_id").order("created_at",{ascending:false}).limit(8)
    ]);

    const users=usersResp.data?.users||[];
    const configs=configsResp.data||[];
    const subs=subsResp.data||[];
    const usage=usageResp.data||[];
    const configMap=new Map(configs.map((x:any)=>[x.user_id,x]));
    const latestSub=new Map<string,any>();
    for(const s of subs)if(!latestSub.has(s.user_id))latestSub.set(s.user_id,s);

    const usageByUser=new Map<string,{month:number;today:number;sales:number;last:string|null}>();
    for(const u of usage){
      if(u.status!=="success"&&u.status!=="reserved")continue;
      const row=usageByUser.get(u.user_id)||{month:0,today:0,sales:0,last:null};
      if(u.tipo==="analise"){
        row.month++;
        if(new Date(u.created_at)>=dayStart)row.today++;
      }else if(u.tipo==="preparar_venda")row.sales++;
      if(!row.last||u.created_at>row.last)row.last=u.created_at;
      usageByUser.set(u.user_id,row);
    }

    const activeSubs=[...latestSub.values()].filter((s:any)=>["active","authorized"].includes(String(s.status).toLowerCase())&&s.ultimo_pagamento_em);
    const mrr=activeSubs.reduce((sum:number,s:any)=>sum+Number(s.valor||0),0);
    const plans={start:0,pro:0,max:0};
    for(const s of activeSubs){const p=String(s.plano) as keyof typeof plans;if(p in plans)plans[p]++}

    const rows=users.map((u:any)=>{
      const cfg=configMap.get(u.id) as any;
      const sub=latestSub.get(u.id);
      const us=usageByUser.get(u.id)||{month:0,today:0,sales:0,last:null};
      return{
        id:u.id,
        email:u.email||"",
        created_at:u.created_at,
        last_sign_in_at:u.last_sign_in_at,
        owner:Boolean(cfg?.acesso_total),
        onboarding:Boolean(cfg?.onboarding_concluido),
        plan:cfg?.acesso_total?"owner":(sub?.plano||cfg?.plano_atual||"sem_plano"),
        subscription_status:cfg?.acesso_total?"owner":(sub?.status||"none"),
        analyses_month:us.month,
        analyses_today:us.today,
        sale_generations_month:us.sales,
        last_usage:us.last
      };
    }).sort((a:any,b:any)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());

    return json({
      generated_at:new Date().toISOString(),
      environment:env,
      metrics:{
        users:users.length,
        active_subscriptions:activeSubs.length,
        mrr,
        analyses_total:analysisCount.count||0,
        purchases_total:purchaseCount.count||0,
        sold_total:soldCount.count||0,
        resale_drafts:draftCount.count||0,
        errors_24h:errorCount.count||0,
        analyses_this_month:usage.filter((u:any)=>u.tipo==="analise"&&(u.status==="success"||u.status==="reserved")).length
      },
      plans,
      users:rows.slice(0,200),
      recent_errors:recentErrors.data||[]
    });
  }catch(error){
    console.error("ADMIN_OVERVIEW_ERROR",error);
    return json({error:error instanceof Error?error.message:"Erro administrativo."},500);
  }
});
