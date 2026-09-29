import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { askGemini } from './gemini.ts'
import { calculate,cors,num,sources } from './helpers.ts'

type InputImage={mime_type:string;data:string;name?:string}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})

  try{
    const key=Deno.env.get('GEMINI_API_KEY')
    if(!key)return Response.json({error:'GEMINI_API_KEY não configurada.'},{status:503,headers:cors})

    const b=await req.json()
    const origem=['olx','facebook','manual'].includes(b.origem)?b.origem:'manual'
    const link=typeof b.link==='string'?b.link.trim():''
    const texto=typeof b.texto==='string'?b.texto.trim():''
    const preco=num(b.preco)
    const imagens:Array<InputImage>=Array.isArray(b.imagens)?b.imagens.slice(0,6):[]

    if(origem==='olx'&&!link){
      return Response.json({error:'Cole o link do anúncio da OLX.'},{status:400,headers:cors})
    }
    if(origem==='facebook'&&!imagens.length){
      return Response.json({error:'Envie pelo menos um print do anúncio do Facebook Marketplace.'},{status:400,headers:cors})
    }
    if(origem==='manual'&&!texto){
      return Response.json({error:'Cole os dados do anúncio.'},{status:400,headers:cors})
    }
    if(link&&!/^https?:\/\//i.test(link)){
      return Response.json({error:'Link inválido.'},{status:400,headers:cors})
    }

    for(const image of imagens){
      if(!image?.data||typeof image.data!=='string'||image.data.length>3_000_000){
        return Response.json({error:'Um dos prints é inválido ou ficou grande demais. Tente novamente.'},{status:400,headers:cors})
      }
      if(!['image/jpeg','image/png','image/webp'].includes(image.mime_type)){
        return Response.json({error:'Formato de imagem não suportado.'},{status:400,headers:cors})
      }
    }

    const {raw,ai}=await askGemini(key,origem,link,texto,preco,imagens)
    const c=calculate(ai,preco)

    if(origem==='facebook'&&(!ai?.produto||String(ai.produto).toLowerCase().includes('não identificado'))){
      return Response.json({
        error:'Não consegui identificar o produto com segurança nesses prints. Envie prints mais completos mostrando título, preço, fotos e descrição.'
      },{status:422,headers:cors})
    }

    const analysis={
      ...ai,
      precos:{...ai.precos,preco_anunciado:c.asking},
      calculado:{...c.calculated,classificacao:c.classification},
      fontes_verificadas:sources(raw),
      meta:{
        modelo:'gemini-3.5-flash',
        origem,
        analisado_em:new Date().toISOString(),
        aviso:origem==='facebook'
          ? 'Análise baseada nos prints enviados. Confirme funcionamento, procedência e valores antes de comprar.'
          : 'Modo gratuito sem Google Search. Confirme estado, procedência e valores antes de comprar.'
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
