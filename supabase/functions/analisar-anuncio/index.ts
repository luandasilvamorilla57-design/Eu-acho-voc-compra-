import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { askGemini } from './gemini.ts'
import { calculate,cors,num,sources } from './helpers.ts'

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})

  try{
    const key=Deno.env.get('GEMINI_API_KEY')
    if(!key)return Response.json({error:'GEMINI_API_KEY não configurada.'},{status:503,headers:cors})

    const b=await req.json()
    const link=typeof b.link==='string'?b.link.trim():''
    const texto=typeof b.texto==='string'?b.texto.trim():''
    const preco=num(b.preco)

    if(!link&&!texto)return Response.json({error:'Informe o link ou o texto do anúncio.'},{status:400,headers:cors})
    if(link&&!/^https?:\/\//i.test(link))return Response.json({error:'Link inválido.'},{status:400,headers:cors})

    const {raw,ai}=await askGemini(key,link,texto,preco)
    const c=calculate(ai,preco)

    const analysis={
      ...ai,
      precos:{...ai.precos,preco_anunciado:c.asking},
      calculado:{...c.calculated,classificacao:c.classification},
      fontes_verificadas:sources(raw),
      meta:{
        modelo:'gemini-3.5-flash',
        analisado_em:new Date().toISOString(),
        aviso:'Modo gratuito: sem Google Search. Confirme estado, procedência e valores antes de comprar.'
      }
    }

    return Response.json({analysis},{headers:cors})
  }catch(e){
    console.error(e)
    const message=e instanceof Error?e.message:'Erro interno'
    const lower=message.toLowerCase()

    if(lower.includes('quota')||lower.includes('rate limit')||lower.includes('resource_exhausted')){
      return Response.json({
        error:'A cota gratuita da Gemini foi atingida. Aguarde a renovação do limite ou tente novamente mais tarde.'
      },{status:429,headers:cors})
    }

    return Response.json({error:message},{status:500,headers:cors})
  }
})
