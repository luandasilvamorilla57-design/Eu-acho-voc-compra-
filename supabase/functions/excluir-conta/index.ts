import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const auth=req.headers.get('authorization')||''
  const token=auth.replace(/^Bearer\s+/i,'')
  if(!token)return Response.json({error:'Sessão ausente.'},{status:401,headers:cors})

  const url=Deno.env.get('SUPABASE_URL')
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if(!url||!serviceKey)return Response.json({error:'Serviço indisponível.'},{status:503,headers:cors})

  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error:userError}=await admin.auth.getUser(token)
  if(userError||!user)return Response.json({error:'Sessão inválida ou expirada.'},{status:401,headers:cors})

  try{
    const {data:purchases}=await admin.from('compras').select('fotos').eq('user_id',user.id)
    const paths=(purchases??[]).flatMap((p:any)=>Array.isArray(p.fotos)?p.fotos:[]).filter((x:any)=>typeof x==='string')
    if(paths.length){
      const {error:storageError}=await admin.storage.from('purchase-photos').remove(paths)
      if(storageError)console.error('ACCOUNT_STORAGE_CLEANUP',user.id,storageError.message)
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
