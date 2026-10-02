import { schema } from './schema.ts'
import { buildPrompt } from './prompt.ts'

type InputImage={mime_type:string;data:string;name?:string}
type MarketRef={url?:string;price?:number;note?:string}
type GeminiResult={raw:any;ai:any;model:string;fallback:boolean}
const MODELS=['gemini-3.5-flash-lite'] as const
const TIMEOUT_MS=22000

function shouldFallback(raw:any,status:number){
  const code=String(raw?.error?.code||'').toLowerCase()
  const message=String(raw?.error?.message||'').toLowerCase()
  return status===429||status===503||code.includes('service_unavailable')||code.includes('resource_exhausted')||message.includes('high demand')||message.includes('temporarily unavailable')||message.includes('try again later')
}

async function callModel(key:string,model:string,input:any[],responseFormat:any,useUrlContext:boolean){
  const body:any={model,input,response_format:responseFormat}
  if(useUrlContext)body.tools=[{type:'url_context'}]
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS)
  try{
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-goog-api-key':key,'Api-Revision':'2026-05-20'},
      body:JSON.stringify(body),
      signal:controller.signal
    })
    const raw=await response.json().catch(()=>({}))
    return {response,raw}
  }catch(e){
    if((e as any)?.name==='AbortError'){
      const error:any=new Error('Gemini timeout')
      error.status=408
      error.retryable=true
      error.provider='gemini'
      throw error
    }
    throw e
  }finally{
    clearTimeout(timer)
  }
}

export async function askGemini(
  key:string,origem:string,link:string,texto:string,preco:number,imagens:InputImage[],
  modo='anuncio',contextoAnterior:any=null,inspecaoNotas='',referencias:MarketRef[]=[],perfilUsuario='',contextoGarimpo=''
):Promise<GeminiResult>{
  const responseFormat={type:'text',mime_type:'application/json',schema}
  const context=contextoAnterior?JSON.stringify(contextoAnterior).slice(0,24000):''
  const refs=JSON.stringify(referencias.slice(0,5)).slice(0,8000)
  const input:any[]=[{type:'text',text:buildPrompt(origem,link,texto,preco,imagens.length,modo,context,inspecaoNotas,refs,perfilUsuario.slice(0,5000),contextoGarimpo.slice(0,5000))}]
  for(const image of imagens)input.push({type:'image',mime_type:image.mime_type,data:image.data})
  const hasReferenceUrl=referencias.some(r=>typeof r.url==='string'&&/^https?:\/\//i.test(r.url))
  const useUrlContext=(origem==='olx'&&!!link)||hasReferenceUrl

  let lastError:any=null
  for(let index=0;index<MODELS.length;index++){
    const model=MODELS[index]
    const {response,raw}=await callModel(key,model,input,responseFormat,useUrlContext)
    if(!response.ok){
      console.error('GEMINI_API_ERROR',model,response.status,JSON.stringify(raw))
      lastError={raw,status:response.status,model}
      if(index<MODELS.length-1&&shouldFallback(raw,response.status)){await new Promise(resolve=>setTimeout(resolve,350));continue}
      const error:any=new Error(raw?.error?.message||'Falha ao consultar a Gemini.')
      error.status=response.status
      error.retryable=shouldFallback(raw,response.status)||response.status===408||response.status>=500
      error.provider='gemini'
      throw error
    }
    const text=raw?.output_text??raw?.steps?.flatMap((s:any)=>s?.content??[]).find((c:any)=>c?.type==='text'&&typeof c?.text==='string')?.text
    if(!text){lastError={raw,status:500,model};if(index<MODELS.length-1)continue;throw new Error('A IA não retornou uma análise utilizável.')}
    try{
      return {raw,ai:JSON.parse(text),model,fallback:index>0}
    }catch{
      const error:any=new Error('A Gemini retornou JSON inválido.')
      error.status=502
      error.retryable=true
      error.provider='gemini'
      throw error
    }
  }
  throw new Error(lastError?.raw?.error?.message||'Nenhum modelo da Gemini ficou disponível para a análise.')
}
