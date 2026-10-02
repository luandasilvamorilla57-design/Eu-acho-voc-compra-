import { useMemo,useState } from 'react'
import { ArchiveX,CheckCircle2,Clock3,ListFilter,Sparkles } from 'lucide-react'
import type { AnaliseRow,RadarConfigRow,ResaleDraftRow } from '../types/database'
import { HistoryFilters } from '../components/history/HistoryFilters'
import { HistoryList } from '../components/history/HistoryList'
import { ResaleHistoryList } from '../components/history/ResaleHistoryList'
import { NegotiationCard } from '../components/history/NegotiationCard'
import { NegotiationResultModal } from '../components/history/NegotiationResultModal'
import { NegotiationLogModal } from '../components/history/NegotiationLogModal'
import { InspectionModal } from '../components/history/InspectionModal'
import { exportHistoryCsv } from '../utils/exportCsv'

type Tab='waiting'|'all'|'ads'|'discarded'|'finished'

export function HistoryPage({items,drafts,config,onOpen,onOpenAd,onAdSold,onAdNotSold,onEdit,onNegotiationBought,onNegotiationFailed,onNegotiationLog,onReinspect}:{items:AnaliseRow[];drafts:ResaleDraftRow[];config:RadarConfigRow;onOpen:(a:AnaliseRow)=>void;onOpenAd:(a:ResaleDraftRow)=>void;onAdSold:(a:ResaleDraftRow,price:number)=>Promise<void>;onAdNotSold:(a:ResaleDraftRow)=>Promise<void>;onEdit:(a:AnaliseRow)=>void;onNegotiationBought:(id:string,price:number)=>Promise<void>;onNegotiationFailed:(id:string)=>Promise<void>;onNegotiationLog:(id:string,offer:number|null,counter:number|null,response:string,note:string)=>Promise<void>;onReinspect:(id:string,notes:string,images:{mime_type:string;data:string;name:string}[])=>Promise<void>}){
  const waiting=items.filter(i=>i.pipeline_status==='aguardando_negociacao')
  const [tab,setTab]=useState<Tab>(waiting.length?'waiting':'all')
  const [q,setQ]=useState('')
  const [updating,setUpdating]=useState<AnaliseRow|null>(null)
  const [logging,setLogging]=useState<AnaliseRow|null>(null)
  const [inspecting,setInspecting]=useState<AnaliseRow|null>(null)

  const filtered=useMemo(()=>{
    const search=(i:AnaliseRow)=>String(i.titulo_anuncio+' '+(i.categoria??'')).toLowerCase().includes(q.toLowerCase())
    let base=items
    if(tab==='waiting')base=items.filter(i=>i.pipeline_status==='aguardando_negociacao')
    if(tab==='discarded')base=items.filter(i=>i.pipeline_status==='descartado')
    if(tab==='finished')base=items.filter(i=>['negociacao_falhou','comprado','vendido'].includes(i.pipeline_status))
    return base.filter(search)
  },[items,q,tab])

  const filteredDrafts=useMemo(()=>{
    const query=q.trim().toLowerCase()
    if(!query)return drafts
    return drafts.filter(d=>String(d.produto+' '+(d.titulo??'')+' '+(d.categoria??'')).toLowerCase().includes(query))
  },[drafts,q])

  const allCount=items.length+drafts.length
  const tabs=[
    ['waiting','Negociação',Clock3,waiting.length],
    ['all','Todos',ListFilter,allCount],
    ['ads','Anúncios IA',Sparkles,drafts.length],
    ['discarded','Descartados',ArchiveX,items.filter(i=>i.pipeline_status==='descartado').length],
    ['finished','Finalizados',CheckCircle2,items.filter(i=>['negociacao_falhou','comprado','vendido'].includes(i.pipeline_status)).length]
  ] as const

  return <div className="history-page space-y-4">
    <div className="page-intro history-page-intro"><div className="premium-eyebrow text-emerald-400">HISTÓRICO COMPLETO</div><h2 className="font-display mt-2 text-[32px] font-extrabold tracking-[-.05em] sm:text-4xl">Da análise até o anúncio e a compra.</h2><p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">Acompanhe análises, negociações, resultados e todos os anúncios preparados com IA em um único histórico.</p></div>

    <div className="pipeline-tabs pipeline-tabs--history">{tabs.map(([id,label,Icon,count])=><button key={id} onClick={()=>setTab(id)} className={'pipeline-tab '+(tab===id?'is-active':'')}><Icon size={15}/><span>{label}</span><b>{count}</b></button>)}</div>

    <HistoryFilters q={q} setQ={setQ} onExport={()=>exportHistoryCsv(filtered)}/>

    {tab==='ads'
      ? <ResaleHistoryList items={filteredDrafts} onOpen={onOpenAd} onSold={onAdSold} onNotSold={onAdNotSold}/>
      : tab==='waiting'
        ? (filtered.length?<div className="history-negotiation-grid">{filtered.map(item=><NegotiationCard key={item.id} item={item} onOpen={onOpen} onUpdate={setUpdating} onLog={setLogging}/>)}</div>:<div className="glass rounded-[24px] p-8 text-center"><Clock3 className="mx-auto text-emerald-400" size={24}/><h3 className="font-display mt-3 text-lg font-bold pipeline-title">Nenhuma negociação aguardando</h3><p className="mt-2 text-xs text-slate-500">Quando o Radar disser que compensa negociar, a oportunidade aparecerá aqui.</p></div>)
        : <div className="space-y-4"><HistoryList items={filtered} onOpen={onOpen} onEdit={onEdit} onInspect={setInspecting}/>{tab==='all'&&filteredDrafts.length>0&&<ResaleHistoryList items={filteredDrafts} onOpen={onOpenAd} onSold={onAdSold} onNotSold={onAdNotSold}/>}</div>
    }

    {updating&&<NegotiationResultModal item={updating} onClose={()=>setUpdating(null)} onBought={onNegotiationBought} onFailed={onNegotiationFailed}/>}
    {logging&&<NegotiationLogModal item={logging} config={config} onClose={()=>setLogging(null)} onSave={onNegotiationLog}/>}
    {inspecting&&<InspectionModal item={inspecting} onClose={()=>setInspecting(null)} onReinspect={onReinspect}/>}
  </div>
}
