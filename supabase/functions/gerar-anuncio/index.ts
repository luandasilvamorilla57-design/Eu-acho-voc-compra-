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
  nota_geral:{type:'number'},pronta_para_publicar:{type:'boolean'},resumo:{type:'string'},foto_principal_indice:{type:'number'},
  avaliacoes:{type:'array',items:photoReview},
  problemas_gerais:{type:'array',items:{type:'string'}},
  plano_de_fotos:{type:'array',items:{type:'string'}}
},required:['nota_geral','pronta_para_publicar','resumo','foto_principal_indice','avaliacoes','problemas_gerais','plano_de_fotos']}
const schema={type:'object',properties:{
  titulo:{type:'string'},descricao:{type:'string'},
  preco_venda_rapida:{type:'number'},preco_equilibrado:{type:'number'},preco_premium:{type:'number'},
  pontos_destaque:{type:'array',items:{type:'string'}},
  checklist_fotos:{type:'array',items:{type:'string'}},
  resposta_negociacao:{type:'string'},
  foto_auditoria:photoAudit
},required:['titulo','descricao','preco_venda_rapida','preco_equilibrado','preco_premium','pontos_destaque','checklist_fotos','resposta_negociacao','foto_auditoria']}
const MODELS=['gemini-3.5-flash','gemini-3.5-flash-lite']

