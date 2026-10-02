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


Deno.serve(async(req:Request)=>{
  const cors=corsHeaders(req)
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json; charset=utf-8'}})
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido"},405);

  const auth=req.headers.get("authorization")||"";
  const token=auth.replace(/^Bearer\s+/i,"");
  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const mpToken=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";

  if(!token)return json({error:"Sessão ausente"},401);
  if(!supabaseUrl||!serviceKey)return json({error:"Serviço indisponível"},503);

  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await admin.auth.getUser(token);
  if(userError||!user)return json({error:"Sessão inválida ou expirada"},401);

  try{
    const {data:billing}=await admin.from("billing_config").select("ambiente").eq("id",1).maybeSingle();
    const env=billing?.ambiente==="production"?"production":"test";
    const {data:sub}=await admin.from("assinaturas")
      .select("id,plano,status,mercadopago_subscription_id,ultimo_pagamento_em,dados_gateway")
      .eq("user_id",user.id)
      .eq("ambiente",env)
      .order("updated_at",{ascending:false})
      .limit(1)
      .maybeSingle();

    if(mpToken&&sub?.mercadopago_subscription_id&&(!sub.ultimo_pagamento_em||String(sub.status)==="pending")){
      const subId=encodeURIComponent(String(sub.mercadopago_subscription_id));
      const [subRes,invoiceRes]=await Promise.all([
        fetch(`https://api.mercadopago.com/preapproval/${subId}`,{
          headers:{Authorization:`Bearer ${mpToken}`,"Content-Type":"application/json"}
        }),
        fetch(`https://api.mercadopago.com/authorized_payments/search?preapproval_id=${subId}&limit=20&offset=0`,{
          headers:{Authorization:`Bearer ${mpToken}`,"Content-Type":"application/json"}
        })
      ]);
      const remoteSub=await subRes.json().catch(()=>({}));
      const invoices=await invoiceRes.json().catch(()=>({}));
      const approved=(Array.isArray(invoices?.results)?invoices.results:[])
        .filter((x:any)=>x?.payment?.status==="approved")
        .sort((a:any,b:any)=>new Date(b?.last_modified||b?.date_created||b?.debit_date||0).getTime()-new Date(a?.last_modified||a?.date_created||a?.debit_date||0).getTime())[0];

      if(subRes.ok&&invoiceRes.ok&&approved){
        const paidAt=approved?.last_modified||approved?.date_created||approved?.debit_date||new Date().toISOString();
        const nextPayment=remoteSub?.next_payment_date??null;
        const status=String(remoteSub?.status||sub.status||"authorized");
        await admin.from("assinaturas").update({
          status,
          ultimo_pagamento_em:paidAt,
          proxima_cobranca:nextPayment,
          valido_ate:nextPayment,
          payer_email:remoteSub?.payer_email??null,
          valor:Number(remoteSub?.auto_recurring?.transaction_amount||0)||null,
          currency_id:String(remoteSub?.auto_recurring?.currency_id||"BRL"),
          dados_gateway:{...(sub.dados_gateway||{}),reconciled_from:"status-acesso",last_reconciled_at:new Date().toISOString()}
        }).eq("id",sub.id);
        await admin.from("radar_config").upsert({user_id:user.id,plano_atual:sub.plano},{onConflict:"user_id"});
        console.log("MP_ACCESS_RECONCILE_OK",JSON.stringify({userId:user.id,plan:sub.plano,subscriptionId:sub.mercadopago_subscription_id}));
      }
    }
  }catch(syncError){
    console.warn("MP_ACCESS_RECONCILE_FAILED",syncError instanceof Error?syncError.message:String(syncError));
  }

  try{
    const {data:billing}=await admin.from("billing_config").select("ambiente").eq("id",1).maybeSingle();
    const env=billing?.ambiente==="production"?"production":"test";
    const {data:allSubs}=await admin.from("assinaturas")
      .select("id,plano,status,mercadopago_subscription_id,ultimo_pagamento_em,valido_ate,proxima_cobranca,dados_gateway,created_at,updated_at")
      .eq("user_id",user.id)
      .eq("ambiente",env)
      .order("updated_at",{ascending:false});

    const canonical=(allSubs||[]).find((s:any)=>
      s?.ultimo_pagamento_em&&["authorized","active"].includes(String(s?.status||"").toLowerCase())
    );

    if(mpToken&&canonical?.mercadopago_subscription_id){
      for(const older of (allSubs||[])){
        if(!older?.mercadopago_subscription_id||older.id===canonical.id)continue;
        const remoteRes=await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(String(older.mercadopago_subscription_id))}`,{
          headers:{Authorization:`Bearer ${mpToken}`,"Content-Type":"application/json"}
        });
        const remote=await remoteRes.json().catch(()=>({}));
        const remoteStatus=String(remote?.status||older.status||"").toLowerCase();

        if(remoteRes.ok&&["pending","authorized","active"].includes(remoteStatus)){
          const cancelRes=await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(String(older.mercadopago_subscription_id))}`,{
            method:"PUT",
            headers:{Authorization:`Bearer ${mpToken}`,"Content-Type":"application/json"},
            body:JSON.stringify({status:"cancelled"})
          });
          const cancelled=await cancelRes.json().catch(()=>({}));
          if(cancelRes.ok){
            const validUntil=remote?.next_payment_date||older.valido_ate||older.proxima_cobranca||new Date().toISOString();
            await admin.from("assinaturas").update({
              status:"cancelled",
              cancelada_em:new Date().toISOString(),
              valido_ate:validUntil,
              dados_gateway:{...(older.dados_gateway||{}),duplicate_cancelled_by:"status-acesso",canonical_subscription_id:canonical.mercadopago_subscription_id}
            }).eq("id",older.id);
            console.log("MP_DUPLICATE_SUB_CANCELLED",JSON.stringify({
              userId:user.id,
              cancelledSubscriptionId:older.mercadopago_subscription_id,
              canonicalSubscriptionId:canonical.mercadopago_subscription_id,
              previousStatus:remoteStatus,
              responseStatus:cancelled?.status??null
            }));
          }
        }
      }
    }
  }catch(dedupeError){
    console.warn("MP_DUPLICATE_SUB_CLEANUP_FAILED",dedupeError instanceof Error?dedupeError.message:String(dedupeError));
  }

  const {data,error}=await admin.rpc("status_acesso_radar",{p_user_id:user.id});
  if(error){
    console.error("ACCESS_STATUS_ERROR",error);
    return json({error:"Não foi possível validar o acesso"},500);
  }

  const row=Array.isArray(data)?data[0]:data;
  return json({
    liberado:Boolean(row?.liberado),
    plano:row?.plano??null,
    owner_access:Boolean(row?.owner_access),
    assinatura_status:row?.assinatura_status??null,
    valido_ate:row?.valido_ate??null,
    analises_mes:Number(row?.analises_mes||0),
    analises_dia:Number(row?.analises_dia||0),
    usadas_mes:Number(row?.usadas_mes||0),
    usadas_dia:Number(row?.usadas_dia||0),
    geracoes_venda_mes:Number(row?.geracoes_venda_mes||0),
    usadas_venda_mes:Number(row?.usadas_venda_mes||0),
    creditos_extras:Number(row?.creditos_extras||0),
    proxima_cobranca:row?.proxima_cobranca??null,
    valor:row?.valor==null?null:Number(row.valor),
    gateway:row?.gateway??null,
  });
});
