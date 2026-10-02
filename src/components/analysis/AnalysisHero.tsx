import { ScoreRing } from '../ScoreRing'
import type { AnalysisResult } from '../../types/analysis'

const colors:any={excelente:'text-emerald-300 bg-emerald-400/10',boa:'text-blue-300 bg-blue-400/10',atencao:'text-amber-300 bg-amber-400/10',arriscada:'text-orange-300 bg-orange-400/10',evitar:'text-red-300 bg-red-400/10'}

const classificationLabels:Record<string,string>={
  excelente:'Excelente oportunidade',
  boa:'Boa oportunidade',
  atencao:'Oportunidade com atenção',
  arriscada:'Oportunidade arriscada',
  evitar:'Evitar oportunidade'
}

export function AnalysisHero({a}:{a:AnalysisResult}){
  const classification=a.calculado.classificacao
  const classificationLabel=classificationLabels[classification]??String(classification).replace(/_/g,' ')
  return <section className="analysis-hero relative overflow-hidden rounded-[28px] p-5 sm:p-7"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl"/><div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-2xl"><div className={`inline-flex rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.18em] ${colors[classification]}`}>{classificationLabel}</div><h2 className="font-display mt-3 text-2xl font-extrabold tracking-[-.04em] sm:text-3xl">{a.produto}</h2><p className="mt-2 text-xs leading-5 text-white/65 sm:text-sm">{a.resumo}</p></div><ScoreRing score={a.calculado.score_oportunidade}/></div></section>
}
