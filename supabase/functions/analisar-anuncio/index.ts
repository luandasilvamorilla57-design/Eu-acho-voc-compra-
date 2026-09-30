import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { askGemini } from './gemini.ts'
import { calculate,cors,num,sources } from './helpers.ts'

type InputImage={mime_type:string;data:string;name?:string}
type MarketRef={url?:string;price?:number;note?:string}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const requestId=crypto.randomUUID()
  try{
    const key=Deno.env.get('GEMINI_API_KEY')
    if(!key)return Response.json({error:'GEMINI_API_KEY não configurada.',request_id:requestId},{status:503,headers:cors})

    const b=await req.json()
    const modo=b.modo==='inspecao'?'inspecao':'anuncio'
    const origem=['olx','facebook','manual'].includes(b.origem)?b.origem:'manual'
    const link=typeof b.link==='string'?b.link.trim():''
    const texto=typeof b.texto==='string'?b.texto.trim():''
    const preco=num(b.preco)
    const imagens:Array<InputImage>=Array.isArray(b.imagens)?b.imagens.slice(0,6):[]
    const inspecaoNotas=typeof b.inspecao_notas==='string'?b.inspecao_notas.trim():''
    const contextoAnterior=b.contexto_anterior??null
    const perfilUsuario=typeof b.perfil_usuario==='string'?b.perfil_usuario.trim():''
    const referencias:Array<MarketRef>=Array.isArray(b.referencias_mercado)?b.referencias_mercado.slice(0,5).map((r:any)=>({
      url:typeof r?.url==='string'?r.url.trim():'',
      price:Math.max(0,num(r?.price)),
      note:typeof r?.note==='string'?r.note.trim().slice(0,500):''
    })):[]

    if(modo==='anuncio'){
      if(origem==='olx'&&!link)return Response.json({error:'Cole o link do anúncio da OLX.',request_id:requestId},{status:400,headers:cors})
      if(origem==='facebook'&&!imagens.length)return Response.json({error:'Envie pelo menos um print do anúncio do Facebook Marketplace.',request_id:requestId},{status:400,headers:cors})
      if(origem==='manual'&&!texto)return Response.json({error:'Cole os dados do anúncio.',request_id:requestId},{status:400,headers:cors})
    }else if(!inspecaoNotas&&!imagens.length){
      return Response.json({error:'Informe o que encontrou na inspeção ou envie fotos novas.',request_id:requestId},{status:400,headers:cors})
    }

    const urls=[link,...referencias.map(r=>r.url||'')].filter(Boolean)
    if(urls.some(url=>!/^https?:\/\//i.test(url)))return Response.json({error:'Há um link inválido nas referências.',request_id:requestId},{status:400,headers:cors})
    for(const image of imagens){
      if(!image?.data||typeof image.data!=='string'||image.data.length>3_000_000)return Response.json({error:'Uma imagem é inválida ou grande demais.',request_id:requestId},{status:400,headers:cors})
      if(!['image/jpeg','image/png','image/webp'].includes(image.mime_type))return Response.json({error:'Formato de imagem não suportado.',request_id:requestId},{status:400,headers:cors})
    }

    console.log('ANALYSIS_START',JSON.stringify({requestId,modo,origem,imageCount:imagens.length,referenceCount:referencias.length}))
    const {raw,ai,model,fallback}=await askGemini(key,origem,link,texto,preco,imagens,modo,contextoAnterior,inspecaoNotas,referencias,perfilUsuario)
    const c=calculate(ai,preco)

    if(modo==='anuncio'&&origem==='facebook'&&(!ai?.produto||String(ai.produto).toLowerCase().includes('não identificado'))){
      return Response.json({error:'Não consegui identificar o produto com segurança nesses prints. Envie prints mais completos.',request_id:requestId},{status:422,headers:cors})
    }

    const analysis={...ai,precos:{...ai.precos,preco_anunciado:c.asking},calculado:{...c.calculated,classificacao:c.classification},fontes_verificadas:sources(raw),meta:{modelo:model,fallback_automatico:fallback,origem,analisado_em:new Date().toISOString(),aviso:modo==='inspecao'?'Reavaliação baseada nas informações pós-visita.':'Confirme funcionamento, procedência e valores antes de comprar.'}}
    console.log('ANALYSIS_OK',JSON.stringify({requestId,model,fallback,score:c.score}))
    return Response.json({analysis,request_id:requestId},{headers:cors})
  }catch(e){
    console.error('ANALYSIS_ERROR',requestId,e)
    const message=e instanceof Error?e.message:'Erro interno'
    const lower=message.toLowerCase()
    if(lower.includes('quota')||lower.includes('rate limit')||lower.includes('resource_exhausted'))return Response.json({error:'A cota gratuita da Gemini foi atingida. Aguarde a renovação do limite e tente novamente.',request_id:requestId},{status:429,headers:cors})
    if(lower.includes('high demand')||lower.includes('service unavailable')||lower.includes('try again later'))return Response.json({error:'Os modelos gratuitos da Gemini estão temporariamente congestionados. Tente novamente em instantes.',request_id:requestId},{status:503,headers:cors})
    return Response.json({error:message,request_id:requestId},{status:500,headers:cors})
  }
})
