import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json; charset=utf-8"}});

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
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido"},405);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const mpToken=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
  if(!supabaseUrl||!serviceKey)return json({error:"Serviço indisponível."},503);

  try{
    const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
    if(!token)return json({error:"Sessão ausente."},401);

    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:userError}=await admin.auth.getUser(token);
    if(userError||!user)return json({error:"Sessão inválida ou expirada."},401);

    const {data:cfg}=await admin.from("radar_config").select("acesso_total").eq("user_id",user.id).maybeSingle();
    if(cfg?.acesso_total===true)return json({owner:true,message:"Conta proprietária não precisa gerenciar cobrança."});

    const {data:billing}=await admin.from("billing_config").select("ambiente").eq("id",1).single();
    const env=String(billing?.ambiente||"test");
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
      if(!mpToken||!sub.mercadopago_subscription_id)return json({error:"Integração de cobrança incompleta."},503);

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
      if(!mpToken||!sub.mercadopago_subscription_id)return json({error:"Integração de cobrança incompleta."},503);

      const {data:catalog,error:catalogError}=await admin.from("planos_catalogo").select("slug,nome,preco_mensal").eq("slug",plan).eq("ativo",true).single();
      if(catalogError||!catalog)return json({error:"Plano indisponível."},404);

      const ref=`radar:${user.id}:${plan}`;
      const updated=await mpPut(String(sub.mercadopago_subscription_id),mpToken,{
        reason:`Radar do Brique - Plano ${catalog.nome}`,
        external_reference:ref,
        auto_recurring:{transaction_amount:Number(catalog.preco_mensal),currency_id:"BRL"}
      });
      if(!updated.response.ok){
        console.error("SUB_CHANGE_MP_ERROR",updated.response.status,JSON.stringify(updated.raw));
        return json({error:updated.raw?.message||"Não foi possível trocar o plano."},updated.response.status);
      }

      const {error:updateError}=await admin.from("assinaturas").update({
        plano:plan,
        external_reference:ref,
        valor:Number(catalog.preco_mensal),
        proxima_cobranca:updated.raw?.next_payment_date??sub.proxima_cobranca,
        dados_gateway:{...(sub.dados_gateway||{}),changed_from:"radar_account",last_plan_change_at:new Date().toISOString()}
      }).eq("id",sub.id);
      if(updateError)throw updateError;

      await admin.from("radar_config").upsert({user_id:user.id,plano_atual:plan},{onConflict:"user_id"});
      return json({ok:true,plano:plan,valor:Number(catalog.preco_mensal)});
    }

    return json({error:"Ação inválida."},400);
  }catch(error){
    console.error("SUB_MANAGE_ERROR",error);
    return json({error:error instanceof Error?error.message:"Não foi possível gerenciar a assinatura."},500);
  }
});
