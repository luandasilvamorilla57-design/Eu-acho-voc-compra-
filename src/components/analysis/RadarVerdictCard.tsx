import { AlertTriangle,ArrowRight,CheckCircle2,ShieldAlert,Target,XCircle } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import { getRadarVerdict } from '../../utils/radarVerdict'

export type VerdictAction='negotiate'|'discard'|'save'

export function RadarVerdictCard({
  a,onAction,busy
}:{
  a:AnalysisResult
  onAction?:(action:VerdictAction)=>void
  busy?:VerdictAction|null
}){
  const verdict=getRadarVerdict(a)
  const good=verdict.kind==='compensa'
  return <section className={`radar-verdict ${good?'radar-verdict--good':'radar-verdict--bad'}`}>
    <div className="radar-verdict__glow"/>
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="radar-verdict__signal">
          {good?<CheckCircle2 size={24}/>:<ShieldAlert size={24}/>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="radar-verdict__eyebrow">{verdict.label}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={`radar-verdict__bubble ${good?'is-good':'is-bad'}`}>
              <span className="radar-verdict__pulse"/>
              {verdict.headline}
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 radar-verdict__summary">{verdict.summary}</p>
        </div>
      </div>

      <div className="radar-verdict__reasons mt-5">
        {verdict.reasons.map((reason,index)=><div key={index} className="radar-verdict__reason">
          {good?<Target size={14}/>:<AlertTriangle size={14}/>}
          <span>{reason}</span>
        </div>)}
      </div>

      <div className="radar-verdict__hint mt-4">{verdict.actionHint}</div>

      {onAction&&<div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
        {good?
          <button disabled={!!busy} onClick={()=>onAction('negotiate')} className="radar-verdict__primary radar-verdict__primary--good">
            <CheckCircle2 size={17}/>{busy==='negotiate'?'Salvando...':'Levar para negociação'}<ArrowRight size={16}/>
          </button>
          :
          <button disabled={!!busy} onClick={()=>onAction('discard')} className="radar-verdict__primary radar-verdict__primary--bad">
            <XCircle size={17}/>{busy==='discard'?'Descartando...':'Descartar oportunidade'}
          </button>
        }
        <button disabled={!!busy} onClick={()=>onAction('save')} className="radar-verdict__secondary">
          {busy==='save'?'Salvando...':'Só salvar análise'}
        </button>
      </div>}
    </div>
  </section>
}
