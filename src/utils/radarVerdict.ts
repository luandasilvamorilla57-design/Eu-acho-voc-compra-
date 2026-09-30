import type { AnalysisResult } from '../types/analysis'
import type { RadarConfigRow } from '../types/database'
import { money,pct } from './format'

export type RadarVerdictKind='compensa'|'nao_compensa'
export type RadarVerdict={kind:RadarVerdictKind;headline:string;label:string;summary:string;actionHint:string;reasons:string[];maxPrice:number}

export function getRadarVerdict(a:AnalysisResult,config?:RadarConfigRow):RadarVerdict{
  const roi=a.calculado.roi_percentual??0
  const profit=a.calculado.lucro_potencial??0
  const risk=a.risco_score??0
  const liquidity=a.mercado?.liquidez_score??0
  const classification=a.calculado.classificacao
  const asking=a.precos.preco_anunciado??0
  const recommended=a.precos.oferta_equilibrada??0
  const ceiling=a.precos.teto_compra??recommended
  const desiredProfit=config?.lucro_minimo??50
  const desiredRoi=config?.roi_minimo??10
  const capital=config?.capital_disponivel??0
  const targetCeiling=Math.max(0,(a.precos.revenda_provavel??0)-(a.precos.custos_estimados??0)-desiredProfit)
  const safeCeiling=targetCeiling>0?Math.min(ceiling||targetCeiling,targetCeiling):ceiling
  const maxPrice=Math.max(0,Math.min(safeCeiling>0?safeCeiling:Number.POSITIVE_INFINITY,recommended>0?recommended:Number.POSITIVE_INFINITY))
  const realMax=Number.isFinite(maxPrice)?maxPrice:Math.max(safeCeiling,recommended,0)
  const capitalOk=!capital||realMax<=capital
  const highRisks=(a.riscos??[]).filter(r=>r.nivel==='alto')
  const mediumRisks=(a.riscos??[]).filter(r=>r.nivel==='medio')

  const hardStop=classification==='evitar'||profit<=0||roi<Math.max(8,desiredRoi*.55)||risk>=70||liquidity<28||realMax<=0
  const viable=!hardStop&&profit>=desiredProfit&&roi>=desiredRoi&&risk<=65&&liquidity>=40&&capitalOk
  const kind:RadarVerdictKind=viable?'compensa':'nao_compensa'
  const reasons:string[]=[]

  if(kind==='compensa'){
    if(asking>0&&realMax>0&&asking>realMax)reasons.push('O preço pedido está acima do seu ponto seguro. Só avance se fechar em até '+money(realMax)+'.')
    else if(realMax>0)reasons.push('Pela sua meta de lucro, o teto recomendado é '+money(realMax)+'.')
    reasons.push('ROI potencial de '+pct(roi)+' com lucro estimado de '+money(profit)+'.')
    if(capital)reasons.push('A entrada cabe no capital configurado de '+money(capital)+'.')
    if(liquidity>=70)reasons.push('Liquidez forte: tende a girar mais rápido.')
    else if(risk>=45)reasons.push('Há riscos relevantes; confirme defeitos e custos antes de pagar.')
  }else{
    if(!capitalOk)reasons.push('Esta entrada ultrapassa o capital disponível de '+money(capital)+'.')
    if(profit<desiredProfit)reasons.push('O lucro projetado não atinge sua meta de '+money(desiredProfit)+'.')
    if(roi<desiredRoi)reasons.push('ROI de '+pct(roi)+' abaixo da sua meta de '+pct(desiredRoi)+'.')
    if(risk>=70)reasons.push('O risco está alto demais para a margem disponível.')
    else if(liquidity<40)reasons.push('Liquidez fraca: há maior chance de capital ficar parado.')
    if(highRisks.length)reasons.push('Alerta principal: '+highRisks[0].titulo+'.')
    else if(mediumRisks.length&&reasons.length<3)reasons.push('Ponto de atenção: '+mediumRisks[0].titulo+'.')
    if(!reasons.length)reasons.push('A relação entre preço, risco e velocidade de revenda não atende sua estratégia.')
  }

  return {
    kind,
    headline:kind==='compensa'?'COMPENSA NEGOCIAR':'NÃO ENTRA NA SUA META',
    label:kind==='compensa'?'VEREDITO DO RADAR':'ALERTA DO RADAR',
    summary:kind==='compensa'?'Vale conversar com o vendedor, mas respeitando seu teto e sua meta.':'Nas condições atuais, esta oportunidade não atende bem às regras que você configurou.',
    actionHint:kind==='compensa'?'Entre na negociação e respeite o teto de '+money(realMax)+'.':'Só reavalie se preço, condição ou seu capital mudarem de forma relevante.',
    reasons:reasons.slice(0,4),
    maxPrice:realMax
  }
}
