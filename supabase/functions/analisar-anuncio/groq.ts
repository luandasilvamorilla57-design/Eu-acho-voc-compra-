type InputImage={mime_type:string;data:string;name?:string}
type MarketRef={url?:string;price?:number;note?:string}
type GroqResult={raw:any;ai:any;model:string;fallback:boolean;provider:'groq';image_count:number}

const MODEL='qwen/qwen3.8-27b'
const MAX_GROQ_IMAGES=1
const TIMEOUT_MS=22000

const fallbackSchema={
  type:'object',
  properties:{
    produto:{type:'string'},marca:{type:'string'},modelo:{type:'string'},categoria:{type:'string'},condicao_estimada:{type:'string'},resumo:{type:'string'},
    confianca_geral:{type:'number'},confianca_identificacao:{type:'number'},confianca_preco:{type:'number'},
    dados_faltantes:{type:'array',maxItems:2,items:{type:'string'}},
    mercado:{type:'object',properties:{
      preco_min:{type:'number'},preco_mediano:{type:'number'},preco_max:{type:'number'},demanda:{type:'string'},liquidez_score:{type:'number'},justificativa:{type:'string'}
    },required:['preco_min','preco_mediano','preco_max','demanda','liquidez_score','justificativa']},
    precos:{type:'object',properties:{
      preco_anunciado:{type:'number'},oferta_agressiva:{type:'number'},oferta_equilibrada:{type:'number'},teto_compra:{type:'number'},
      revenda_conservadora:{type:'number'},revenda_provavel:{type:'number'},revenda_otimista:{type:'number'},custos_estimados:{type:'number'}
    },required:['preco_anunciado','oferta_agressiva','oferta_equilibrada','teto_compra','revenda_conservadora','revenda_provavel','revenda_otimista','custos_estimados']},
    risco_score:{type:'number'},negociabilidade_score:{type:'number'},
    riscos:{type:'array',maxItems:2,items:{type:'object',properties:{
      titulo:{type:'string'},nivel:{type:'string'},detalhe:{type:'string'},como_verificar:{type:'string'},impacto_financeiro_estimado:{type:'number'}
    },required:['titulo','nivel','detalhe','como_verificar','impacto_financeiro_estimado']}},
    estrategias_negociacao:{type:'array',maxItems:2,items:{type:'object',properties:{
      nome:{type:'string'},quando_usar:{type:'string'},valor_sugerido:{type:'number'},mensagem:{type:'string'}
    },required:['nome','quando_usar','valor_sugerido','mensagem']}},
    checklist_antes_compra:{type:'array',maxItems:3,items:{type:'string'}},
    alertas_fraude:{type:'array',maxItems:2,items:{type:'string'}}
  },
  required:['produto','marca','modelo','categoria','condicao_estimada','resumo','confianca_geral','confianca_identificacao','confianca_preco','dados_faltantes','mercado','precos','risco_score','negociabilidade_score','riscos','estrategias_negociacao','checklist_antes_compra','alertas_fraude']
}

function makeProviderError(message:string,status=500,retryable=true){
  const error:any=new Error(message)
  error.status=status
  error.retryable=retryable
  error.provider='groq'
  return error
}

function sampleImages(images:InputImage[]){
  if(!images.length)return []
  return [images[0]].slice(0,MAX_GROQ_IMAGES)
}

function compactPrevious(value:any){
  if(!value||typeof value!=='object')return ''
  const v=value as any
  return JSON.stringify({
    produto:v.produto||'',
    categoria:v.categoria||'',
    resumo:v.resumo||'',
    risco_score:v.risco_score??null,
    mercado:v.mercado?{
      preco_min:v.mercado.preco_min,
      preco_mediano:v.mercado.preco_mediano,
      preco_max:v.mercado.preco_max
    }:null,
    precos:v.precos?{
      preco_anunciado:v.precos.preco_anunciado,
      oferta_equilibrada:v.precos.oferta_equilibrada,
      teto_compra:v.precos.teto_compra,
      revenda_provavel:v.precos.revenda_provavel
    }:null
  }).slice(0,1800)
}

function compactRefs(refs:MarketRef[]){
  return JSON.stringify(refs.slice(0,3).map(r=>({
    price:Number(r.price||0),
    note:String(r.note||'').slice(0,160),
    url:String(r.url||'').slice(0,240)
  }))).slice(0,1400)
}

