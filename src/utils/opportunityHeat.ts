import type { AnalysisResult } from '../types/analysis'

export type HeatKey='gelada'|'fria'|'morna'|'quente'|'fervendo'

export type OpportunityHeat={
  key:HeatKey
  label:string
  action:string
  summary:string
  value:number
}

export function getOpportunityHeat(a:AnalysisResult):OpportunityHeat{
  const score=Math.max(0,Math.min(100,Number(a.calculado?.score_oportunidade||0)))
  const risk=Math.max(0,Math.min(100,Number(a.risco_score||0)))
  const confidence=Math.max(0,Math.min(100,Number(a.confianca_geral||0)))

  if(score>=82)return{
    key:'fervendo',label:'MUITO QUENTE',action:'AVANÇAR PARA NEGOCIAÇÃO',
    summary:risk>55||confidence<55?'A margem chama atenção, mas valide os riscos antes de colocar dinheiro.':'Os números estão fortes. Avance se o produto passar nos testes e no checklist.',
    value:score
  }
  if(score>=68)return{
    key:'quente',label:'QUENTE',action:'NEGOCIAR',
    summary:'Existe espaço interessante, mas o preço de entrada continua sendo decisivo.',
    value:score
  }
  if(score>=52)return{
    key:'morna',label:'MORNA',action:'SÓ COM DESCONTO',
    summary:'Pode virar negócio se a negociação melhorar ou se os riscos forem menores do que parecem.',
    value:score
  }
  if(score>=36)return{
    key:'fria',label:'FRIA',action:'CAUTELA',
    summary:'A relação entre margem, risco e preço ainda não está convincente.',
    value:score
  }
  return{
    key:'gelada',label:'GELADA',action:'EVITAR',
    summary:'O negócio está fraco nas condições atuais. Preserve o caixa e procure outra oportunidade.',
    value:score
  }
}
