import { schema } from './schema.ts'
import { buildPrompt } from './prompt.ts'

type InputImage={mime_type:string;data:string;name?:string}
type MarketRef={url?:string;price?:number;note?:string}
type GroqResult={raw:any;ai:any;model:string;fallback:boolean;provider:'groq';image_count:number}

const MODEL='qwen/qwen3.8-27b'
const MAX_GROQ_IMAGES=3
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
  if(images.length<=MAX_GROQ_IMAGES)return images
  const picks=[0,Math.floor((images.length-1)/2),images.length-1]
  return [...new Set(picks)].map(index=>images[index]).filter(Boolean)
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
        temperature:0.2,
        top_p:0.8,
        reasoning_effort:'none',
        max_completion_tokens:900,
        response_format:{
          type:'json_schema',
          json_schema:{
            name:'brique_radar_analysis',
            strict:false,
            schema:fallbackSchema
          }
        }
      })
    })
    const raw=await response.json().catch(()=>({}))
    if(!response.ok){
      const status=response.status
      const retryable=status===408||status===409||status===429||status>=500
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
  modo='anuncio',contextoAnterior:any=null,inspecaoNotas='',referencias:MarketRef[]=[],perfilUsuario='',contextoGarimpo=''
):Promise<GroqResult>{
  const selectedImages=sampleImages(imagens)
  const context=contextoAnterior?JSON.stringify(contextoAnterior).slice(0,24000):''
  const refs=JSON.stringify(referencias.slice(0,5)).slice(0,8000)
  const prompt=buildPrompt(
    origem,link,texto,preco,selectedImages.length,modo,context,inspecaoNotas,refs,
    perfilUsuario.slice(0,5000),contextoGarimpo.slice(0,5000)
  )+`

REGRAS DESTE PROVEDOR:
- Você NÃO possui URL Context, Google Search nem navegador nesta execução.
- Não diga que abriu, leu ou verificou qualquer URL.
- Para OLX, trate o link apenas como referência textual quando o conteúdo não estiver presente no texto.
- Para Facebook, use somente os prints anexados e o texto fornecido.
- Se faltarem dados por limitação da fonte, reduza a confiança e preencha dados_faltantes. Sem pelo menos 3 referências concretas fornecidas pelo usuário, limite confianca_preco a 60.
- MODO CONTINGÊNCIA: seja extremamente conciso. No máximo 2 riscos, 2 estratégias, 3 itens de checklist e 2 dados faltantes. Não repita explicações.
- Responda somente no JSON exigido pelo schema.`

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
    return {raw,ai:JSON.parse(text),model:MODEL,fallback:false,provider:'groq',image_count:selectedImages.length}
  }catch{
    throw makeProviderError('A Groq retornou JSON inválido.',502,true)
  }
}
