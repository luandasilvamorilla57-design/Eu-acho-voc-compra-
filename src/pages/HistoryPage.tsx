import { useMemo,useState } from 'react'
import { ArchiveX,CheckCircle2,Clock3,ListFilter,MessageCircle,Sparkles } from 'lucide-react'
import type { AnaliseRow,RadarConfigRow,ResaleDraftRow } from '../types/database'
import { useNegotiationAssistant } from '../hooks/useNegotiationAssistant'
import { HistoryFilters } from '../components/history/HistoryFilters'
import { HistoryList } from '../components/history/HistoryList'
import { ResaleHistoryList } from '../components/history/ResaleHistoryList'
import { AssistantHistoryList } from '../components/history/AssistantHistoryList'
import { NegotiationCard } from '../components/history/NegotiationCard'
import { NegotiationResultModal } from '../components/history/NegotiationResultModal'
import { NegotiationLogModal } from '../components/history/NegotiationLogModal'
import { InspectionModal } from '../components/history/InspectionModal'
import { exportHistoryCsv } from '../utils/exportCsv'

type HistoryMode='analyses'|'ads'|'assistant'
type AnalysisFilter='all'|'waiting'|'discarded'|'finished'

export function HistoryPage({items,drafts,config,onOpen,onOpenAd,onOpenAssistant,onAdSold,onAdNotSold,onEdit,onNegotiationBought,onNegotiationFailed,onNegotiationLog,onReinspect}:{items:AnaliseRow[];drafts:ResaleDraftRow[];config:RadarConfigRow;onOpen:(a:AnaliseRow)=>void;onOpenAd:(a:ResaleDraftRow)=>void;onOpenAssistant:(id:string)=>void;onAdSold:(a:ResaleDraftRow,price:number)=>Promise<void>;onAdNotSold:(a:ResaleDraftRow)=>Promise<void>;onEdit:(a:AnaliseRow)=>void;onNegotiationBought:(id:string,price:number)=>Promise<void>;onNegotiationFailed:(id:string)=>Promise<void>;onNegotiationLog:(id:string,offer:number|null,counter:number|null,response:string,note:string)=>Promise<void>;onReinspect:(id:string,notes:string,images:{mime_type:string;data:string;name:string}[])=>Promise<void>}){
  const waiting=items.filter(i=>i.pipeline_status==='aguardando_negociacao')
  const [mode,setMode]=useState<HistoryMode>('analyses')
  const [analysisFilter,setAnalysisFilter]=useState<AnalysisFilter>(waiting.length?'waiting':'all')
  const [q,setQ]=useState('')
  const [updating,setUpdating]=useState<AnaliseRow|null>(null)
  const [logging,setLogging]=useState<AnaliseRow|null>(null)
  const [inspecting,setInspecting]=useState<AnaliseRow|null>(null)
  const {sessions,loading:assistantLoading}=useNegotiationAssistant(true)

  const filteredAnalyses=useMemo(()=>{
    const query=q.trim().toLowerCase()
    const matches=(i:AnaliseRow)=>String(i.titulo_anuncio+' '+(i.categoria??'')).toLowerCase().includes(query)
    let base=items
    if(analysisFilter==='waiting')base=items.filter(i=>i.pipeline_status==='aguardando_negociacao')
    if(analysisFilter==='discarded')base=items.filter(i=>i.pipeline_status==='descartado')
    if(analysisFilter==='finished')base=items.filter(i=>['negociacao_falhou','comprado','vendido'].includes(i.pipeline_status))
    return base.filter(matches)
  },[items,q,analysisFilter])

  const filteredDrafts=useMemo(()=>{
    const query=q.trim().toLowerCase()
    if(!query)return drafts
    return drafts.filter(d=>String(d.produto+' '+(d.titulo??'')+' '+(d.categoria??'')).toLowerCase().includes(query))
  },[drafts,q])

  const filteredSessions=useMemo(()=>{
    const query=q.trim().toLowerCase()
    if(!query)return sessions
    return sessions.filter(s=>String(s.produto+' '+(s.categoria??'')+' '+(s.marca??'')+' '+(s.modelo??'')).toLowerCase().includes(query))
  },[sessions,q])

  const modeTabs=[
    ['analyses','Análises',ListFilter,items.length],
    ['ads','Anúncios IA',Sparkles,drafts.length],
    ['assistant','Não sabe negociar?',MessageCircle,sessions.length]
  ] as const

  const filterTabs=[
    ['all','Todos',ListFilter,items.length],
    ['waiting','Negociação',Clock3,waiting.length],
    ['discarded','Descartados',ArchiveX,items.filter(i=>i.pipeline_status==='descartado').length],
    ['finished','Finalizados',CheckCircle2,items.filter(i=>['negociacao_falhou','comprado','vendido'].includes(i.pipeline_status)).length]
  ] as const

  const modeCopy=mode==='analyses'
    ? {eyebrow:'HISTÓRICO DE ANÁLISES',title:'Tudo que o Radar já analisou.',text:'Consulte resultados, fotos enviadas, negociações e desfechos de cada oportunidade.'}
    : mode==='ads'
      ? {eyebrow:'HISTÓRICO DE ANÚNCIOS IA',title:'Anúncios preparados para venda.',text:'Diagnóstico das fotos, copy gerada, preço sugerido e resultado real ficam juntos aqui.'}
      : {eyebrow:'HISTÓRICO DO ASSISTENTE',title:'Conversas do “Não sabe negociar?”.',text:'Negociações abertas e encerradas ficam separadas para você retomar sem confundir com as análises.'}

  return <div className="history-page space-y-4">
    <div className="page-intro history-page-intro"><div className="premium-eyebrow text-emerald-400">CENTRAL DE HISTÓRICO</div><h2 className="font-display mt-2 text-[32px] font-extrabold tracking-[-.05em] sm:text-4xl">Cada etapa no lugar certo.</h2><p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">Análises, anúncios criados com IA e conversas de negociação agora ficam organizados em históricos separados.</p></div>

    <div className="history-mode-tabs">{modeTabs.map(([id,label,Icon,count])=><button key={id} type="button" onClick={()=>{setMode(id);setQ('')}} className={'history-mode-tab '+(mode===id?'is-active':'')}><span className="history-mode-tab__icon"><Icon size={17}/></span><span className="history-mode-tab__copy"><small>HISTÓRICO</small><strong>{label}</strong></span><b>{count}</b></button>)}</div>
    <section className="history-mode-intro"><div><span>{modeCopy.eyebrow}</span><h3>{modeCopy.title}</h3><p>{modeCopy.text}</p></div></section>

    {mode==='analyses'&&<div className="history-status-tabs">{filterTabs.map(([id,label,Icon,count])=><button key={id} type="button" onClick={()=>setAnalysisFilter(id)} className={analysisFilter===id?'is-active':''}><Icon size={14}/><span>{label}</span><b>{count}</b></button>)}</div>}
    <HistoryFilters q={q} setQ={setQ} onExport={mode==='analyses'?()=>exportHistoryCsv(filteredAnalyses):undefined}/>

    {mode==='ads'
      ? <ResaleHistoryList items={filteredDrafts} onOpen={onOpenAd} onSold={onAdSold} onNotSold={onAdNotSold}/>
      : mode==='assistant'
        ? <AssistantHistoryList items={filteredSessions} loading={assistantLoading} onOpen={onOpenAssistant}/>
        : analysisFilter==='waiting'
          ? (filteredAnalyses.length?<div className="history-negotiation-grid">{filteredAnalyses.map(item=><NegotiationCard key={item.id} item={item} onOpen={onOpen} onUpdate={setUpdating} onLog={setLogging}/>)}</div>:<div className="glass rounded-[24px] p-8 text-center"><Clock3 className="mx-auto text-emerald-400" size={24}/><h3 className="font-display mt-3 text-lg font-bold pipeline-title">Nenhuma negociação aguardando</h3><p className="mt-2 text-xs text-slate-500">Quando o Radar disser que compensa negociar, a oportunidade aparecerá aqui.</p></div>)
          : <HistoryList items={filteredAnalyses} onOpen={onOpen} onEdit={onEdit} onInspect={setInspecting}/>
    }

    {updating&&<NegotiationResultModal item={updating} onClose={()=>setUpdating(null)} onBought={onNegotiationBought} onFailed={onNegotiationFailed}/>}
    {logging&&<NegotiationLogModal item={logging} config={config} onClose={()=>setLogging(null)} onSave={onNegotiationLog}/>}
    {inspecting&&<InspectionModal item={inspecting} onClose={()=>setInspecting(null)} onReinspect={onReinspect}/>}
  </div>
}
