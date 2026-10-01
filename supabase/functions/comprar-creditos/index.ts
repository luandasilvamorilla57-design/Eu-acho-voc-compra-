import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const APP_ORIGIN='https://radar-do-brique.vercel.app'
const TEST_PAYER_EMAIL="test@testuser.com"
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

  const mpToken=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const appUrl=(Deno.env.get("APP_URL")||"https://radar-do-brique.vercel.app").replace(/\/$/,"");
  if(!mpToken||!supabaseUrl||!serviceKey)return json({error:"Pagamento ainda não está configurado."},503);

  try{
    const auth=req.headers.get("authorization")||"";
    const token=auth.replace(/^Bearer\s+/i,"");
    if(!token)return json({error:"Sessão ausente."},401);

    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:userError}=await admin.auth.getUser(token);
    if(userError||!user?.id||!user.email)return json({error:"Sessão inválida ou expirada."},401);

    const {data:config}=await admin.from("radar_config").select("acesso_total").eq("user_id",user.id).maybeSingle();
    if(config?.acesso_total===true)return json({no_need:true,message:"Sua conta já possui acesso ilimitado."});

    const {data:billing,error:billingError}=await admin.from("billing_config").select("ambiente").eq("id",1).single();
    if(billingError)return json({error:"Ambiente de cobrança não configurado."},503);
    const environment=billing?.ambiente==="production"?"production":"test";

    const body=await req.json().catch(()=>({}));
    const slug=String(body?.pacote||"extra20");
    const {data:pack,error:packError}=await admin.from("pacotes_extras_catalogo").select("*").eq("slug",slug).eq("ativo",true).single();
    if(packError||!pack)return json({error:"Pacote indisponível."},404);

    const externalReference=`radar-extra:${user.id}:${pack.quantidade}`;
    const payerEmail=environment==="test"?TEST_PAYER_EMAIL:user.email;
    const notificationUrl=`${supabaseUrl}/functions/v1/mercadopago-webhook`;
    const payload={
      items:[{
        id:slug,
        title:`BRIKE RADAR - ${pack.nome}`,
        description:"Créditos extras de análise para o BRIKE RADAR",
        quantity:1,
        currency_id:"BRL",
        unit_price:Number(pack.preco)
      }],
      payer:{email:payerEmail},
      external_reference:externalReference,
      notification_url:notificationUrl,
      back_urls:{
        success:`${appUrl}/?checkout=extra&status=success`,
        pending:`${appUrl}/?checkout=extra&status=pending`,
        failure:`${appUrl}/?checkout=extra&status=failure`
      },
      auto_return:"approved",
      statement_descriptor:"BRIKE RADAR"
    };

    const response=await fetch("https://api.mercadopago.com/checkout/preferences",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${mpToken}`},
      body:JSON.stringify(payload)
    });
    const raw=await response.json().catch(()=>({}));
    if(!response.ok||!raw?.id){
      console.error("EXTRA_CHECKOUT_MP_ERROR",response.status,JSON.stringify(raw));
      return json({error:raw?.message||"Não foi possível abrir o pagamento do pacote."},response.status>=400&&response.status<600?response.status:502);
    }

    await admin.from("pagamentos_extras").insert({
      user_id:user.id,
      gateway:"mercado_pago",
      ambiente:environment,
      external_reference:externalReference,
      quantidade:Number(pack.quantidade),
      valor:Number(pack.preco),
      status:"pending",
      payload:{preference_id:String(raw.id)}
    });

    const checkout=environment==="test"?(raw.sandbox_init_point||raw.init_point):raw.init_point;
    return json({checkout_url:checkout,preference_id:String(raw.id),quantidade:Number(pack.quantidade),valor:Number(pack.preco)});
  }catch(error){
    console.error("EXTRA_CHECKOUT_ERROR",error);
    return json({error:error instanceof Error?error.message:"Erro ao iniciar pagamento."},500);
  }
});