function buildFallbackPrompt(args:{
  origem:string;link:string;texto:string;preco:number;modo:string;
  contextoAnterior:any;inspecaoNotas:string;referencias:MarketRef[];imageCount:number
}){
  const previous=compactPrevious(args.contextoAnterior)
  const refs=compactRefs(args.referencias)
  const text=String(args.texto||'').slice(0,3500)
  const notes=String(args.inspecaoNotas||'').slice(0,1200)
  const link=String(args.link||'').slice(0,500)

  return [
    'Você é o fallback enxuto do BRIKE RADAR para compra e revenda de produtos usados no Brasil.',
    'Analise somente o que foi enviado. Não navegue na web e não diga que abriu links.',
    'Objetivo: ajudar a pagar menos, evitar compra ruim e estimar revenda usada de forma conservadora.',
    '',
    'REGRAS:',
    '- Identifique produto/modelo/capacidade somente se houver evidência.',
    '- Facebook: priorize o print anexado. OLX: sem conteúdo textual, trate o link apenas como referência.',
    '- Mercado sem pesquisa web = estimativa conservadora. confianca_preco no máximo 55, salvo 3 referências concretas do usuário.',
    '- Não use preço de produto novo como base de usado.',
    '- oferta_agressiva <= oferta_equilibrada <= teto_compra.',
    '- revenda_conservadora <= revenda_provavel <= revenda_otimista.',
    '- Nunca descarte por meta pessoal de lucro/ROI. Avalie o negócio por preço, risco, custo e liquidez.',
    '- Se faltar informação, declare em dados_faltantes. Não invente defeitos.',
    '- Gere no máximo 2 riscos, 2 estratégias e 3 testes de checklist.',
    '- Mensagens de negociação devem ser curtas, naturais e sem mentira.',
    '- Seja direto; não repita texto.',
    '',
    'MODO: '+args.modo,
    'ORIGEM: '+args.origem,
    'PREÇO INFORMADO: '+(args.preco>0?'R$ '+args.preco.toFixed(2):'não informado'),
    'LINK (não abrir): '+(link||'não informado'),
    'TEXTO: '+(text||'não informado'),
    'OBSERVAÇÕES DE INSPEÇÃO: '+(notes||'não informadas'),
    'REFERÊNCIAS DO USUÁRIO: '+(refs||'[]'),
    'CONTEXTO ANTERIOR RESUMIDO: '+(previous||'não informado'),
    'IMAGENS RECEBIDAS NESTE FALLBACK: '+args.imageCount,
    '',
    'Responda somente no JSON do schema.'
  ].join('\n')
}

async function callGroq(key:string,messages:any[]){
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS)
  try{
    const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${key}`,
        'Content-Type':'application/json'
      },
      signal:controller.signal,
      body:JSON.stringify({
        model:MODEL,
        messages,
        temperature:0.15,
        top_p:0.75,
        reasoning_effort:'none',
        max_completion_tokens:750,
        response_format:{
          type:'json_schema',
          json_schema:{
            name:'brique_radar_fallback',
            strict:false,
            schema:fallbackSchema
          }
        }
      })
    })
    const raw=await response.json().catch(()=>({}))
    if(!response.ok){
      const status=response.status
      const retryable=status===408||status===409||status===413||status===429||status>=500
      throw makeProviderError(raw?.error?.message||`Groq HTTP ${status}`,status,retryable)
    }
    return raw
  }catch(e){
    if((e as any)?.name==='AbortError')throw makeProviderError('Groq timeout',408,true)
    throw e
  }finally{
    clearTimeout(timer)
  }
}

export async function askGroq(
  key:string,origem:string,link:string,texto:string,preco:number,imagens:InputImage[],
  modo='anuncio',contextoAnterior:any=null,inspecaoNotas='',referencias:MarketRef[]=[],_perfilUsuario='',_contextoGarimpo=''
):Promise<GroqResult>{
  const selectedImages=sampleImages(imagens)
  const prompt=buildFallbackPrompt({
    origem,link,texto,preco,modo,contextoAnterior,inspecaoNotas,referencias,imageCount:selectedImages.length
  })

  const content:any[]=[{type:'text',text:prompt}]
  for(const image of selectedImages){
    content.push({
      type:'image_url',
      image_url:{url:`data:${image.mime_type};base64,${image.data}`}
    })
  }

  const raw=await callGroq(key,[{role:'user',content}])
  const text=raw?.choices?.[0]?.message?.content
  if(typeof text!=='string'||!text.trim())throw makeProviderError('A Groq não retornou uma análise utilizável.',502,true)

  try{
    return {raw,ai:JSON.parse(text),model:MODEL,fallback:true,provider:'groq',image_count:selectedImages.length}
  }catch{
    throw makeProviderError('A Groq retornou JSON inválido.',502,true)
  }
}
