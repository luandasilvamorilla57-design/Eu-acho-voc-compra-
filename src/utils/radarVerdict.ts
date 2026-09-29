import type { AnalysisResult } from '../types/analysis'
import { money,pct } from './format'

export type RadarVerdictKind='compensa'|'nao_compensa'

export type RadarVerdict={
  kind:RadarVerdictKind
  headline:string
  label:string
  summary:string
  actionHint:string
  reasons:string[]
  maxPrice:number
}

export function getRadarVerdict(a:AnalysisResult):RadarVerdict{
  const roi=a.calculado.roi_percentual??0
  const profit=a.calculado.lucro_potencial??0
  const risk=a.risco_score??0
  const liquidity=a.mercado?.liquidez_score??0
  const classification=a.calculado.classificacao
  const asking=a.precos.preco_anunciado??0
  const recommended=a.precos.oferta_equilibrada??0
  const ceiling=a.precos.teto_compra??recommended
  const maxPrice=Math.max(0,Math.min(
    ceiling>0?ceiling:Number.POSITIVE_INFINITY,
    recommended>0?recommended:Number.POSITIVE_INFINITY
  ))
  const realMax=Number.isFinite(maxPrice)?maxPrice:Math.max(ceiling,recommended,0)
  const highRisks=(a.riscos??[]).filter(r=>r.nivel==='alto')
  const mediumRisks=(a.riscos??[]).filter(r=>r.nivel==='medio')

  const hardStop=
    classification==='evitar' ||
    profit<=0 ||
    roi<8 ||
    risk>=70 ||
    liquidity<28 ||
    realMax<=0

  const viable=
    !hardStop &&
    profit>=50 &&
    roi>=10 &&
    risk<=65 &&
    liquidity>=40

  const kind:RadarVerdictKind=viable?'compensa':'nao_compensa'
  const reasons:string[]=[]

  if(kind==='compensa'){
    if(asking>0&&realMax>0&&asking>realMax){
      reasons.push(`O preço pedido está acima do ponto seguro. Só avance se fechar em até ${money(realMax)}.`)
    }else if(realMax>0){
      reasons.push(`O teto recomendado para preservar margem é ${money(realMax)}.`)
    }
    reasons.push(`ROI potencial de ${pct(roi)} com lucro estimado de ${money(profit)}.`)
    if(liquidity>=70)reasons.push('Liquidez forte: tende a girar mais rápido no mercado de usados.')
    else if(liquidity>=40)reasons.push('Liquidez aceitável: há saída, mas pode exigir preço correto e paciência.')
    if(risk>=45)reasons.push('Há riscos relevantes; confirme os defeitos e custos antes de pagar.')
    else reasons.push('O nível de risco está dentro de uma faixa administrável para negociação.')
  }else{
    if(profit<=0)reasons.push('A projeção atual não deixa lucro real suficiente para a revenda.')
    else if(roi<10)reasons.push(`ROI de apenas ${pct(roi)}: a margem está apertada para o risco envolvido.`)
    if(risk>=70)reasons.push('O risco está alto demais para a margem disponível.')
    else if(risk>=50)reasons.push('Os riscos do produto consomem uma parte importante da margem.')
    if(liquidity<28)reasons.push('Liquidez baixa: é um item com maior chance de ficar parado.')
    else if(liquidity<40)reasons.push('Liquidez fraca: a revenda pode demorar mais que o ideal.')
    if(highRisks.length)reasons.push(`Alerta principal: ${highRisks[0].titulo}.`)
    else if(mediumRisks.length&&reasons.length<3)reasons.push(`Ponto de atenção: ${mediumRisks[0].titulo}.`)
    if(!reasons.length)reasons.push('A relação entre preço, risco e velocidade de revenda não ficou atraente.')
  }

  return {
    kind,
    headline:kind==='compensa'?'COMPENSA NEGOCIAR':'NÃO COMPENSA',
    label:kind==='compensa'?'VEREDITO DO RADAR':'ALERTA DO RADAR',
    summary:kind==='compensa'
      ?'Vale conversar com o vendedor, mas isso não significa comprar pelo preço pedido.'
      :'Nas condições atuais, esta oportunidade não protege bem seu capital.',
    actionHint:kind==='compensa'
      ?`Entre na negociação e respeite o teto de ${money(realMax)}. Se fechar, registre o valor realmente pago.`
      :'Descarte agora. Só reavalie se o preço ou a condição do produto mudar de forma relevante.',
    reasons:reasons.slice(0,4),
    maxPrice:realMax
  }
}
