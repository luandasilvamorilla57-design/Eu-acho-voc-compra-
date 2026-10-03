import type { AnalysisResult } from '../types/analysis'
import { money,pct } from './format'

export type RadarVerdictKind='compensa'|'nao_compensa'
export type RadarVerdict={kind:RadarVerdictKind;headline:string;label:string;summary:string;actionHint:string;reasons:string[];maxPrice:number}

export function getRadarVerdict(a:AnalysisResult):RadarVerdict{
  const risk=Math.max(0,Number(a.risco_score||0))
  const liquidity=Math.max(0,Number(a.mercado?.liquidez_score||0))
  const confidence=Math.max(0,Number(a.confianca_preco||a.confianca_geral||0))
  const asking=Math.max(0,Number(a.precos.preco_anunciado||0))
  const target=Math.max(0,Number(a.precos.oferta_equilibrada||0))
  const ceiling=Math.max(target,Number(a.precos.teto_compra||target||0))
  const costs=Math.max(0,Number(a.precos.custos_estimados||0))
  const resale=Math.max(0,Number(a.revenda?.preco_fechamento_alvo??a.precos.revenda_provavel??0))
  const profitAtTarget=resale-target-costs
  const roiAtTarget=target>0?profitAtTarget/target*100:0
  const roomToNegotiate=asking>0&&ceiling>0?asking-ceiling:0
  const highRisks=(a.riscos??[]).filter(r=>r.nivel==='alto')
  const mediumRisks=(a.riscos??[]).filter(r=>r.nivel==='medio')

  // No user-configured minimum profit, ROI or percentage is used here.
  // The deal remains negotiable whenever a defensible buy price exists with positive spread,
  // manageable risk and enough market liquidity. Small positive deals are not auto-discarded.
  const unsafe=ceiling<=0||target<=0||resale<=0||profitAtTarget<=0||risk>=85||liquidity<20
  const viable=!unsafe
  const kind:RadarVerdictKind=viable?'compensa':'nao_compensa'
  const reasons:string[]=[]

  if(kind==='compensa'){
    if(asking>ceiling)reasons.push('O anúncio está acima do teto seguro. A oportunidade existe somente se a negociação trouxer o valor para até '+money(ceiling)+'.')
    else reasons.push('O preço pedido já está dentro do teto calculado, mas ainda vale negociar para tentar fechar perto de '+money(target)+'.')

    reasons.push('No valor-alvo, a diferença estimada entre compra, preparação e revenda é de '+money(profitAtTarget)+' ('+pct(roiAtTarget)+' sobre a compra).')

    if(roomToNegotiate>0)reasons.push('Há '+money(roomToNegotiate)+' entre o preço pedido e o teto; use condição, acessórios e custos reais para negociar sem inventar defeitos.')
    if(liquidity>=65)reasons.push('A liquidez estimada é boa, o que ajuda a transformar margem em venda com mais rapidez.')
    else if(risk>=50)reasons.push('O negócio ainda pode fazer sentido, mas os testes e riscos precisam ser confirmados antes de pagar.')
  }else{
    if(profitAtTarget<=0)reasons.push('Mesmo no valor-alvo, compra + custos não deixam diferença positiva suficiente para a revenda estimada.')
    if(risk>=85)reasons.push('O risco do produto está alto demais para avançar sem novas evidências ou uma queda forte no preço.')
    if(liquidity<20)reasons.push('A liquidez está muito baixa; o item pode prender capital por tempo demais.')
    if(highRisks.length)reasons.push('Alerta principal: '+highRisks[0].titulo+'.')
    else if(mediumRisks.length&&reasons.length<3)reasons.push('Ponto que precisa ser esclarecido: '+mediumRisks[0].titulo+'.')
    if(!reasons.length)reasons.push('Ainda não existe uma faixa de compra defensável com os dados disponíveis.')
  }

  return {
    kind,
    headline:kind==='compensa'?'COMPENSA NEGOCIAR':'NÃO COMPENSA AGORA',
    label:kind==='compensa'?'VEREDITO DO RADAR':'ALERTA DO RADAR',
    summary:kind==='compensa'
      ? 'A oportunidade é avaliada pelo próprio negócio: mercado, preço de entrada, custos, risco e revenda — sem meta pessoal de lucro mínimo ou ROI.'
      : 'Nas condições atuais, o próprio negócio ainda não oferece uma faixa de compra segura. Uma queda de preço ou novas informações pode mudar isso.',
    actionHint:kind==='compensa'
      ? 'Comece abaixo, tente fechar perto de '+money(target)+' e não passe de '+money(ceiling)+'.'
      : 'Não descarte por meta pessoal: reavalie quando o preço, o risco ou a informação do produto mudar.',
    reasons:reasons.slice(0,4),
    maxPrice:ceiling
  }
}
