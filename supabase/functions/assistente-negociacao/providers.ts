import { negotiationSchema } from './schema.ts'

type Provider='gemini'|'groq'
type InputImage={mime_type:string;data:string;name?:string}

const GEMINI_MODEL='gemini-3.5-flash-lite'
const GROQ_MODEL='qwen/qwen3.8-27b'
const TIMEOUT_MS=22000

function providerError(provider:Provider,message:string,status=500,retryable=true){
  const error:any=new Error(message)
  error.provider=provider
  error.status=status
  error.retryable=retryable
  return error
}

async function withTimeout(url:string,init:RequestInit,provider:Provider){
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS)
  try{
    return await fetch(url,{...init,signal:controller.signal})
  }catch(e){
    if((e as any)?.name==='AbortError')throw providerError(provider,provider+' timeout',408,true)
    throw e
  }finally{
    clearTimeout(timer)
  }
}

export async function askGemini(key:string,prompt:string,images:InputImage[]){
  const input:any[]=[{type:'text',text:prompt}]
  for(const image of images)input.push({type:'image',mime_type:image.mime_type,data:image.data})
  const response=await withTimeout(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method:'POST',
      headers:{'Content-Type':'application/json','x-goog-api-key':key,'Api-Revision':'2026-05-20'},
      body:JSON.stringify({
        model:GEMINI_MODEL,
        input,
        response_format:{type:'text',mime_type:'application/json',schema:negotiationSchema}
      })
    },
    'gemini'
  )
  const raw=await response.json().catch(()=>({}))
  if(!response.ok){
    const status=response.status
    const retryable=status===408||status===429||status>=500
    throw providerError('gemini',raw?.error?.message||`Gemini HTTP ${status}`,status,retryable)
  }
  const text=raw?.output_text??raw?.steps?.flatMap((s:any)=>s?.content??[]).find((c:any)=>c?.type==='text'&&typeof c?.text==='string')?.text
  if(typeof text!=='string'||!text.trim())throw providerError('gemini','Gemini sem resposta utilizável.',502,true)
  try{return{provider:'gemini' as const,model:GEMINI_MODEL,raw,ai:JSON.parse(text)}}catch{throw providerError('gemini','Gemini retornou JSON inválido.',502,true)}
}

export async function askGroq(key:string,prompt:string,images:InputImage[]){
  const content:any[]=[{type:'text',text:prompt}]
  for(const image of images){
    content.push({type:'image_url',image_url:{url:`data:${image.mime_type};base64,${image.data}`}})
  }
  const response=await withTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method:'POST',
      headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:GROQ_MODEL,
        messages:[{role:'user',content}],
        temperature:.25,
        top_p:.85,
        reasoning_effort:'none',
        max_completion_tokens:3500,
        response_format:{type:'json_schema',json_schema:{name:'brique_negotiation',strict:false,schema:negotiationSchema}}
      })
    },
    'groq'
  )
  const raw=await response.json().catch(()=>({}))
  if(!response.ok){
    const status=response.status
    const retryable=status===408||status===409||status===429||status>=500
    throw providerError('groq',raw?.error?.message||`Groq HTTP ${status}`,status,retryable)
  }
  const text=raw?.choices?.[0]?.message?.content
  if(typeof text!=='string'||!text.trim())throw providerError('groq','Groq sem resposta utilizável.',502,true)
  try{return{provider:'groq' as const,model:GROQ_MODEL,raw,ai:JSON.parse(text)}}catch{throw providerError('groq','Groq retornou JSON inválido.',502,true)}
}
