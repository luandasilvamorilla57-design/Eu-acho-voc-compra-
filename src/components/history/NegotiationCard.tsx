import { ChevronRight,Gauge,Handshake,MessageSquarePlus,Target,TimerReset } from 'lucide-react'
import type { AnaliseRow } from '../../types/database'
import type { AnalysisResult } from '../../types/analysis'
import { money } from '../../utils/format'

export function NegotiationCard({item,onOpen,onUpdate,onLog}:{item:AnaliseRow;onOpen:(a:AnaliseRow)=>void;onUpdate:(a:AnaliseRow)=>void;onLog:(a:AnaliseRow)=>void}){
  const a=item.analise_ia as unknown as AnalysisResult
  const history=Array.isArray(item.historico_negociacao)?item.historico_negociacao:[]
  const score=a?.calculado?.score_oportunidade??'—'

  return <article className="pipeline-negotiation-card history-negotiation-card">
    <div className="history-negotiation-head">
      <span className="pipeline-negotiation-icon history-negotiation-icon"><Handshake size={20}/></span>
      <div className="history-negotiation-main">
        <div className="history-negotiation-statusline">
          <span className="history-negotiation-status">AGUARDANDO NEGOCIAÇÃO</span>
          <span className="history-score"><Gauge size={13}/><span>Score</span><strong>{score}</strong></span>
        </div>
        <h3 className="history-negotiation-title">{item.titulo_anuncio}</h3>
        <p className="history-negotiation-meta">{item.categoria||'Sem categoria'} <i/> {history.length} registro(s)</p>
      </div>
    </div>

    <div className="history-negotiation-metrics">
      <div className="history-price-box history-price-box--offer">
        <span className="history-price-box__icon"><Target size={15}/></span>
        <div><span>Oferta indicada</span><strong>{money(item.oferta_recomendada)}</strong></div>
      </div>
      <div className="history-price-box">
        <span className="history-price-box__icon"><TimerReset size={15}/></span>
        <div><span>Preço pedido</span><strong>{money(item.preco_anunciado)}</strong></div>
      </div>
    </div>

    <div className="history-negotiation-actions">
      <button onClick={()=>onUpdate(item)} className="history-action-primary">Resultado da negociação</button>
      <button onClick={()=>onLog(item)} className="history-action-secondary"><MessageSquarePlus size={16}/> Registrar proposta</button>
    </div>

    <button onClick={()=>onOpen(item)} className="history-analysis-link">Ver análise completa <ChevronRight size={15}/></button>
  </article>
}
