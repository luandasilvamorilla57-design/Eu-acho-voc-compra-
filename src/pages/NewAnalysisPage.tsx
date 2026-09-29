import { AnalysisView } from '../components/AnalysisView'
import { AnalysisForm } from '../components/new-analysis/AnalysisForm'
import { useNewAnalysis } from '../hooks/useNewAnalysis'

export function NewAnalysisPage({onSaved}:{onSaved:()=>void}){
  const a=useNewAnalysis(onSaved)
  const busyText=a.origem==='facebook'
    ? 'Radar lendo os prints, identificando produto, preço, estado e sinais de risco...'
    : a.origem==='olx'
      ? 'Radar acessando o anúncio e estruturando a oportunidade...'
      : 'Radar interpretando os dados e calculando a oportunidade...'

  return <div className="mx-auto max-w-5xl">
    <div className="mb-5 lg:mb-7">
      <div className="text-[9px] font-bold tracking-[.2em] text-emerald-400">INTELIGÊNCIA COMERCIAL</div>
      <h2 className="font-display mt-2 text-[32px] font-extrabold tracking-[-.05em] sm:text-4xl">Analise antes de negociar.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Escolha a origem do anúncio. O Radar adapta a leitura para OLX, Facebook Marketplace ou entrada manual.</p>
    </div>
    <AnalysisForm {...a}/>
    {a.busy&&<div className="mt-4 glass rounded-2xl p-4 text-xs leading-5 text-slate-400">{busyText}</div>}
    {a.result&&<div className="mt-5"><AnalysisView a={a.result} onSave={a.save} saving={a.saving}/></div>}
  </div>
}
