import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { askGemini } from './gemini.ts'
import { calculate,cors,num,sources } from './helpers.ts'

type InputImage={mime_type:string;data:string;name?:string}
type MarketRef={url?:string;price?:number;note?:string}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const requestId=crypto.randomUUID()
  let admin:any=null
  let usageReserved=false
  try{
    const key=Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl=Deno.env.get('SUPABASE_URL')
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const auth=req.headers.get('authorization')||''
    const token=auth.replace(/^Bearer\s+/i,'')
    if(!token)return Response.json({error:'Sessão ausente.',code:'AUTH_REQUIRED',request_id:requestId},{status:401,headers:cors})
    if(!key||!supabaseUrl||!serviceKey)return Response.json({error:'Serviço temporariamente indisponível.',request_id:requestId},{status:503,headers:cors})

    admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data:{user},error:userError}=await admin.auth.getUser(token)
    if(userError||!user)return Response.json({error:'Sessão inválida ou expirada.',code:'AUTH_REQUIRED',request_id:requestId},{status:401,headers:cors})

    const b=await req.json()
    const modo=b.modo==='inspecao'?'inspecao':'anuncio'
    const origem=['olx','facebook','manual'].includes(b.origem)?b.origem:'manual'
    const link=typeof b.link==='string'?b.link.trim():''
    const texto=typeof b.texto==='string'?b.texto.trim():''
    const preco=num(b.preco)
    const imagens:Array<InputImage>=Array.isArray(b.imagens)?b.imagens.slice(0,6):[]
    const inspecaoNotas=typeof b.inspecao_notas==='string'?b.inspecao_notas.trim():''
    const contextoAnterior=b.contexto_anterior??null
    const perfilUsuario=typeof b.perfil_usuario==='string'?b.perfil_usuario.trim():''
    const referencias:Array<MarketRef>=Array.isArray(b.referencias_mercado)?b.referencias_mercado.slice(0,5).map((r:any)=>({
      url:typeof r?.url==='string'?r.url.trim():'',
      price:Math.max(0,num(r?.price)),
      note:typeof r?.note==='string'?r.note.trim().slice(0,500):''
    })):[]

    if(modo==='anuncio'){
      if(origem==='olx'&&!link)return Response.json({error:'Cole o link do anúncio da OLX.',request_id:requestId},{status:400,headers:cors})
      if(origem==='facebook'&&!imagens.length)return Response.json({error:'Envie pelo menos um print do anúncio do Facebook Marketplace.',request_id:requestId},{status:400,headers:cors})
      if(origem==='manual'&&!texto)return Response.json({error:'Cole os dados do anúncio.',request_id:requestId},{status:400,headers:cors})
    }else if(!inspecaoNotas&&!imagens.length){
      return Response.json({error:'Informe o que encontrou na inspeção ou envie fotos novas.',request_id:requestId},{status:400,headers:cors})
    }

    const urls=[link,...referencias.map(r=>r.url||'')].filter(Boolean)
    if(urls.some(url=>!/^https?:\/\//i.test(url)))return Response.json({error:'Há um link inválido nas referências.',request_id:requestId},{status:400,headers:cors})
    for(const image of imagens){
      if(!image?.data||typeof image.data!=='string'||image.data.length>3_000_000)return Response.json({error:'Uma imagem é inválida ou grande demais.',request_id:requestId},{status:400,headers:cors})
      if(!['image/jpeg','image/png','image/webp'].includes(image.mime_type))return Response.json({error:'Formato de imagem não suportado.',request_id:requestId},{status:400,headers:cors})
    }

    const {data:quotaData,error:quotaError}=await admin.rpc('reservar_uso_radar',{p_user_id:user.id,p_tipo:'analise',p_request_id:requestId})
    if(quotaError){
      console.error('ANALYSIS_QUOTA_ERROR',requestId,quotaError)
      return Response.json({error:'Não foi possível validar seu plano agora.',code:'ACCESS_CHECK_FAILED',request_id:requestId},{status:503,headers:cors})
    }
    const quota=Array.isArray(quotaData)?quotaData[0]:quotaData
    if(!quota?.permitido){
      const code=String(quota?.motivo||'assinatura_inativa')
      if(code==='assinatura_inativa')return Response.json({error:'Escolha um plano para usar o Radar do Brique.',code:'SUBSCRIPTION_REQUIRED',request_id:requestId},{status:402,headers:cors})
      if(code==='limite_diario')return Response.json({error:'Você atingiu o limite de análises de hoje. O saldo extra não altera o limite diário do seu plano.',code:'DAILY_LIMIT',request_id:requestId},{status:429,headers:cors})
      if(code==='limite_mensal')return Response.json({error:'Você usou todas as análises do mês. Adicione +20 análises para continuar sem trocar de plano.',code:'MONTHLY_LIMIT',request_id:requestId,can_buy_extra:true},{status:429,headers:cors})
      return Response.json({error:'Seu plano não está disponível para análise agora.',code:'PLAN_UNAVAILABLE',request_id:requestId},{status:403,headers:cors})
    }
    usageReserved=true

    console.log('ANALYSIS_START',JSON.stringify({requestId,modo,origem,imageCount:imagens.length,referenceCount:referencias.length}))
    const {raw,ai,model,fallback}=await askGemini(key,origem,link,texto,preco,imagens,modo,contextoAnterior,inspecaoNotas,referencias,perfilUsuario)
    const c=calculate(ai,preco)

    if(modo==='anuncio'&&origem==='facebook'&&(!ai?.produto||String(ai.produto).toLowerCase().includes('não identificado'))){
      if(usageReserved)await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:false,p_error:'produto_nao_identificado'})
      usageReserved=false
      return Response.json({error:'Não consegui identificar o produto com segurança nesses prints. Envie prints mais completos.',request_id:requestId},{status:422,headers:cors})
    }

    const analysis={...ai,precos:{...ai.precos,preco_anunciado:c.asking},calculado:{...c.calculated,classificacao:c.classification},fontes_verificadas:sources(raw),meta:{modelo:model,fallback_automatico:fallback,origem,analisado_em:new Date().toISOString(),aviso:modo==='inspecao'?'Reavaliação baseada nas informações pós-visita.':'Confirme funcionamento, procedência e valores antes de comprar.'}}
    if(usageReserved){
      await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:true,p_error:null})
      usageReserved=false
    }
    console.log('ANALYSIS_OK',JSON.stringify({requestId,model,fallback,score:c.score}))
    return Response.json({analysis,request_id:requestId,quota:{restantes_mes:Number(quota?.restantes_mes||0),restantes_dia:Number(quota?.restantes_dia||0),creditos_extras:Number(quota?.creditos_extras||0),usou_credito_extra:Boolean(quota?.usou_credito_extra)}},{headers:cors})
  }catch(e){
    if(usageReserved&&admin){
      try{await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:false,p_error:e instanceof Error?e.message:'erro_interno'})}catch{}
    }
    console.error('ANALYSIS_ERROR',requestId,e)
    const message=e instanceof Error?e.message:'Erro interno'
    const lower=message.toLowerCase()
    if(lower.includes('quota')||lower.includes('rate limit')||lower.includes('resource_exhausted'))return Response.json({error:'A cota gratuita da Gemini foi atingida. Aguarde a renovação do limite e tente novamente.',request_id:requestId},{status:429,headers:cors})
    if(lower.includes('high demand')||lower.includes('service unavailable')||lower.includes('try again later'))return Response.json({error:'Os modelos gratuitos da Gemini estão temporariamente congestionados. Tente novamente em instantes.',request_id:requestId},{status:503,headers:cors})
    return Response.json({error:message,request_id:requestId},{status:500,headers:cors})
  }
})
