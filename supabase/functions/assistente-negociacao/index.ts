import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { buildNegotiationPrompt } from './prompt.ts'
import { askGemini,askGroq } from './providers.ts'

type Provider='gemini'|'groq'
type InputImage={mime_type:string;data:string;name?:string}
type Action='start'|'reply'|'no_reply'|'finish'

const APP_ORIGIN='https://radar-do-brique.vercel.app'
const MAX_IMAGES=3
const MAX_TURNS=10

const providerState:Record<Provider,{failures:number;blockedUntil:number}>={
  gemini:{failures:0,blockedUntil:0},
  groq:{failures:0,blockedUntil:0},
}

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

function num(value:any,fallback=0){
  const n=typeof value==='number'?value:Number(value)
  return Number.isFinite(n)?n:fallback
}

function cleanText(value:any,max=4000){
  return typeof value==='string'?value.trim().slice(0,max):''
}

function validateImages(value:any){
  const images:Array<InputImage>=Array.isArray(value)?value.slice(0,MAX_IMAGES):[]
  let total=0
  for(const image of images){
    if(!image?.data||typeof image.data!=='string')throw Object.assign(new Error('Imagem inválida.'),{status:400})
    if(!['image/jpeg','image/png','image/webp'].includes(image.mime_type))throw Object.assign(new Error('Formato de imagem não suportado.'),{status:400})
    if(image.data.length>3_000_000)throw Object.assign(new Error('Uma imagem ficou grande demais.'),{status:413})
    total+=image.data.length
  }
  if(total>7_500_000)throw Object.assign(new Error('O conjunto de imagens ficou grande demais.'),{status:413})
  return images
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
  const status=Number(error?.status||0)
  const retryable=error?.retryable!==false||status===408||status===429||status>=500

  if(!retryable||status===401||status===403){
    state.blockedUntil=Date.now()+5*60_000
    state.failures=0
    return
  }

  state.failures+=1
  if(state.failures>=2){
    state.blockedUntil=Date.now()+60_000
    state.failures=0
  }
}

function bucket(requestId:string){
  const value=parseInt(requestId.replace(/-/g,'').slice(0,8),16)
  return Number.isFinite(value)?value%100:0
}

function conversationContext(conversation:any){
  const items=Array.isArray(conversation)?conversation.slice(-12):[]
  return JSON.stringify(items.map((entry:any)=>({
    role:entry?.role,
    text:cleanText(entry?.text,1600),
    at:entry?.at,
    offer:num(entry?.offer,0)||undefined,
    goal:cleanText(entry?.goal,500)||undefined
  }))).slice(0,15000)
}

async function runAI(args:{
  requestId:string
  geminiKey:string
  groqKey:string
  prompt:string
  images:InputImage[]
}){
  const geminiAvailable=providerReady('gemini',args.geminiKey)
  const groqAvailable=providerReady('groq',args.groqKey)
  if(!geminiAvailable&&!groqAvailable)throw Object.assign(new Error('Nenhum provedor de IA está disponível agora.'),{status:503,retryable:true})

  const primary:Provider=geminiAvailable&&groqAvailable
    ?(bucket(args.requestId)<50?'groq':'gemini')
    :(groqAvailable?'groq':'gemini')
  const secondary:Provider=primary==='groq'?'gemini':'groq'
  const order=[primary,secondary].filter((provider,index,list)=>{
    if(list.indexOf(provider)!==index)return false
    return provider==='gemini'?geminiAvailable:groqAvailable
  })

  let firstError:any=null
  const chain:string[]=[]
  for(const provider of order){
    try{
      chain.push(provider)
      console.log('NEGOTIATION_PROVIDER_ATTEMPT',JSON.stringify({requestId:args.requestId,provider}))
      const result=provider==='gemini'
        ?await askGemini(args.geminiKey,args.prompt,args.images)
        :await askGroq(args.groqKey,args.prompt,args.images)
      if(!cleanText(result.ai?.mensagem_para_enviar,500)){
        throw Object.assign(new Error(provider+' retornou uma mensagem vazia.'),{status:502,retryable:true,provider})
      }
      providerOk(provider)
      console.log('NEGOTIATION_PROVIDER_OK',JSON.stringify({requestId:args.requestId,provider,model:result.model}))
      return {...result,chain}
    }catch(error){
      providerFailed(provider,error)
      if(!firstError)firstError=error
      console.warn('NEGOTIATION_PROVIDER_FAILED',JSON.stringify({
        requestId:args.requestId,
        provider,
        status:Number((error as any)?.status||0)||null,
        message:error instanceof Error?error.message:'provider_failed'
      }))
    }
  }

  throw firstError||Object.assign(new Error('Nenhum provedor conseguiu responder.'),{status:503,retryable:true})
}

