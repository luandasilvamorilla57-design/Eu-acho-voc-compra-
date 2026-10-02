import { schema } from './schema.ts'
import { buildPrompt } from './prompt.ts'

type InputImage={mime_type:string;data:string;name?:string}
type MarketRef={url?:string;price?:number;note?:string}
type GroqResult={raw:any;ai:any;model:string;fallback:boolean;provider:'groq';image_count:number}

const MODEL='qwen/qwen3.8-27b'
const MAX_GROQ_IMAGES=3
const TIMEOUT_MS=22000

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
        max_completion_tokens:5200,
        response_format:{
          type:'json_schema',
          json_schema:{
            name:'brique_radar_analysis',
            strict:true,
            schema
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
- Você NÃO possui URL Context nem navegador nesta execução.
- Não diga que abriu, leu ou verificou qualquer URL.
- Para OLX, trate o link apenas como referência textual quando o conteúdo não estiver presente no texto.
- Para Facebook, use somente os prints anexados e o texto fornecido.
- Se faltarem dados por limitação da fonte, reduza a confiança e preencha dados_faltantes.
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
