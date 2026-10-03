import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { askGemini } from './gemini.ts'
import { askGroq } from './groq.ts'
import { calculate,corsHeaders,num,searchGrounding,sources } from './helpers.ts'

type InputImage={mime_type:string;data:string;name?:string}
type MarketRef={url?:string;price?:number;note?:string}
type Provider='gemini'|'groq'

const providerState:Record<Provider,{failures:number;blockedUntil:number}>={
  gemini:{failures:0,blockedUntil:0},
  groq:{failures:0,blockedUntil:0},
}

function providerReady(provider:Provider,key:string){
  return Boolean(key)&&Date.now()>=providerState[provider].blockedUntil
}
function providerOk(provider:Provider){
  providerState[provider].failures=0
  providerState[provider].blockedUntil=0
}
function providerFailed(provider:Provider,error:any){
  const state=providerState[provider]
  state.failures+=1
  const status=Number(error?.status||0)
  const retryable=error?.retryable!==false||status===408||status===429||status>=500

  // Chave inválida/configuração quebrada não deve ser chamada a cada análise.
  if(!retryable||status===401||status===403){
    state.blockedUntil=Date.now()+5*60_000
    state.failures=0
    return
  }

  // Dois erros transitórios seguidos abrem um pequeno circuit breaker.
  if(state.failures>=2){
    state.blockedUntil=Date.now()+60_000
    state.failures=0
  }
}
function trafficBucket(requestId:string){
  const hex=requestId.replace(/-/g,'').slice(0,8)
  const value=parseInt(hex,16)
  return Number.isFinite(value)?value%100:0
}
function choosePrimary(_requestId:string,_origem:string,_imageCount:number,geminiReady:boolean,groqReady:boolean):Provider{
  if(geminiReady)return 'gemini'
  if(groqReady)return 'groq'
  return 'gemini'
}

