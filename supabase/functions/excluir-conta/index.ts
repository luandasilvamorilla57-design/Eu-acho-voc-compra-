import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'

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


Deno.serve(async req=>{
  const cors=corsHeaders(req)
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const auth=req.headers.get('authorization')||''
  const token=auth.replace(/^Bearer\s+/i,'')
  if(!token)return Response.json({error:'Sessão ausente.'},{status:401,headers:cors})

  const url=Deno.env.get('SUPABASE_URL')
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if(!url||!serviceKey)return Response.json({error:'Serviço indisponível.'},{status:503,headers:cors})

  const payload=(()=>{try{const p=token.split('.')[1];return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/')))}catch{return null}})()
  const issuedAt=Number(payload?.iat||0)
  if(!issuedAt||Date.now()/1000-issuedAt>300)return Response.json({error:'Por segurança, confirme sua senha novamente antes de excluir a conta.',code:'REAUTH_REQUIRED'},{status:403,headers:cors})

  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error:userError}=await admin.auth.getUser(token)
  if(userError||!user)return Response.json({error:'Sessão inválida ou expirada.'},{status:401,headers:cors})

  try{
    const [{data:purchases},{data:drafts}]=await Promise.all([
      admin.from('compras').select('fotos').eq('user_id',user.id),
      admin.from('anuncios_revenda').select('fotos').eq('user_id',user.id)
    ])
    const purchasePaths=(purchases??[]).flatMap((p:any)=>Array.isArray(p.fotos)?p.fotos:[]).filter((x:any)=>typeof x==='string')
    const resalePaths=(drafts??[]).flatMap((p:any)=>Array.isArray(p.fotos)?p.fotos:[]).filter((x:any)=>typeof x==='string')
    if(purchasePaths.length){
      const {error:storageError}=await admin.storage.from('purchase-photos').remove(purchasePaths)
      if(storageError)console.error('ACCOUNT_PURCHASE_STORAGE_CLEANUP',user.id,storageError.message)
    }
    if(resalePaths.length){
      const {error:storageError}=await admin.storage.from('resale-photos').remove(resalePaths)
      if(storageError)console.error('ACCOUNT_RESALE_STORAGE_CLEANUP',user.id,storageError.message)
    }
    const {error}=await admin.auth.admin.deleteUser(user.id)
    if(error)throw error
    console.log('ACCOUNT_DELETED',user.id)
    return Response.json({ok:true},{headers:cors})
  }catch(e){
    console.error('ACCOUNT_DELETE_ERROR',user.id,e)
    return Response.json({error:e instanceof Error?e.message:'Não foi possível excluir a conta.'},{status:500,headers:cors})
  }
})
