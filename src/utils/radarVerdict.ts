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
  const aiCeiling=a.precos.teto_compra??recommended
  const capital=config?.capital_disponivel??0
  const realMax=Math.max(0,aiCeiling||recommended||0)
  const highRisks=(a.riscos??[]).filter(r=>r.nivel==='alto')
  const mediumRisks=(a.riscos??[]).filter(r=>r.nivel==='medio')

  const hardStop=classification==='evitar'||profit<=0||roi<8||risk>=75||liquidity<25||realMax<=0
  const viable=!hardStop&&roi>=10&&risk<=70&&liquidity>=35
  const kind:RadarVerdictKind=viable?'compensa':'nao_compensa'
  const reasons:string[]=[]

  if(kind==='compensa'){
    if(asking>0&&realMax>0&&asking>realMax)reasons.push('O preço pedido está acima do ponto seguro. Só avance se conseguir negociar para até '+money(realMax)+'.')
    else if(realMax>0)reasons.push('Pelos dados do anúncio, o teto de compra do Radar é '+money(realMax)+'.')
    reasons.push('ROI potencial de '+pct(roi)+' com lucro estimado de '+money(profit)+'.')
    if(capital&&realMax>capital)reasons.push('Está acima do seu caixa de '+money(capital)+', mas não foi descartado: tente trazer a negociação para uma faixa que caiba no seu capital.')
    else if(capital)reasons.push('O teto calculado cabe no seu caixa atual de '+money(capital)+'.')
    if(liquidity>=70)reasons.push('Liquidez forte: tende a girar mais rápido.')
    else if(risk>=45)reasons.push('Há riscos relevantes; confirme testes e custos antes de pagar.')
  }else{
    if(roi<10)reasons.push('O retorno potencial está apertado para o risco assumido: '+pct(roi)+'.')
    if(risk>=75)reasons.push('O risco está alto demais para a margem disponível.')
    else if(liquidity<35)reasons.push('Liquidez fraca: há maior chance de o dinheiro ficar parado.')
    if(highRisks.length)reasons.push('Alerta principal: '+highRisks[0].titulo+'.')
    else if(mediumRisks.length&&reasons.length<3)reasons.push('Ponto de atenção: '+mediumRisks[0].titulo+'.')
    if(!reasons.length)reasons.push('A relação entre preço, risco, lucro e velocidade de revenda ainda não está boa o suficiente.')
  }

  return {
    kind,
    headline:kind==='compensa'?'COMPENSA NEGOCIAR':'NÃO COMPENSA AGORA',
    label:kind==='compensa'?'VEREDITO DO RADAR':'ALERTA DO RADAR',
    summary:kind==='compensa'?'Vale conversar com o vendedor, mas respeitando o teto, os testes e os riscos do produto.':'Nas condições atuais, preço, risco ou liquidez ainda não justificam a compra.',
    actionHint:kind==='compensa'?'Entre na negociação e respeite o teto de '+money(realMax)+'.':'Reavalie se o preço cair ou se novas informações reduzirem o risco.',
    reasons:reasons.slice(0,4),
    maxPrice:realMax
  }
}
