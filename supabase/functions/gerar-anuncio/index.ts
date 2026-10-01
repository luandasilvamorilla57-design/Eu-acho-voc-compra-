import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}

const photoReview={type:'object',properties:{
  indice:{type:'number'},nota:{type:'number'},qualidade:{type:'string'},
  pontos_fortes:{type:'array',items:{type:'string'}},
  problemas:{type:'array',items:{type:'string'}},
  acao_recomendada:{type:'string'}
},required:['indice','nota','qualidade','pontos_fortes','problemas','acao_recomendada']}

const photoAudit={type:'object',properties:{
  nota_geral:{type:'number'},
  nitidez_score:{type:'number'},
  iluminacao_score:{type:'number'},
  apresentacao_score:{type:'number'},
  pronta_para_publicar:{type:'boolean'},
  resumo:{type:'string'},
  foto_principal_indice:{type:'number'},
  avaliacoes:{type:'array',items:photoReview},
  problemas_gerais:{type:'array',items:{type:'string'}},
  plano_de_fotos:{type:'array',items:{type:'string'}}
},required:['nota_geral','nitidez_score','iluminacao_score','apresentacao_score','pronta_para_publicar','resumo','foto_principal_indice','avaliacoes','problemas_gerais','plano_de_fotos']}

const schema={type:'object',properties:{
  titulo:{type:'string'},
  descricao:{type:'string'},
  preco_venda_rapida:{type:'number'},
  preco_equilibrado:{type:'number'},
  preco_premium:{type:'number'},
  pontos_destaque:{type:'array',items:{type:'string'}},
  checklist_fotos:{type:'array',items:{type:'string'}},
  resposta_negociacao:{type:'string'},
  foto_auditoria:photoAudit
},required:['titulo','descricao','preco_venda_rapida','preco_equilibrado','preco_premium','pontos_destaque','checklist_fotos','resposta_negociacao','foto_auditoria']}

const MODELS=['gemini-3.5-flash-lite']

