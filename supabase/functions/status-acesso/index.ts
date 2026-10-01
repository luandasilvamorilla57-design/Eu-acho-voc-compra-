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

  if(!token)return json({error:"Sessão ausente"},401);
  if(!supabaseUrl||!serviceKey)return json({error:"Serviço indisponível"},503);

  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await admin.auth.getUser(token);
  if(userError||!user)return json({error:"Sessão inválida ou expirada"},401);

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
