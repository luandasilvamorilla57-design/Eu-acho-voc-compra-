import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const schema={type:'object',properties:{
  titulo:{type:'string'},descricao:{type:'string'},
  preco_venda_rapida:{type:'number'},preco_equilibrado:{type:'number'},preco_premium:{type:'number'},
  pontos_destaque:{type:'array',items:{type:'string'}},
  checklist_fotos:{type:'array',items:{type:'string'}},
  resposta_negociacao:{type:'string'}
},required:['titulo','descricao','preco_venda_rapida','preco_equilibrado','preco_premium','pontos_destaque','checklist_fotos','resposta_negociacao']}
const MODELS=['gemini-3.5-flash','gemini-3.5-flash-lite']

function transient(raw:any,status:number){
  const message=String(raw?.error?.message||'').toLowerCase()
  return status===429||status===503||message.includes('high demand')||message.includes('temporarily')||message.includes('resource exhausted')
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return Response.json({error:'Método não permitido'},{status:405,headers:cors})
  const requestId=crypto.randomUUID()
  try{
    const key=Deno.env.get('GEMINI_API_KEY')
    if(!key)return Response.json({error:'IA indisponível.',request_id:requestId},{status:503,headers:cors})
    const b=await req.json()
    const produto=String(b.produto||'').trim().slice(0,300)
    if(!produto)return Response.json({error:'Produto não informado.',request_id:requestId},{status:400,headers:cors})
    const context=JSON.stringify({
      produto,
      categoria:String(b.categoria||'').slice(0,120),
      observacoes:String(b.observacoes||'').slice(0,2000),
      custo_total:Number(b.custo_total||0),
      preco_minimo:Number(b.preco_minimo||0),
      analise:b.analise||null
    }).slice(0,26000)
    const prompt=`Você é um especialista brasileiro em anúncios de produtos usados para revenda.
Crie um anúncio honesto, humano e convincente, sem linguagem exagerada e sem inventar especificações, acessórios, estado ou defeitos.
Use apenas informações presentes no contexto. Se algo não estiver confirmado, não afirme.
O preço rápido deve ser o menor preço razoável, nunca abaixo do preco_minimo quando ele for maior que zero.
preco_venda_rapida <= preco_equilibrado <= preco_premium.
A descrição deve ser pronta para OLX/Facebook Marketplace, clara, escaneável e transparente sobre observações reais.
checklist_fotos deve dizer quais fotos concretas aumentam confiança para esse produto.
resposta_negociacao deve ser curta e natural para responder a alguém pedindo desconto.

CONTEXTO:
${context}`

    let lastMessage='Falha ao gerar anúncio.'
    for(let i=0;i<MODELS.length;i++){
      const body={model:MODELS[i],input:[{type:'text',text:prompt}],response_format:{type:'text',mime_type:'application/json',schema}}
      const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key,'Api-Revision':'2026-05-20'},body:JSON.stringify(body)})
      const raw=await response.json()
      if(!response.ok){
        lastMessage=raw?.error?.message||lastMessage
        console.error('RESALE_MODEL_ERROR',requestId,MODELS[i],response.status,lastMessage)
        if(i<MODELS.length-1&&transient(raw,response.status)){await new Promise(r=>setTimeout(r,300));continue}
        throw new Error(lastMessage)
      }
      const text=raw?.output_text??raw?.steps?.flatMap((s:any)=>s?.content??[]).find((c:any)=>c?.type==='text'&&typeof c?.text==='string')?.text
      if(!text){lastMessage='A IA não retornou o anúncio.';if(i<MODELS.length-1)continue;throw new Error(lastMessage)}
      const ad=JSON.parse(text)
      ad.gerado_em=new Date().toISOString()
      console.log('RESALE_AD_OK',JSON.stringify({requestId,produto,model:MODELS[i],fallback:i>0}))
      return Response.json({ad,request_id:requestId,model:MODELS[i],fallback:i>0},{headers:cors})
    }
    throw new Error(lastMessage)
  }catch(e){
    console.error('RESALE_AD_ERROR',requestId,e)
    const message=e instanceof Error?e.message:'Erro interno'
    const lower=message.toLowerCase()
    const status=lower.includes('quota')||lower.includes('rate')||lower.includes('resource')?429:lower.includes('high demand')||lower.includes('temporarily')?503:500
    return Response.json({error:status===503?'A IA está congestionada. Tente novamente em instantes.':message,request_id:requestId},{status,headers:cors})
  }
})
