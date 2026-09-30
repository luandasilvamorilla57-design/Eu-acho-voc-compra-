import { useEffect, useRef } from 'react'
import { AnalysisView } from '../components/AnalysisView'
import type { VerdictAction } from '../components/analysis/RadarVerdictCard'
import { AnalysisForm } from '../components/new-analysis/AnalysisForm'
import { RadarLoader } from '../components/new-analysis/RadarLoader'
import { useNewAnalysis } from '../hooks/useNewAnalysis'
import { getRadarVerdict } from '../utils/radarVerdict'
import type { RadarConfigRow } from '../types/database'

export function NewAnalysisPage({onSaved,config,userProfile}:{onSaved:(destination:'dashboard'|'history')=>void;config:RadarConfigRow;userProfile:string}){
  const a=useNewAnalysis(onSaved,userProfile)
  const resultRef=useRef<HTMLDivElement|null>(null)
  useEffect(()=>{if(!a.result)return;const timer=window.setTimeout(()=>resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),180);return()=>window.clearTimeout(timer)},[a.result])

  const decide=(action:VerdictAction)=>{
    if(!a.result)return
    const verdict=getRadarVerdict(a.result,config)
    if(action==='negotiate')a.save('aguardando_negociacao','compensa','history','negotiate')
    else if(action==='discard')a.save('descartado','nao_compensa','history','discard')
    else a.save('analisado',verdict.kind,'dashboard','save')
  }

  return <div className="mx-auto max-w-5xl">
    <div className="mb-5 lg:mb-7"><div className="premium-eyebrow text-emerald-400">INTELIGÊNCIA COMERCIAL</div><h2 className="font-display mt-2 text-[32px] font-extrabold tracking-[-.05em] sm:text-4xl">Analise antes de negociar.</h2><p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">O Radar cruza o anúncio com referências concretas, sua meta e, quando já existir, o seu próprio histórico de compra e venda.</p>{userProfile&&<div className="history-learning-chip">● histórico real conectado a esta análise</div>}</div>
    <AnalysisForm {...a}/>
    {a.busy&&<RadarLoader origem={a.origem}/>}
    {a.result&&<div ref={resultRef} className="analysis-result-enter mt-5 scroll-mt-28"><div className="analysis-result-enter__line"><span/><strong>OPORTUNIDADE ANALISADA</strong><span/></div><AnalysisView a={a.result} onDecision={decide} decisionBusy={a.decisionBusy} config={config}/></div>}
  </div>
}