function transient(raw:any,status:number){
  const message=String(raw?.error?.message||'').toLowerCase()
  return status===429||status===503||message.includes('high demand')||message.includes('temporarily')||message.includes('resource exhausted')
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const requestId=crypto.randomUUID()

  try{
    const auth=req.headers.get('authorization')||''
    const token=auth.replace(/^Bearer\s+/i,'')
    const supabaseUrl=Deno.env.get('SUPABASE_URL')
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiKey=Deno.env.get('GEMINI_API_KEY')
    if(!token)return Response.json({error:'Sessão ausente.',request_id:requestId},{status:401,headers:cors})
    if(!supabaseUrl||!serviceKey||!geminiKey)return Response.json({error:'Serviço temporariamente indisponível.',request_id:requestId},{status:503,headers:cors})

    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data:{user},error:userError}=await admin.auth.getUser(token)
    if(userError||!user)return Response.json({error:'Sessão inválida ou expirada.',request_id:requestId},{status:401,headers:cors})

    const {data:config}=await admin.from('radar_config').select('plano_atual').eq('user_id',user.id).maybeSingle()
    const plan=String(config?.plano_atual||'start')
    if(plan!=='pro'&&plan!=='max'){
      return Response.json({error:'O Anúncio Inteligente com avaliação de fotos está disponível no BRIKE Pro.',code:'FEATURE_REQUIRES_PRO',request_id:requestId},{status:403,headers:cors})
    }

    const b=await req.json()
    const produto=String(b.produto||'').trim().slice(0,300)
    if(!produto)return Response.json({error:'Produto não informado.',request_id:requestId},{status:400,headers:cors})

    const imagens=Array.isArray(b.imagens)?b.imagens.slice(0,6):[]
    if(!imagens.length)return Response.json({error:'Envie pelo menos uma foto para o Anúncio Inteligente.',request_id:requestId},{status:400,headers:cors})
    for(const image of imagens){
      if(!image?.data||typeof image.data!=='string'||image.data.length>3_000_000)return Response.json({error:'Uma das fotos é inválida ou grande demais.',request_id:requestId},{status:400,headers:cors})
      if(!['image/jpeg','image/png','image/webp'].includes(image.mime_type))return Response.json({error:'Formato de foto não suportado.',request_id:requestId},{status:400,headers:cors})
    }

    const context=JSON.stringify({
      produto,
      categoria:String(b.categoria||'').slice(0,120),
      observacoes:String(b.observacoes||'').slice(0,2000),
      custo_total:Number(b.custo_total||0),
      preco_minimo:Number(b.preco_minimo||0),
      analise:b.analise||null
    }).slice(0,26000)

    const prompt=`Você é o Assistente de Venda do BRIKE RADAR, especializado em transformar fotos reais de produtos usados em anúncios honestos e bem apresentados para OLX e Facebook Marketplace no Brasil.

Você recebeu ${imagens.length} foto(s). A ordem visual das imagens corresponde a Foto 1, Foto 2, etc.

FAÇA DUAS TAREFAS CONECTADAS:

1) AUDITORIA VISUAL DAS FOTOS
Avalie cada foto APENAS pelo que está realmente visível.
Analise:
- nitidez e possível desfoque;
- iluminação: escura, estourada ou equilibrada;
- enquadramento e cortes do produto;
- resolução/aparência de baixa qualidade;
- fundo muito poluído ou elementos que distraiam;
- reflexos fortes;
- apresentação/limpeza VISIVEL do produto;
- se o ângulo ajuda a entender o estado;
- se faltam fotos importantes como frente, traseira, laterais, etiqueta/modelo, acessórios, conectores, tela ligada ou detalhes de avarias, conforme o tipo de produto.

Não invente sujeira, defeitos ou baixa resolução quando isso não puder ser observado.
Se algo parecer sujeira mas houver dúvida, escreva como possibilidade: "há marcas aparentes que vale limpar ou fotografar melhor".
nota deve ficar entre 0 e 100.
qualidade deve ser exatamente "boa", "atencao" ou "refazer".
foto_principal_indice deve apontar a melhor foto para capa. Se nenhuma for aceitável, use 0.
pronta_para_publicar só pode ser true quando o conjunto já for utilizável sem uma falha visual importante.
plano_de_fotos deve ser um roteiro prático, específico ao produto, em ordem de prioridade.

2) ANÚNCIO
Crie título e descrição baseados somente nas informações confirmadas do contexto e nas fotos.
Não invente especificações, acessórios, estado, funcionamento ou defeitos.
Se uma característica não estiver confirmada, não a afirme.
O texto deve parecer escrito por uma pessoa experiente, não por uma IA.
A descrição deve ser curta o suficiente para Marketplace/OLX, escaneável e transparente.
preco_venda_rapida nunca pode ficar abaixo de preco_minimo quando preco_minimo > 0.
preco_venda_rapida <= preco_equilibrado <= preco_premium.
Se não houver base suficiente para diferenciar preços, mantenha a faixa conservadora.
checklist_fotos deve complementar a auditoria, focando em fotos que aumentem confiança.
resposta_negociacao deve ser curta, natural e firme sem soar robótica.

CONTEXTO DO ITEM:
${context}`

    const input:any[]=[{type:'text',text:prompt}]
    for(const image of imagens)input.push({type:'image',mime_type:image.mime_type,data:image.data})

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
      ad.foto_auditoria.nota_geral=Math.max(0,Math.min(100,Number(ad.foto_auditoria.nota_geral||0)))
      ad.foto_auditoria.avaliacoes=(ad.foto_auditoria.avaliacoes||[]).map((photo:any,index:number)=>({
        ...photo,
        indice:index+1,
        nota:Math.max(0,Math.min(100,Number(photo.nota||0))),
        qualidade:['boa','atencao','refazer'].includes(photo.qualidade)?photo.qualidade:'atencao'
      })).slice(0,imagens.length)
      const minPrice=Math.max(0,Number(b.preco_minimo||0))
      ad.preco_venda_rapida=Math.max(minPrice,Number(ad.preco_venda_rapida||0))
      ad.preco_equilibrado=Math.max(ad.preco_venda_rapida,Number(ad.preco_equilibrado||0))
      ad.preco_premium=Math.max(ad.preco_equilibrado,Number(ad.preco_premium||0))
      ad.gerado_em=new Date().toISOString()

      console.log('PHOTO_AD_OK',JSON.stringify({requestId,userId:user.id,produto,model:MODELS[i],fallback:i>0,imageCount:imagens.length,score:ad.foto_auditoria.nota_geral}))
      return Response.json({ad,request_id:requestId,model:MODELS[i],fallback:i>0},{headers:cors})
    }

    throw new Error(lastMessage)
  }catch(e){
    console.error('PHOTO_AD_ERROR',requestId,e)
    const message=e instanceof Error?e.message:'Erro interno'
    const lower=message.toLowerCase()
    const status=lower.includes('quota')||lower.includes('rate')||lower.includes('resource')?429:lower.includes('high demand')||lower.includes('temporarily')?503:500
    return Response.json({error:status===503?'A IA está congestionada. Tente novamente em instantes.':message,request_id:requestId},{status,headers:cors})
  }
})
