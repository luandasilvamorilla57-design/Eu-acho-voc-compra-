import { ArrowRight,CheckCircle2,Clock3,MessageCircle,PauseCircle,Target,XCircle } from 'lucide-react'
import type { AssistedNegotiationRow } from '../../types/database'
import { dateBR,money } from '../../utils/format'

function statusMeta(status:AssistedNegotiationRow['status']){
  if(status==='comprado')return{label:'COMPRA FECHADA',className:'is-success',Icon:CheckCircle2}
  if(status==='nao_fechou')return{label:'NÃO FECHOU',className:'is-failed',Icon:XCircle}
  if(status==='pausada')return{label:'PAUSADA',className:'is-paused',Icon:PauseCircle}
  return{label:'EM NEGOCIAÇÃO',className:'is-live',Icon:Clock3}
}

export function AssistantHistoryList({items,loading,onOpen}:{items:AssistedNegotiationRow[];loading:boolean;onOpen:(id:string)=>void}){
  if(loading&&!items.length)return <div className="assistant-history-empty"><MessageCircle size={22}/><strong>Carregando suas negociações…</strong></div>
  if(!items.length)return <div className="assistant-history-empty"><MessageCircle size={22}/><strong>Nenhuma conversa assistida ainda.</strong><p>As negociações feitas no “Não sabe negociar?” ficam salvas aqui, separadas das análises e dos anúncios.</p></div>

  return <section className="assistant-history">
    <div className="assistant-history__heading"><div><span className="premium-eyebrow text-emerald-400">NÃO SABE NEGOCIAR?</span><h3 className="font-display">Histórico de conversas assistidas</h3><p>Retome negociações abertas e consulte as que já terminaram.</p></div><span>{items.length} {items.length===1?'conversa':'conversas'}</span></div>
    <div className="assistant-history__grid">{items.map(item=>{
      const status=statusMeta(item.status)
      const Icon=status.Icon
      const strategy=(item.estrategia_atual||{}) as any
      const conversation=Array.isArray(item.conversa)?item.conversa as any[]:[]
      const lastRadar=[...conversation].reverse().find(entry=>entry?.role==='radar'&&entry?.text)
      const shownValue=item.status==='comprado'&&item.preco_final!=null?item.preco_final:Number(strategy?.oferta_sugerida||0)
      return <article key={item.id} className={'assistant-history-card '+status.className}>
        <div className="assistant-history-card__top"><span className={'assistant-history-card__status '+status.className}><Icon size={13}/>{status.label}</span><small>{dateBR(item.data_atualizacao)}</small></div>
        <h4>{item.produto||'Produto em negociação'}</h4>
        <p>{item.resumo_produto||item.categoria||'Conversa conduzida com o Radar.'}</p>
        <div className="assistant-history-card__metrics">
          <div><span>Preço pedido</span><strong>{money(item.preco_pedido)}</strong></div>
          <div><span>{item.status==='comprado'?'Preço final':'Oferta atual'}</span><strong>{shownValue>0?money(shownValue):'—'}</strong></div>
          <div><span>Rodadas</span><strong>{item.turn_count}</strong></div>
        </div>
        {lastRadar?.text&&<div className="assistant-history-card__message"><MessageCircle size={14}/><span>{String(lastRadar.text)}</span></div>}
        {strategy?.objetivo_atual&&<div className="assistant-history-card__objective"><Target size={13}/><span>{String(strategy.objetivo_atual)}</span></div>}
        <button type="button" onClick={()=>onOpen(item.id)} className="assistant-history-card__open">{item.status==='ativa'?'Continuar negociação':'Abrir conversa'}<ArrowRight size={15}/></button>
      </article>
    })}</div>
  </section>
}
