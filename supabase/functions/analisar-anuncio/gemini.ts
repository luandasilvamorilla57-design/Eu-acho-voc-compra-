import { schema } from './schema.ts'
import { buildPrompt } from './prompt.ts'

export async function askGemini(key:string,link:string,texto:string,preco:number){
  const responseFormat={
    type:'text',
    mime_type:'application/json',
    schema,
  }

  const tools=link
    ? [{type:'url_context'},{type:'google_search'}]
    : [{type:'google_search'}]

  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-goog-api-key':key,
      'Api-Revision':'2026-05-20'
    },
    body:JSON.stringify({
      model:'gemini-3.8-flash',
      input:buildPrompt(link,texto,preco),
      tools,
      response_format:responseFormat
    })
  })

  const raw=await r.json()

  if(!r.ok){
    console.error('GEMINI_API_ERROR',JSON.stringify(raw))
    throw new Error(raw?.error?.message||'Falha ao consultar a Gemini.')
  }

  const text=
    raw?.output_text ??
    raw?.steps
      ?.flatMap((s:any)=>s?.content??[])
      .find((c:any)=>c?.type==='text'&&typeof c?.text==='string')
      ?.text

  if(!text){
    console.error('GEMINI_EMPTY_OUTPUT',JSON.stringify(raw))
    throw new Error('A IA não retornou uma análise utilizável.')
  }

  return {raw,ai:JSON.parse(text)}
}
