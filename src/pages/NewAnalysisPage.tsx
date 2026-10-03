import { useEffect, useRef } from 'react'
import { ArrowRight,Handshake } from 'lucide-react'
import { AnalysisView } from '../components/AnalysisView'
import type { VerdictAction } from '../components/analysis/RadarVerdictCard'
import { AnalysisForm } from '../components/new-analysis/AnalysisForm'
import { RadarLoader } from '../components/new-analysis/RadarLoader'
import { useNewAnalysis } from '../hooks/useNewAnalysis'
import type { NegotiationPrefill } from '../hooks/useNegotiationAssistant'
import { getRadarVerdict } from '../utils/radarVerdict'
import type { PurchaseRow,RadarConfigRow } from '../types/database'
import type { BriqueOpportunity } from '../data/briqueCatalog'

export function NewAnalysisPage({onSaved,onNegotiate,onOpenNegotiation,config,userProfile,purchases,onUsageChanged,focus}:{onSaved:(destination:'dashboard'|'history')=>void;onNegotiate:(prefill:NegotiationPrefill)=>void;onOpenNegotiation:()=>void;config:RadarConfigRow;userProfile:string;purchases:PurchaseRow[];onUsageChanged:()=>Promise<boolean>;focus?:BriqueOpportunity|null}){
  const a=useNewAnalysis(onSaved,userProfile,onUsageChanged,focus||null)
  const resultRef=useRef<HTMLDivElement|null>(null)
  useEffect(()=>{if(!a.result)return;const timer=window.setTimeout(()=>resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),180);return()=>window.clearTimeout(timer)},[a.result])

  const decide=async(action:VerdictAction)=>{
    if(!a.result)return
    const verdict=getRadarVerdict(a.result)
    if(action==='negotiate'){
      const analysisId=await a.save('aguardando_negociacao',verdict.kind,'history','negotiate',false)
      if(!analysisId)return
      onNegotiate({
        analysisId,
        askingPrice:Number(a.result.precos.preco_anunciado||0),
        note:`Análise do Radar concluída para ${a.result.produto}. Use o contexto já analisado e conduza a negociação a partir dele.`,
        images:a.images.slice(0,3).map(({mime_type,data,name})=>({mime_type,data,name}))
      })
    }else if(action==='discard')await a.save('descartado','nao_compensa','history','discard')
    else await a.save('analisado',verdict.kind,'dashboard','save')
  }

  return <div className="mx-auto max-w-5xl">
    <div className="page-intro"><div className="premium-eyebrow text-emerald-400">INTELIGÊNCIA COMERCIAL</div><h2 className="font-display mt-2 text-[32px] font-extrabold tracking-[-.05em] sm:text-4xl">Analise antes de negociar.</h2><p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">O Radar identifica o produto, pesquisa usados comparáveis no mercado, calcula compra-alvo e teto, e mostra como preparar o item para revender melhor.</p>{userProfile&&<div className="history-learning-chip">● histórico real conectado a esta análise</div>}</div>
    <section className="analysis-negotiation-entry">
      <div className="analysis-negotiation-entry__icon"><Handshake size={19}/></div>
      <div className="analysis-negotiation-entry__copy">
        <span>NÃO SABE NEGOCIAR?</span>
        <strong>Deixe o Radar montar a conversa com o vendedor.</strong>
        <p>Você pode abrir o assistente direto ou analisar primeiro e levar o produto já com preço, fotos e contexto preenchidos.</p>
      </div>
      <button type="button" onClick={onOpenNegotiation}>Abrir negociação <ArrowRight size={15}/></button>
    </section>
    <AnalysisForm {...a} focus={focus||null}/>
    {a.busy&&<RadarLoader origem={a.origem}/>}
    {a.result&&<div ref={resultRef} className="analysis-result-enter mt-5 scroll-mt-28"><div className="analysis-result-enter__line"><span/><strong>OPORTUNIDADE ANALISADA</strong><span/></div><AnalysisView a={a.result} onDecision={decide} decisionBusy={a.decisionBusy} config={config} purchases={purchases}/></div>}
  </div>
}
