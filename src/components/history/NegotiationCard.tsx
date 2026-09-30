import { Handshake,MessageSquarePlus,Target,TimerReset } from 'lucide-react'
import type { AnaliseRow } from '../../types/database'
import type { AnalysisResult } from '../../types/analysis'
import { money } from '../../utils/format'

export function NegotiationCard({item,onOpen,onUpdate,onLog}:{item:AnaliseRow;onOpen:(a:AnaliseRow)=>void;onUpdate:(a:AnaliseRow)=>void;onLog:(a:AnaliseRow)=>void}){
  const a=item.analise_ia as unknown as AnalysisResult
  const history=Array.isArray(item.historico_negociacao)?item.historico_negociacao:[]
  return <article className="pipeline-negotiation-card">
    <div className="flex items-start gap-3"><span className="pipeline-negotiation-icon"><Handshake size={19}/></span><div className="min-w-0 flex-1"><span className="text-[8px] font-bold tracking-[.15em] text-emerald-400">AGUARDANDO NEGOCIAÇÃO</span><h3 className="font-display mt-1 truncate text-base font-bold pipeline-title">{item.titulo_anuncio}</h3><p className="mt-1 text-[10px] text-slate-500">{item.categoria||'Sem categoria'} · {history.length} registro(s)</p></div><div className="text-right"><span className="block text-[8px] text-slate-600">score</span><strong className="text-sm text-emerald-400">{a?.calculado?.score_oportunidade??'—'}</strong></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2"><div className="pipeline-mini"><Target size={13}/><span>Oferta indicada</span><strong>{money(item.oferta_recomendada)}</strong></div><div className="pipeline-mini"><TimerReset size={13}/><span>Preço pedido</span><strong>{money(item.preco_anunciado)}</strong></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>onLog(item)} className="pipeline-details"><MessageSquarePlus size={13}/> Registrar proposta</button><button onClick={()=>onUpdate(item)} className="pipeline-update">Resultado da negociação</button></div>
    <button onClick={()=>onOpen(item)} className="mt-2 w-full text-center text-[9px] text-slate-600">Ver análise completa</button>
  </article>
}