function normalizeAI(ai:any,askingPrice:number){
  const message=cleanText(ai?.mensagem_para_enviar,500)
  if(!message)throw Object.assign(new Error('A IA não gerou uma mensagem utilizável.'),{status:502,retryable:true})
  return{
    produto:cleanText(ai?.produto,180)||'Produto usado',
    categoria:cleanText(ai?.categoria,100),
    marca:cleanText(ai?.marca,100),
    modelo:cleanText(ai?.modelo,140),
    condicao_resumida:cleanText(ai?.condicao_resumida,700),
    preco_detectado:Math.max(0,num(ai?.preco_detectado)),
    confianca_identificacao:Math.max(0,Math.min(100,num(ai?.confianca_identificacao))),
    leitura_vendedor:cleanText(ai?.leitura_vendedor,1200),
    mensagem_para_enviar:message,
    objetivo_atual:cleanText(ai?.objetivo_atual,500),
    justificativa_estrategia:cleanText(ai?.justificativa_estrategia,1000),
    nao_ofertar_ainda:Boolean(ai?.nao_ofertar_ainda),
    oferta_sugerida:Math.max(0,num(ai?.oferta_sugerida)),
    motivo_oferta:cleanText(ai?.motivo_oferta,800),
    proximo_passo:cleanText(ai?.proximo_passo,700),
    sinais_vendedor:Array.isArray(ai?.sinais_vendedor)?ai.sinais_vendedor.map((v:any)=>cleanText(v,300)).filter(Boolean).slice(0,6):[],
    objecoes:Array.isArray(ai?.objecoes)?ai.objecoes.map((v:any)=>cleanText(v,300)).filter(Boolean).slice(0,6):[],
    perguntas_produto:Array.isArray(ai?.perguntas_produto)?ai.perguntas_produto.map((v:any)=>cleanText(v,300)).filter(Boolean).slice(0,8):[],
    alertas_negociacao:Array.isArray(ai?.alertas_negociacao)?ai.alertas_negociacao.map((v:any)=>cleanText(v,300)).filter(Boolean).slice(0,6):[],
    encerrar_negociacao:Boolean(ai?.encerrar_negociacao),
    motivo_encerrar:cleanText(ai?.motivo_encerrar,700),
    preco_base:askingPrice
  }
}