function transient(raw:any,status:number){
  const message=String(raw?.error?.message||'').toLowerCase()
  return status===429||status===503||message.includes('high demand')||message.includes('temporarily')||message.includes('resource exhausted')
}
function n(v:any){const x=Number(v);return Number.isFinite(x)?x:0}
function clip(v:any,max=300){return String(v||'').trim().slice(0,max)}
function score(v:any){return Math.max(0,Math.min(100,n(v)))}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const requestId=crypto.randomUUID()
  let admin:any=null
  let usageReserved=false

  try{
    const auth=req.headers.get('authorization')||''
    const token=auth.replace(/^Bearer\s+/i,'')
    const supabaseUrl=Deno.env.get('SUPABASE_URL')
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey=Deno.env.get('GEMINI_API_KEY')
    if(!token)return Response.json({error:'Sessão ausente.',request_id:requestId},{status:401,headers:cors})
    if(!supabaseUrl||!serviceKey||!geminiKey)return Response.json({error:'Serviço temporariamente indisponível.',request_id:requestId},{status:503,headers:cors})

    admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data:{user},error:userError}=await admin.auth.getUser(token)
    if(userError||!user)return Response.json({error:'Sessão inválida ou expirada.',request_id:requestId},{status:401,headers:cors})

    const {data:proAccess,error:accessError}=await admin.rpc('tem_recurso_pro',{p_user_id:user.id})
    if(accessError){
      console.error('PHOTO_AD_ACCESS_ERROR',requestId,accessError)
      return Response.json({error:'Não foi possível validar seu plano agora.',code:'ACCESS_CHECK_FAILED',request_id:requestId},{status:503,headers:cors})
    }
    if(proAccess!==true){
      const {data:baseAccess}=await admin.rpc('tem_acesso_radar',{p_user_id:user.id})
      if(baseAccess!==true){
        return Response.json({error:'Escolha um plano para usar o Radar do Brique.',code:'SUBSCRIPTION_REQUIRED',request_id:requestId},{status:402,headers:cors})
      }
      return Response.json({error:'O Preparar venda com IA e a avaliação de fotos são recursos dos planos Pro e Max.',code:'FEATURE_REQUIRES_PRO',request_id:requestId},{status:403,headers:cors})
    }

    const b=await req.json()
    const origin=b.origem_item==='externo'?'externo':'radar'
    const product=clip(b.produto,300)
    if(!product)return Response.json({error:'Produto não informado.',request_id:requestId},{status:400,headers:cors})

    const images=Array.isArray(b.imagens)?b.imagens.slice(0,6):[]
    if(!images.length)return Response.json({error:'Envie pelo menos uma foto para o Anúncio Inteligente.',request_id:requestId},{status:400,headers:cors})
    for(const image of images){
      if(!image?.data||typeof image.data!=='string'||image.data.length>3_000_000)return Response.json({error:'Uma das fotos é inválida ou grande demais.',request_id:requestId},{status:400,headers:cors})
      if(!['image/jpeg','image/png','image/webp'].includes(image.mime_type))return Response.json({error:'Formato de foto não suportado.',request_id:requestId},{status:400,headers:cors})
    }

    const {data:quotaData,error:quotaError}=await admin.rpc('reservar_uso_radar',{p_user_id:user.id,p_tipo:'preparar_venda',p_request_id:requestId})
    if(quotaError){
      console.error('PHOTO_AD_QUOTA_ERROR',requestId,quotaError)
      return Response.json({error:'Não foi possível validar a franquia do seu plano.',code:'ACCESS_CHECK_FAILED',request_id:requestId},{status:503,headers:cors})
    }
    const quota=Array.isArray(quotaData)?quotaData[0]:quotaData
    if(!quota?.permitido){
      const code=String(quota?.motivo||'recurso_pro')
      if(code==='assinatura_inativa')return Response.json({error:'Escolha um plano para usar o Radar do Brique.',code:'SUBSCRIPTION_REQUIRED',request_id:requestId},{status:402,headers:cors})
      if(code==='recurso_pro')return Response.json({error:'O Diagnóstico Premium e o Preparar venda com IA estão disponíveis nos planos Pro e Max.',code:'FEATURE_REQUIRES_PRO',request_id:requestId},{status:403,headers:cors})
      if(code==='limite_venda_ia')return Response.json({error:'Você atingiu a franquia mensal de Preparar venda com IA do seu plano.',code:'PREMIUM_MONTHLY_LIMIT',request_id:requestId},{status:429,headers:cors})
      return Response.json({error:'Recurso indisponível para este plano.',code:'FEATURE_UNAVAILABLE',request_id:requestId},{status:403,headers:cors})
    }
    usageReserved=true

    const context={
      origem_item:origin,
      produto:product,
      categoria:clip(b.categoria,120),
      marca:clip(b.marca,120),
      modelo:clip(b.modelo,160),
      condicao:clip(b.condicao,300),
      tempo_uso:clip(b.tempo_uso,200),
      observacoes:clip(b.observacoes,2200),
      custo_total:Math.max(0,n(b.custo_total)),
      preco_minimo:Math.max(0,n(b.preco_minimo)),
      preco_ideal:Math.max(0,n(b.preco_ideal)),
      analise:b.analise||null
    }

    const prompt=`Você é o Assistente de Venda do BRIKE RADAR, especialista brasileiro em apresentação de produtos usados e criação de anúncios para OLX e Facebook Marketplace.

OBJETIVO
Transformar fotos REAIS e dados confirmados em:
1. um diagnóstico visual profissional e fácil de agir;
2. um anúncio honesto, humano e pronto para copiar.

ORIGEM DO ITEM
- "radar": item registrado pelo usuário na carteira do BRIKE RADAR. Pode existir uma análise anterior no contexto.
- "externo": item que o usuário já tinha em casa ou adquiriu fora do Radar. NÃO trate como compra do estoque e NÃO invente histórico de aquisição.

AUDITORIA VISUAL
Você recebeu ${images.length} foto(s). A ordem é Foto 1, Foto 2, etc.
Para cada foto, avalie somente o que é visível:
- nitidez/desfoque;
- iluminação;
- enquadramento/cortes;
- aparência de resolução ruim;
- fundo e distrações;
- reflexos;
- apresentação e limpeza APARENTE;
- utilidade daquele ângulo para aumentar confiança;
- inconsistência entre o produto descrito e o que aparece na foto.

REGRAS VISUAIS
- Não diga que está sujo se isso não estiver visível com segurança. Em caso de dúvida: "há marcas aparentes; vale limpar ou fotografar melhor".
- Não invente defeitos.
- Se a foto mostrar OUTRO produto, dê nota muito baixa e diga claramente para substituir a imagem.
- qualidade deve ser exatamente "boa", "atencao" ou "refazer".
- nota, nota_geral, nitidez_score, iluminacao_score e apresentacao_score: 0 a 100.
- foto_principal_indice: melhor foto para capa; use 0 se nenhuma for aceitável.
- pronta_para_publicar=false quando houver imagem de produto errado, fotos muito ruins ou ausência de ângulos essenciais.
- plano_de_fotos deve ser um roteiro prático e específico ao tipo de produto.

ANÚNCIO
- Título curto, natural, pesquisável e sem caixa alta exagerada.
- Descrição pronta para copiar, escaneável e transparente.
- Nunca invente armazenamento, voltagem, acessórios, funcionamento, estado, garantia ou especificações.
- Defeitos informados pelo usuário devem aparecer com transparência quando relevantes.
- Use as fotos para confirmar aparência, não para criar fatos técnicos invisíveis.
- resposta_negociacao: curta, natural e firme.

PREÇO
- Se houver análise anterior do Radar, use-a como referência secundária.
- Se preco_ideal > 0 em item externo, trate como objetivo do usuário, NÃO como preço de mercado verificado.
- Se preco_minimo > 0, preco_venda_rapida nunca pode ficar abaixo dele.
- preco_venda_rapida <= preco_equilibrado <= preco_premium.
- Sem análise anterior e sem âncora de preço suficiente, seja conservador e não diga que o preço é "de mercado". Não invente comparáveis.

ESTILO
- Português do Brasil.
- Sem frases genéricas de IA.
- Recomendações objetivas, curtas e acionáveis.

CONTEXTO CONFIRMADO:
${JSON.stringify(context).slice(0,28000)}`

    const input:any[]=[{type:'text',text:prompt}]
    for(const image of images)input.push({type:'image',mime_type:image.mime_type,data:image.data})

    let lastMessage='Falha ao gerar anúncio.'
    for(let i=0;i<MODELS.length;i++){
      const body={model:MODELS[i],input,response_format:{type:'text',mime_type:'application/json',schema}}
      const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':geminiKey,'Api-Revision':'2026-05-20'},body:JSON.stringify(body)})
      const raw=await response.json()

      if(!response.ok){
        lastMessage=raw?.error?.message||lastMessage
        console.error('PHOTO_AD_MODEL_ERROR',requestId,MODELS[i],response.status,lastMessage)
        if(i<MODELS.length-1&&transient(raw,response.status)){await new Promise(r=>setTimeout(r,300));continue}
        throw new Error(lastMessage)
      }

      const text=raw?.output_text??raw?.steps?.flatMap((s:any)=>s?.content??[]).find((c:any)=>c?.type==='text'&&typeof c?.text==='string')?.text
      if(!text){lastMessage='A IA não retornou a avaliação das fotos.';if(i<MODELS.length-1)continue;throw new Error(lastMessage)}

      const ad=JSON.parse(text)
      ad.foto_auditoria={
        ...ad.foto_auditoria,
        nota_geral:score(ad.foto_auditoria?.nota_geral),
        nitidez_score:score(ad.foto_auditoria?.nitidez_score),
        iluminacao_score:score(ad.foto_auditoria?.iluminacao_score),
        apresentacao_score:score(ad.foto_auditoria?.apresentacao_score),
        avaliacoes:(ad.foto_auditoria?.avaliacoes||[]).map((photo:any,index:number)=>({
          ...photo,
          indice:index+1,
          nota:score(photo.nota),
          qualidade:['boa','atencao','refazer'].includes(photo.qualidade)?photo.qualidade:'atencao'
        })).slice(0,images.length)
      }

      const minPrice=Math.max(0,context.preco_minimo)
      ad.preco_venda_rapida=Math.max(minPrice,n(ad.preco_venda_rapida))
      ad.preco_equilibrado=Math.max(ad.preco_venda_rapida,n(ad.preco_equilibrado))
      ad.preco_premium=Math.max(ad.preco_equilibrado,n(ad.preco_premium))
      ad.gerado_em=new Date().toISOString()

      if(usageReserved){
        await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:true,p_error:null})
        usageReserved=false
      }
      console.log('PHOTO_AD_OK',JSON.stringify({requestId,userId:user.id,origin,product,model:MODELS[i],fallback:i>0,imageCount:images.length,score:ad.foto_auditoria.nota_geral}))
      return Response.json({ad,request_id:requestId,model:MODELS[i],fallback:i>0,quota:{restantes_mes:Number(quota?.restantes_mes||0)}},{headers:cors})
    }

    throw new Error(lastMessage)
  }catch(e){
    if(usageReserved&&admin){
      try{await admin.rpc('finalizar_uso_radar',{p_request_id:requestId,p_success:false,p_error:e instanceof Error?e.message:'erro_interno'})}catch{}
    }
    console.error('PHOTO_AD_ERROR',requestId,e)
    const message=e instanceof Error?e.message:'Erro interno'
    const lower=message.toLowerCase()
    const status=lower.includes('quota')||lower.includes('rate')||lower.includes('resource')?429:lower.includes('high demand')||lower.includes('temporarily')?503:500
    return Response.json({error:status===503?'A IA está congestionada. Tente novamente em instantes.':message,request_id:requestId},{status,headers:cors})
  }
})
