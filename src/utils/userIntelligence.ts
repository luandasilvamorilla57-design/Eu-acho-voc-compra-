import type { AnaliseRow,PurchaseRow } from '../types/database'
import { daysBetween } from './purchase'
import { money,pct } from './format'

export type UserInsight={id:string;eyebrow:string;title:string;detail:string;tone:'green'|'blue'|'amber'}

export function buildUserIntelligence(purchases:PurchaseRow[],analyses:AnaliseRow[]){
  const sold=purchases.filter(p=>p.status==='vendido'&&p.preco_venda!=null)
  const avg=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0
  const avgRoi=avg(sold.map(p=>Number(p.roi_realizado??0)))
  const avgProfit=avg(sold.map(p=>Number(p.lucro_realizado??0)))
  const avgDays=avg(sold.filter(p=>p.data_venda).map(p=>daysBetween(p.data_compra,p.data_venda!)))

  const byCategory=new Map<string,{count:number;profit:number;roi:number;days:number}>()
  for(const p of sold){
    const key=(p.categoria||'Outros').trim()||'Outros'
    const current=byCategory.get(key)||{count:0,profit:0,roi:0,days:0}
    current.count++
    current.profit+=Number(p.lucro_realizado??0)
    current.roi+=Number(p.roi_realizado??0)
    current.days+=p.data_venda?daysBetween(p.data_compra,p.data_venda):0
    byCategory.set(key,current)
  }
  const categories=[...byCategory.entries()].map(([name,s])=>({
    name,count:s.count,avgProfit:s.profit/s.count,avgRoi:s.roi/s.count,avgDays:s.days/s.count
  })).sort((a,b)=>b.avgRoi-a.avgRoi)

  const analysisById=new Map(analyses.map(a=>[a.id,a]))
  const discounts:number[]=[]
  for(const p of purchases){
    if(!p.analise_id)continue
    const a=analysisById.get(p.analise_id)
    if(!a||!a.preco_anunciado)continue
    discounts.push((a.preco_anunciado-p.preco_compra)/a.preco_anunciado*100)
  }
  const avgDiscount=avg(discounts)

  const insights:UserInsight[]=[]
  if(categories[0]){
    insights.push({id:'category',eyebrow:'SEU MELHOR TERRENO',title:categories[0].name,detail:`ROI médio ${pct(categories[0].avgRoi)} · lucro médio ${money(categories[0].avgProfit)} · giro ${Math.round(categories[0].avgDays)} dias`,tone:'green'})
  }
  if(sold.length){
    insights.push({id:'speed',eyebrow:'SEU GIRO REAL',title:`${Math.round(avgDays)} dias para vender`,detail:`Média de ${sold.length} venda(s) concluída(s). Quanto menor, menos capital fica preso.`,tone:'blue'})
  }
  if(discounts.length){
    insights.push({id:'discount',eyebrow:'SUA NEGOCIAÇÃO',title:`${pct(avgDiscount)} abaixo do pedido`,detail:'Desconto médio conseguido nas compras que nasceram de uma análise do Radar.',tone:'amber'})
  }

  const profile=[
    sold.length?`Histórico real: ${sold.length} venda(s), ROI médio ${pct(avgRoi)}, lucro médio ${money(avgProfit)}, giro médio ${Math.round(avgDays)} dias.`:'',
    discounts.length?`Nas compras vinculadas a anúncios, o desconto médio obtido foi ${pct(avgDiscount)}.`:'',
    categories.slice(0,3).map(c=>`${c.name}: ${c.count} venda(s), ROI médio ${pct(c.avgRoi)}, lucro médio ${money(c.avgProfit)}, giro médio ${Math.round(c.avgDays)} dias.`).join(' ')
  ].filter(Boolean).join(' ')

  return {soldCount:sold.length,avgRoi,avgProfit,avgDays,avgDiscount,categories,insights,profile}
}
