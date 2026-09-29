import { schema } from './schema.ts'
import { buildPrompt } from './prompt.ts'

type InputImage={mime_type:string;data:string;name?:string}

export async function askGemini(
  key:string,
  origem:string,
  link:string,
  texto:string,
  preco:number,
  imagens:InputImage[]
){
  const responseFormat={
    type:'text',
    mime_type:'application/json',
    schema,
  }

  const input:any[]=[
    {type:'text',text:buildPrompt(origem,link,texto,preco,imagens.length)}
  ]

  for(const image of imagens){
    input.push({
      type:'image',
      mime_type:image.mime_type,
      data:image.data
    })
  }

  const body:any={
    model:'gemini-3.5-flash',
    input,
    response_format:responseFormat
  }

  if(origem==='olx'&&link){
    body.tools=[{type:'url_context'}]
  }

  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-goog-api-key':key,
      'Api-Revision':'2026-05-20'
    },
    body:JSON.stringify(body)
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
