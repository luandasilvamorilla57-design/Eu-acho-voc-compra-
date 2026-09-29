import { Eye,SlidersHorizontal } from 'lucide-react'
import type { AnaliseRow,PipelineStatus } from '../../types/database'
import type { AnalysisResult } from '../../types/analysis'
import { dateBR,money } from '../../utils/format'

const labels:Record<PipelineStatus,string>={
  analisado:'Analisado',
  aguardando_negociacao:'Negociando',
  descartado:'Descartado',
  negociacao_falhou:'Não fechou',
  comprado:'Comprado',
  vendido:'Vendido'
}

export function HistoryList({items,onOpen,onEdit}:{items:AnaliseRow[];onOpen:(a:AnaliseRow)=>void;onEdit:(a:AnaliseRow)=>void}){
 return <section className="glass overflow-hidden rounded-[22px]">
  {items.length?<div className="divide-y divide-slate-800/80">{items.map(i=>{
    const a=i.analise_ia as unknown as AnalysisResult
    return <div key={i.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5">
      <button onClick={()=>onOpen(i)} className="text-left">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm pipeline-title">{i.titulo_anuncio}</strong>
          <span className={`pipeline-badge pipeline-badge--${i.pipeline_status}`}>{labels[i.pipeline_status]}</span>
        </div>
        <span className="mt-1 block text-[10px] text-slate-600">{i.categoria||'Sem categoria'} · {dateBR(i.data_criacao)}</span>
      </button>
      <div className="flex gap-5">
        <div><span className="block text-[9px] text-slate-600">Score</span><b className="text-sm text-emerald-300">{a?.calculado?.score_oportunidade??'—'}</b></div>
        <div><span className="block text-[9px] text-slate-600">Lucro real</span><b className="text-sm pipeline-title">{i.lucro_realizado!=null?money(i.lucro_realizado):'—'}</b></div>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>onOpen(i)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-800 text-slate-500"><Eye size={13}/></button>
        <button onClick={()=>onEdit(i)} className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-800 px-3 text-[10px] text-slate-400"><SlidersHorizontal size={13}/> Status</button>
      </div>
    </div>
  })}</div>:<div className="grid min-h-48 place-items-center p-8 text-xs text-slate-600">Nenhum registro encontrado.</div>}
 </section>
}
