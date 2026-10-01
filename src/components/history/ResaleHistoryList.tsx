import { ArrowRight,FilePenLine,Home,Image,PackageCheck,Sparkles,Tag } from 'lucide-react'
import type { ResaleDraftRow } from '../../types/database'
import type { ResaleAd } from '../../types/resale'
import { dateBR,money } from '../../utils/format'

export function ResaleHistoryList({items,onOpen,compact=false}:{items:ResaleDraftRow[];onOpen:(item:ResaleDraftRow)=>void;compact?:boolean}){
  if(!items.length)return <div className="history-ai-empty"><Sparkles size={21}/><strong>Nenhum anúncio com IA ainda.</strong><p>Quando você usar o Preparar venda com IA, o anúncio e o diagnóstico das fotos ficarão registrados aqui.</p></div>

  return <section className={'history-ai '+(compact?'is-compact':'')}>
    {!compact&&<div className="history-ai__heading"><div><span className="premium-eyebrow text-cyan-400">ANÚNCIOS COM IA</span><h3 className="font-display">Histórico de preparação de venda</h3><p>Diagnósticos de fotos, preços sugeridos e anúncios que você já preparou.</p></div><span>{items.length} {items.length===1?'registro':'registros'}</span></div>}
    <div className="history-ai__grid">{items.map(item=>{
      const ad=item.resultado_ia as unknown as ResaleAd|null
      const score=Number(ad?.foto_auditoria?.nota_geral)
      const hasScore=Number.isFinite(score)
      return <article key={item.id} className="history-ai-card">
        <div className="history-ai-card__top">
          <span className={item.origem_item==='radar'?'is-radar':'is-home'}>{item.origem_item==='radar'?<PackageCheck size={13}/>:<Home size={13}/>} {item.origem_item==='radar'?'ITEM DO RADAR':'ITEM POR FORA'}</span>
          <b>IA · {item.status==='pronto'?'PRONTO':'RASCUNHO'}</b>
        </div>
        <h4>{item.produto}</h4>
        <p>{item.titulo||'Anúncio preparado com IA'}</p>

        <div className="history-ai-card__metrics">
          <div><Image size={13}/><span>Fotos</span><strong>{hasScore?Math.round(score)+'/100':'—'}</strong></div>
          <div><Tag size={13}/><span>Preço</span><strong>{item.preco_equilibrado!=null?money(item.preco_equilibrado):'—'}</strong></div>
        </div>

        <div className="history-ai-card__footer">
          <span>Atualizado {dateBR(item.data_atualizacao)}</span>
          <button onClick={()=>onOpen(item)}><FilePenLine size={14}/> Abrir anúncio <ArrowRight size={13}/></button>
        </div>
      </article>
    })}</div>
  </section>
}
