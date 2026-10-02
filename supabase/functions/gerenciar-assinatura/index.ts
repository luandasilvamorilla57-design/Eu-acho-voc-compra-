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

async function mpPut(id:string,token:string,body:Record<string,unknown>){
  const response=await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
    body:JSON.stringify(body)
  });
  const raw=await response.json().catch(()=>({}));
  return {response,raw};
}

Deno.serve(async(req:Request)=>{
  const cors=corsHeaders(req)
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json; charset=utf-8'}})
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido"},405);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const mpToken=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
  const appUrl=(Deno.env.get("APP_URL")||APP_ORIGIN).replace(/\/$/,"");
  if(!supabaseUrl||!serviceKey||!mpToken)return json({error:"Serviço de cobrança indisponível."},503);

  try{
    const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
    if(!token)return json({error:"Sessão ausente."},401);

    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:userError}=await admin.auth.getUser(token);
    if(userError||!user?.id||!user.email)return json({error:"Sessão inválida ou expirada."},401);

    const {data:cfg}=await admin.from("radar_config").select("acesso_total").eq("user_id",user.id).maybeSingle();
    if(cfg?.acesso_total===true)return json({owner:true,message:"Conta proprietária não precisa gerenciar cobrança."});

    const {data:billing,error:billingError}=await admin
      .from("billing_config")
      .select("ambiente,test_payer_email")
      .eq("id",1)
      .single();
    if(billingError)return json({error:"Ambiente de cobrança não configurado."},503);

    const env=billing?.ambiente==="production"?"production":"test";

    const {data:sub,error:subError}=await admin.from("assinaturas")
      .select("*")
      .eq("user_id",user.id)
      .eq("ambiente",env)
      .in("status",["pending","authorized","active","cancelled"])
      .order("updated_at",{ascending:false})
      .limit(1)
      .maybeSingle();

    if(subError)throw subError;
    if(!sub)return json({error:"Nenhuma assinatura encontrada."},404);

    const body=await req.json().catch(()=>({}));
    const action=String(body?.action||"");

    if(action==="cancel"){
      if(sub.gateway!=="mercado_pago")return json({error:"Cancelamento automático deste gateway ainda não está configurado."},501);
      if(!sub.mercadopago_subscription_id)return json({error:"Integração de cobrança incompleta."},503);

      const updated=await mpPut(String(sub.mercadopago_subscription_id),mpToken,{status:"cancelled"});
      if(!updated.response.ok){
        console.error("SUB_CANCEL_MP_ERROR",updated.response.status,JSON.stringify(updated.raw));
        return json({error:updated.raw?.message||"Não foi possível cancelar a renovação."},updated.response.status);
      }

      const validUntil=sub.valido_ate||sub.proxima_cobranca||new Date().toISOString();
      const {error:updateError}=await admin.from("assinaturas").update({
        status:"cancelled",
        cancelada_em:new Date().toISOString(),
        valido_ate:validUntil,
        dados_gateway:{...(sub.dados_gateway||{}),cancelled_from:"radar_account"}
      }).eq("id",sub.id);
      if(updateError)throw updateError;
      return json({ok:true,status:"cancelled",valido_ate:validUntil});
    }

    if(action==="change_plan"){
      const plan=String(body?.plano||"");
      if(!["start","pro","max"].includes(plan))return json({error:"Plano inválido."},400);
      if(plan===sub.plano)return json({ok:true,unchanged:true,plano:plan});
      if(sub.gateway!=="mercado_pago")return json({error:"Troca automática deste gateway ainda não está configurada."},501);
      if(!sub.mercadopago_subscription_id)return json({error:"Integração de cobrança incompleta."},503);

      const {data:catalog,error:catalogError}=await admin
        .from("planos_catalogo")
        .select("slug,nome,preco_mensal")
        .in("slug",[String(sub.plano),plan])
        .eq("ativo",true);
      if(catalogError||!catalog?.length)return json({error:"Planos indisponíveis."},404);

      const currentCatalog=catalog.find((p:any)=>p.slug===sub.plano);
      const targetCatalog=catalog.find((p:any)=>p.slug===plan);
      if(!currentCatalog||!targetCatalog)return json({error:"Não foi possível comparar os planos."},404);

      const currentPrice=Number(currentCatalog.preco_mensal);
      const targetPrice=Number(targetCatalog.preco_mensal);

      // Upgrade: nunca libera o plano novo antes de um pagamento aprovado.
      if(targetPrice>currentPrice){
        const difference=Number((targetPrice-currentPrice).toFixed(2));
        const payerEmail=env==="test"?String(billing?.test_payer_email||"").trim():user.email;
        if(!payerEmail)return json({error:"Comprador de teste do Mercado Pago ainda não configurado."},503);

        const externalReference=`radar-upgrade:${user.id}:${plan}`;
        const notificationUrl=`${supabaseUrl}/functions/v1/mercadopago-webhook`;

        await admin.from("pagamentos_upgrade")
          .update({status:"superseded"})
          .eq("user_id",user.id)
          .eq("ambiente",env)
          .eq("status","pending");

        const preferencePayload={
          items:[{
            id:`upgrade-${sub.plano}-${plan}`,
            title:`Upgrade BRIKE ${String(sub.plano).toUpperCase()} → ${String(plan).toUpperCase()}`,
            description:`Diferença para liberar o plano BRIKE ${String(targetCatalog.nome)} agora`,
            quantity:1,
            currency_id:"BRL",
            unit_price:difference
          }],
          payer:{email:payerEmail},
          external_reference:externalReference,
          notification_url:notificationUrl,
          back_urls:{
            success:`${appUrl}/?checkout=upgrade&status=success&plano=${plan}`,
            pending:`${appUrl}/?checkout=upgrade&status=pending&plano=${plan}`,
            failure:`${appUrl}/?checkout=upgrade&status=failure&plano=${plan}`
          },
          auto_return:"approved",
          statement_descriptor:"BRIKE RADAR"
        };

        const response=await fetch("https://api.mercadopago.com/checkout/preferences",{
          method:"POST",
          headers:{"Content-Type":"application/json",Authorization:`Bearer ${mpToken}`},
          body:JSON.stringify(preferencePayload)
        });
        const raw=await response.json().catch(()=>({}));
        if(!response.ok||!raw?.id){
          console.error("SUB_UPGRADE_CHECKOUT_ERROR",response.status,JSON.stringify(raw));
          return json({error:raw?.message||"Não foi possível abrir o pagamento do upgrade."},response.status>=400&&response.status<600?response.status:502);
        }

        const {error:insertError}=await admin.from("pagamentos_upgrade").insert({
          user_id:user.id,
          gateway:"mercado_pago",
          ambiente:env,
          external_reference:externalReference,
          from_plan:String(sub.plano),
          to_plan:plan,
          current_subscription_id:String(sub.mercadopago_subscription_id),
          valor:difference,
          status:"pending",
          preference_id:String(raw.id),
          payload:{target_monthly_price:targetPrice}
        });
        if(insertError)throw insertError;

        const checkout=env==="test"?(raw.sandbox_init_point||raw.init_point):raw.init_point;
        return json({
          ok:true,
          requires_payment:true,
          checkout_url:checkout,
          from_plan:sub.plano,
          plano:plan,
          valor:difference,
          proxima_mensalidade:targetPrice
        });
      }

      // Downgrade: não exige nova cobrança; altera a renovação e o acesso para o plano menor.
      const ref=`radar:${user.id}:${plan}`;
      const updated=await mpPut(String(sub.mercadopago_subscription_id),mpToken,{
        reason:`Radar do Brique - Plano ${targetCatalog.nome}`,
        external_reference:ref,
        auto_recurring:{transaction_amount:targetPrice,currency_id:"BRL"}
      });
      if(!updated.response.ok){
        console.error("SUB_CHANGE_MP_ERROR",updated.response.status,JSON.stringify(updated.raw));
        return json({error:updated.raw?.message||"Não foi possível trocar o plano."},updated.response.status);
      }

      const {error:updateError}=await admin.from("assinaturas").update({
        plano:plan,
        external_reference:ref,
        valor:targetPrice,
        proxima_cobranca:updated.raw?.next_payment_date??sub.proxima_cobranca,
        dados_gateway:{...(sub.dados_gateway||{}),changed_from:"radar_account_downgrade",last_plan_change_at:new Date().toISOString()}
      }).eq("id",sub.id);
      if(updateError)throw updateError;

      await admin.from("radar_config").upsert({user_id:user.id,plano_atual:plan},{onConflict:"user_id"});
      return json({ok:true,plano:plan,valor:targetPrice,downgrade:true});
    }

    return json({error:"Ação inválida."},400);
  }catch(error){
    console.error("SUB_MANAGE_ERROR",error);
    return json({error:error instanceof Error?error.message:"Não foi possível gerenciar a assinatura."},500);
  }
});