Deno.serve(async req=>{
  const cors=corsHeaders(req)
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})

  const requestId=crypto.randomUUID()
  let admin:any=null
  let usageReserved=false

  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL')
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey=Deno.env.get('GEMINI_API_KEY')||''
    const groqKey=Deno.env.get('GROQ_API_KEY')||''
    if(!supabaseUrl||!serviceKey)return Response.json({error:'Serviço temporariamente indisponível.',request_id:requestId},{status:503,headers:cors})

    const auth=req.headers.get('authorization')||''
    const token=auth.replace(/^Bearer\s+/i,'')
    if(!token)return Response.json({error:'Sessão ausente.',code:'AUTH_REQUIRED',request_id:requestId},{status:401,headers:cors})

    admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data:{user},error:userError}=await admin.auth.getUser(token)
    if(userError||!user)return Response.json({error:'Sessão inválida ou expirada.',code:'AUTH_REQUIRED',request_id:requestId},{status:401,headers:cors})

    const body=await req.json().catch(()=>null)
    if(!body||typeof body!=='object')return Response.json({error:'Requisição inválida.',request_id:requestId},{status:400,headers:cors})
    const action:Action=['start','reply','no_reply','finish'].includes(body.action)?body.action:'start'

    if(action==='finish'){
      const sessionId=cleanText(body.session_id,80)
      const outcome=body.outcome==='bought'?'comprado':body.outcome==='failed'?'nao_fechou':''
      if(!sessionId||!outcome)return Response.json({error:'Resultado inválido.',request_id:requestId},{status:400,headers:cors})

      const {data:session,error:sessionError}=await admin.from('negociacoes_assistidas').select('*').eq('id',sessionId).eq('user_id',user.id).single()
      if(sessionError||!session)return Response.json({error:'Negociação não encontrada.',request_id:requestId},{status:404,headers:cors})

      const finalPrice=outcome==='comprado'?Math.max(0,num(body.final_price)):0
      if(outcome==='comprado'&&finalPrice<=0)return Response.json({error:'Informe quanto você realmente pagou.',request_id:requestId},{status:400,headers:cors})
      const asking=Math.max(0,num(session.preco_pedido))
      const saved=outcome==='comprado'?Math.max(0,asking-finalPrice):0
      const discount=outcome==='comprado'&&asking>0?saved/asking*100:0
      const result={
        outcome,
        final_price:finalPrice||null,
        saved_amount:Math.round(saved*100)/100,
        discount_percent:Math.round(discount*100)/100,
        reason:cleanText(body.reason,1000),
        finished_at:new Date().toISOString()
      }

      const {data:updated,error:updateError}=await admin.from('negociacoes_assistidas').update({
        status:outcome,
        preco_final:finalPrice||null,
        resultado:result
      }).eq('id',session.id).eq('user_id',user.id).select('*').single()
      if(updateError)throw updateError

      console.log('NEGOTIATION_FINISHED',JSON.stringify({requestId,sessionId:session.id,outcome,finalPrice,saved}))
      return Response.json({session:updated,result,request_id:requestId},{headers:cors})
    }

    if(!geminiKey&&!groqKey)return Response.json({error:'Os provedores de IA estão indisponíveis.',request_id:requestId},{status:503,headers:cors})

    if(action==='start'){
      const images=validateImages(body.images)
      const askingPrice=Math.max(0,num(body.asking_price))
      const note=cleanText(body.note,2500)
      if(!images.length)return Response.json({error:'Envie um print do anúncio ou uma foto do produto.',request_id:requestId},{status:400,headers:cors})

      const {data:quotaData,error:quotaError}=await admin.rpc('reservar_uso_radar',{p_user_id:user.id,p_tipo:'analise',p_request_id:requestId})
      if(quotaError)throw quotaError
      const quota=Array.isArray(quotaData)?quotaData[0]:quotaData
      if(!quota?.permitido){
        const code=String(quota?.motivo||'assinatura_inativa')
        const status=code==='assinatura_inativa'?402:code.startsWith('limite_')?429:403
        return Response.json({error:code==='limite_diario'?'Você atingiu o limite de análises de hoje.':code==='limite_mensal'?'Você usou todas as análises do mês.':'Seu plano não está disponível para iniciar uma negociação agora.',code:code.toUpperCase(),request_id:requestId},{status,headers:cors})
      }
      usageReserved=true

      const prompt=buildNegotiationPrompt({
        mode:'start',
        askingPrice,
        note,
        sellerText:'',
        imageCount:images.length,
        sessionContext:''
      })
      const result=await runAI({requestId,geminiKey,groqKey,prompt,images})
      const assistant=normalizeAI(result.ai,askingPrice)
      const effectivePrice=askingPrice>0?askingPrice:assistant.preco_detectado

      if(effectivePrice<=0){
        await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:false,p_error:'preco_nao_identificado'})
        usageReserved=false
        return Response.json({
          error:'Não consegui confirmar o valor pedido. Informe o preço do vendedor e tente novamente.',
          code:'PRICE_REQUIRED',
          identified:{produto:assistant.produto,categoria:assistant.categoria,marca:assistant.marca,modelo:assistant.modelo},
          request_id:requestId
        },{status:422,headers:cors})
      }

      const now=new Date().toISOString()
      const conversation=[{
        role:'radar',
        type:'opening',
        text:assistant.mensagem_para_enviar,
        goal:assistant.objetivo_atual,
        offer:assistant.oferta_sugerida||0,
        at:now
      }]
      const {data:session,error:insertError}=await admin.from('negociacoes_assistidas').insert({
        user_id:user.id,
        produto:assistant.produto,
        categoria:assistant.categoria||null,
        marca:assistant.marca||null,
        modelo:assistant.modelo||null,
        preco_pedido:effectivePrice,
        resumo_produto:assistant.condicao_resumida||null,
        estrategia_atual:assistant,
        conversa:conversation,
        turn_count:0
      }).select('*').single()
      if(insertError)throw insertError

      await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:true,p_error:null})
      usageReserved=false

      console.log('NEGOTIATION_STARTED',JSON.stringify({requestId,sessionId:session.id,provider:result.provider,model:result.model,chain:result.chain,product:assistant.produto,askingPrice:effectivePrice}))
      return Response.json({
        session,
        assistant,
        meta:{provider:result.provider,model:result.model,provider_chain:result.chain},
        quota:{restantes_mes:Number(quota?.restantes_mes||0),restantes_dia:Number(quota?.restantes_dia||0)},
        request_id:requestId
      },{headers:cors})
    }

    const sessionId=cleanText(body.session_id,80)
    if(!sessionId)return Response.json({error:'Negociação não informada.',request_id:requestId},{status:400,headers:cors})

    const {data:accessData,error:accessError}=await admin.rpc('status_acesso_radar',{p_user_id:user.id})
    if(accessError)throw accessError
    const access=Array.isArray(accessData)?accessData[0]:accessData
    if(!access?.liberado)return Response.json({error:'Seu acesso ao Radar não está ativo.',code:'SUBSCRIPTION_REQUIRED',request_id:requestId},{status:402,headers:cors})

    const {data:session,error:sessionError}=await admin.from('negociacoes_assistidas').select('*').eq('id',sessionId).eq('user_id',user.id).single()
    if(sessionError||!session)return Response.json({error:'Negociação não encontrada.',request_id:requestId},{status:404,headers:cors})
    if(session.status!=='ativa')return Response.json({error:'Essa negociação já foi encerrada.',code:'SESSION_CLOSED',request_id:requestId},{status:409,headers:cors})
    if(Number(session.turn_count)>=MAX_TURNS)return Response.json({error:'Essa conversa chegou ao limite de rodadas. Marque o resultado ou inicie uma nova negociação.',code:'TURN_LIMIT',request_id:requestId},{status:429,headers:cors})

    const images=validateImages(body.images)
    const sellerText=cleanText(body.seller_text,4000)
    if(action==='reply'&&!sellerText&&!images.length)return Response.json({error:'Cole a resposta do vendedor ou envie um print da conversa.',request_id:requestId},{status:400,headers:cors})

    const prompt=buildNegotiationPrompt({
      mode:action==='no_reply'?'no_reply':'reply',
      askingPrice:Math.max(0,num(session.preco_pedido)),
      note:cleanText(body.note,1600),
      sellerText,
      imageCount:images.length,
      sessionContext:conversationContext(session.conversa)
    })
    const result=await runAI({requestId,geminiKey,groqKey,prompt,images})
    const assistant=normalizeAI(result.ai,Math.max(0,num(session.preco_pedido)))

    const now=new Date().toISOString()
    const history=Array.isArray(session.conversa)?session.conversa:[]
    const sellerEntry=action==='no_reply'
      ?{role:'event',type:'no_reply',text:'Vendedor ainda não respondeu.',at:now}
      :{role:'seller',type:images.length?'screenshot':'text',text:sellerText||assistant.leitura_vendedor||'Resposta recebida por print.',at:now}
    const radarEntry={
      role:'radar',
      type:'reply',
      text:assistant.mensagem_para_enviar,
      goal:assistant.objetivo_atual,
      offer:assistant.oferta_sugerida||0,
      at:now
    }
    const nextConversation=[...history,sellerEntry,radarEntry].slice(-24)
    const nextTurn=Number(session.turn_count)+1

    const {data:updated,error:updateError}=await admin.from('negociacoes_assistidas').update({
      estrategia_atual:assistant,
      conversa:nextConversation,
      turn_count:nextTurn
    }).eq('id',session.id).eq('user_id',user.id).eq('turn_count',session.turn_count).select('*').single()

    if(updateError||!updated)return Response.json({error:'A conversa foi atualizada em outro lugar. Reabra a negociação e tente novamente.',code:'SESSION_CONFLICT',request_id:requestId},{status:409,headers:cors})

    console.log('NEGOTIATION_REPLY_OK',JSON.stringify({requestId,sessionId:session.id,turn:nextTurn,provider:result.provider,model:result.model,chain:result.chain,offer:assistant.oferta_sugerida}))
    return Response.json({
      session:updated,
      assistant,
      meta:{provider:result.provider,model:result.model,provider_chain:result.chain},
      request_id:requestId
    },{headers:cors})
  }catch(e){
    if(usageReserved&&admin){
      try{await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:false,p_error:e instanceof Error?e.message:'erro_interno'})}catch{}
    }
    console.error('NEGOTIATION_ERROR',requestId,e)
    const message=e instanceof Error?e.message:'Erro interno'
    const status=Number((e as any)?.status||0)
    const lower=message.toLowerCase()
    if(status===429||lower.includes('quota')||lower.includes('rate limit'))return Response.json({error:'Os modelos de IA atingiram um limite temporário. Tente novamente em instantes.',request_id:requestId},{status:429,headers:cors})
    if(status===408||status===503||lower.includes('timeout')||lower.includes('high demand')||lower.includes('service unavailable'))return Response.json({error:'Os modelos de IA estão temporariamente ocupados. Tente novamente em instantes.',request_id:requestId},{status:503,headers:cors})
    if(status===400||status===413)return Response.json({error:message,request_id:requestId},{status,headers:cors})
    return Response.json({error:'Não foi possível continuar a negociação agora. Tente novamente.',request_id:requestId},{status:500,headers:cors})
  }
})