Deno.serve(async req=>{
  const cors=corsHeaders(req)
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const requestId=crypto.randomUUID()
  let admin:any=null
  let usageReserved=false
  try{
    const geminiKey=Deno.env.get('GEMINI_API_KEY')||''
    const groqKey=Deno.env.get('GROQ_API_KEY')||''
    const supabaseUrl=Deno.env.get('SUPABASE_URL')
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const auth=req.headers.get('authorization')||''
    const token=auth.replace(/^Bearer\s+/i,'')
    if(!token)return Response.json({error:'Sessão ausente.',code:'AUTH_REQUIRED',request_id:requestId},{status:401,headers:cors})
    if((!geminiKey&&!groqKey)||!supabaseUrl||!serviceKey)return Response.json({error:'Serviço temporariamente indisponível.',request_id:requestId},{status:503,headers:cors})

    admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data:{user},error:userError}=await admin.auth.getUser(token)
    if(userError||!user)return Response.json({error:'Sessão inválida ou expirada.',code:'AUTH_REQUIRED',request_id:requestId},{status:401,headers:cors})

    const b=await req.json().catch(()=>null)
    if(!b||typeof b!=='object')return Response.json({error:'Requisição inválida.',request_id:requestId},{status:400,headers:cors})
    const modo=b.modo==='inspecao'?'inspecao':'anuncio'
    const origem=['olx','facebook','manual'].includes(b.origem)?b.origem:'manual'
    const link=typeof b.link==='string'?b.link.trim().slice(0,2048):''
    const texto=typeof b.texto==='string'?b.texto.trim().slice(0,20000):''
    const preco=num(b.preco)
    const imagens:Array<InputImage>=Array.isArray(b.imagens)?b.imagens.slice(0,6):[]
    const inspecaoNotas=typeof b.inspecao_notas==='string'?b.inspecao_notas.trim().slice(0,6000):''
    const contextoAnterior=b.contexto_anterior??null
    const perfilUsuario=typeof b.perfil_usuario==='string'?b.perfil_usuario.trim().slice(0,6000):''
    const contextoGarimpo=b.contexto_garimpo&&typeof b.contexto_garimpo==='object'?JSON.stringify(b.contexto_garimpo).slice(0,6000):''
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
    const totalImageBytes=imagens.reduce((sum,image)=>sum+(typeof image?.data==='string'?image.data.length:0),0)
    if(totalImageBytes>12_000_000)return Response.json({error:'O conjunto de imagens ficou grande demais. Reduza a quantidade ou resolução.',request_id:requestId},{status:413,headers:cors})
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

    const geminiAvailable=providerReady('gemini',geminiKey)
    const groqAvailable=providerReady('groq',groqKey)
    if(!geminiAvailable&&!groqAvailable){
      throw Object.assign(new Error('Nenhum provedor de IA está disponível no momento.'),{status:503,retryable:true})
    }

    const primary=choosePrimary(requestId,origem,imagens.length,geminiAvailable,groqAvailable)
    const secondary:Provider=primary==='gemini'?'groq':'gemini'
    const order=[primary,secondary].filter((provider,index,list)=>{
      if(list.indexOf(provider)!==index)return false
      return provider==='gemini'?geminiAvailable:groqAvailable
    })

    console.log('ANALYSIS_START',JSON.stringify({
      requestId,modo,origem,imageCount:imagens.length,referenceCount:referencias.length,
      providerOrder:order
    }))

    let aiResult:any=null
    let firstProviderError:any=null
    const providerChain:string[]=[]

    for(const provider of order){
      try{
        providerChain.push(provider)
        console.log('AI_PROVIDER_ATTEMPT',JSON.stringify({requestId,provider}))
        aiResult=provider==='gemini'
          ? await askGemini(geminiKey,origem,link,texto,preco,imagens,modo,contextoAnterior,inspecaoNotas,referencias,perfilUsuario,contextoGarimpo)
          : await askGroq(groqKey,origem,link,texto,preco,imagens,modo,contextoAnterior,inspecaoNotas,referencias,perfilUsuario,contextoGarimpo)
        providerOk(provider)
        console.log('AI_PROVIDER_OK',JSON.stringify({requestId,provider,model:aiResult.model}))
        break
      }catch(providerError){
        providerFailed(provider,providerError)
        if(!firstProviderError)firstProviderError=providerError
        console.warn('AI_PROVIDER_FAILED',JSON.stringify({
          requestId,provider,
          status:Number((providerError as any)?.status||0)||null,
          message:providerError instanceof Error?providerError.message:'provider_failed'
        }))
      }
    }

    if(!aiResult)throw firstProviderError||new Error('Nenhum provedor conseguiu concluir a análise.')

    const {raw,ai,model}=aiResult
    const provider:Provider=aiResult.provider==='groq'?'groq':'gemini'
    const fallback=providerChain.length>1
    const grounding=provider==='gemini'?searchGrounding(raw):{queries:[],count:0}
    const concreteRefs=Array.isArray(ai?.mercado?.referencias)?ai.mercado.referencias.filter((r:any)=>['google_search','url_context','usuario'].includes(String(r?.fonte))&&num(r?.preco)>0).length:0
    const confidenceCap=(grounding.count>0||concreteRefs>=3)?100:60
    const normalizedAi={...ai,confianca_preco:Math.min(confidenceCap,Math.max(0,num(ai?.confianca_preco)))}
    const c=calculate(normalizedAi,preco)

    if(modo==='anuncio'&&origem==='facebook'&&(!ai?.produto||String(ai.produto).toLowerCase().includes('não identificado'))){
      if(usageReserved)await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:false,p_error:'produto_nao_identificado'})
      usageReserved=false
      return Response.json({error:'Não consegui identificar o produto com segurança nesses prints. Envie prints mais completos.',request_id:requestId},{status:422,headers:cors})
    }

    const analysis={...normalizedAi,precos:{...normalizedAi.precos,preco_anunciado:c.asking},calculado:{...c.calculated,classificacao:c.classification},fontes_verificadas:provider==='gemini'?sources(raw):[],meta:{modelo:model,provedor:provider,cadeia_provedores:providerChain,fallback_automatico:fallback,origem,pesquisa_web:grounding.count>0,consultas_mercado:grounding.count,consultas_web:grounding.queries,analisado_em:new Date().toISOString(),aviso:modo==='inspecao'?'Reavaliação baseada nas informações pós-visita e no mercado atual.':'Preços são estimativas baseadas em anúncios comparáveis de usados; confirme produto e funcionamento antes de comprar.'}}
    if(usageReserved){
      await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:true,p_error:null})
      usageReserved=false
    }
    console.log('ANALYSIS_OK',JSON.stringify({requestId,provider,model,fallback,providerChain,score:c.score}))
    return Response.json({analysis,request_id:requestId,quota:{restantes_mes:Number(quota?.restantes_mes||0),restantes_dia:Number(quota?.restantes_dia||0),creditos_extras:Number(quota?.creditos_extras||0),usou_credito_extra:Boolean(quota?.usou_credito_extra)}},{headers:cors})
  }catch(e){
    if(usageReserved&&admin){
      try{await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:false,p_error:e instanceof Error?e.message:'erro_interno'})}catch{}
    }
    console.error('ANALYSIS_ERROR',requestId,e)
    const message=e instanceof Error?e.message:'Erro interno'
    const lower=message.toLowerCase()
    const status=Number((e as any)?.status||0)
    if(status===429||lower.includes('quota')||lower.includes('rate limit')||lower.includes('resource_exhausted'))return Response.json({error:'Os provedores de IA atingiram o limite temporário. Tente novamente em instantes.',request_id:requestId},{status:429,headers:cors})
    if(status===408||status===503||lower.includes('high demand')||lower.includes('service unavailable')||lower.includes('try again later')||lower.includes('timeout'))return Response.json({error:'Os provedores de IA estão temporariamente ocupados. Tente novamente em instantes.',request_id:requestId},{status:503,headers:cors})
    return Response.json({error:'Não foi possível concluir a análise agora. Tente novamente.',request_id:requestId},{status:500,headers:cors})
  }
})
