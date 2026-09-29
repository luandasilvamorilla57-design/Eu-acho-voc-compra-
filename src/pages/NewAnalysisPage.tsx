import { useEffect, useRef } from 'react'
import { AnalysisView } from '../components/AnalysisView'
import { AnalysisForm } from '../components/new-analysis/AnalysisForm'
import { RadarLoader } from '../components/new-analysis/RadarLoader'
import { useNewAnalysis } from '../hooks/useNewAnalysis'

export function NewAnalysisPage({onSaved}:{onSaved:()=>void}){
  const a=useNewAnalysis(onSaved)
  const resultRef=useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    if(!a.result)return
    const timer=window.setTimeout(()=>{
      resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'})
    },180)
    return()=>window.clearTimeout(timer)
  },[a.result])

  return <div className="mx-auto max-w-5xl">
    <div className="mb-5 lg:mb-7">
      <div className="text-[9px] font-bold tracking-[.2em] text-emerald-400">INTELIGÊNCIA COMERCIAL</div>
      <h2 className="font-display mt-2 text-[32px] font-extrabold tracking-[-.05em] sm:text-4xl">Analise antes de negociar.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Escolha a origem do anúncio. O Radar adapta a leitura para OLX, Facebook Marketplace ou entrada manual.</p>
    </div>

    <AnalysisForm {...a}/>

    {a.busy&&<RadarLoader origem={a.origem}/>}

    {a.result&&
      <div ref={resultRef} className="analysis-result-enter mt-5 scroll-mt-28">
        <div className="analysis-result-enter__line">
          <span/>
          <strong>OPORTUNIDADE ANALISADA</strong>
          <span/>
        </div>
        <AnalysisView a={a.result} onSave={a.save} saving={a.saving}/>
      </div>
    }
  </div>
}
