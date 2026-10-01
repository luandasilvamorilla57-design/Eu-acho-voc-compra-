const APP_ORIGIN='https://radar-do-brique.vercel.app'
export function corsHeaders(req:Request){
  const origin=req.headers.get('origin')||''
  const local=/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const allowed=origin===APP_ORIGIN||local
  return {'Access-Control-Allow-Origin':allowed?origin:APP_ORIGIN,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Max-Age':'86400','Vary':'Origin','Cache-Control':'no-store'}
}
export const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0))
export const num=(v:any,f=0)=>{const n=typeof v==='number'?v:Number(v);return Number.isFinite(n)?n:f}
export const round=(n:number)=>Math.round(n*100)/100
export function sources(raw:any){const out:any[]=[],seen=new Set<string>();for(const step of raw?.steps??[])if(step?.type==='model_output')for(const block of step?.content??[])for(const a of block?.annotations??[])if(a?.url&&!seen.has(a.url)){seen.add(a.url);out.push({title:a.title||'Fonte consultada',url:a.url})}return out.slice(0,8)}
export function calculate(ai:any,price:number){const asking=price>0?price:num(ai?.precos?.preco_anunciado),median=num(ai?.mercado?.preco_mediano),offer=Math.max(0,Math.min(asking||Infinity,num(ai?.precos?.oferta_equilibrada,asking))),resale=num(ai?.precos?.revenda_provavel,median),costs=Math.max(0,num(ai?.precos?.custos_estimados));const profit=resale-offer-costs,roi=offer>0?profit/offer*100:0,margin=resale>0?profit/resale*100:0,adv=median>0&&asking>0?(median-asking)/median*100:0,discount=asking>0&&offer>0?(asking-offer)/asking*100:0;const score=Math.round(clamp(clamp(roi*2.15)*.30+clamp(50+adv*2.2)*.25+clamp(num(ai?.mercado?.liquidez_score))*.20+(100-clamp(num(ai?.risco_score)))*.15+clamp(num(ai?.confianca_geral))*.10));return{asking,score,classification:score>=82?'excelente':score>=68?'boa':score>=52?'atencao':score>=36?'arriscada':'evitar',calculated:{score_oportunidade:score,lucro_potencial:round(profit),roi_percentual:round(roi),margem_percentual:round(margin),vantagem_preco_percentual:round(adv),desconto_oferta_percentual:round(discount)}}}
