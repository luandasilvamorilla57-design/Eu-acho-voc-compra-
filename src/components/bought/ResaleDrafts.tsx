import { ArrowRight,FilePenLine,Home,PackageCheck,Trash2 } from 'lucide-react'
import type { ResaleDraftRow } from '../../types/database'
import type { ResaleAd } from '../../types/resale'
import { dateBR,money } from '../../utils/format'

export function ResaleDrafts({items,onOpen,onDelete}:{items:ResaleDraftRow[];onOpen:(item:ResaleDraftRow)=>void;onDelete:(id:string)=>Promise<void>}){
  if(!items.length)return null
  return <section className="resale-drafts">
    <div className="resale-drafts__head"><div><span className="premium-eyebrow text-blue-400">SEUS ANÚNCIOS</span><h3 className="font-display">Rascunhos e anúncios prontos</h3><p>Itens do Radar e desapegos ficam no mesmo lugar, sem misturar com seu estoque.</p></div><span>{items.length} {items.length===1?'anúncio':'anúncios'}</span></div>
    <div className="resale-drafts__grid">{items.slice(0,8).map(item=>{
      const ad=item.resultado_ia as unknown as ResaleAd|null
      const score=ad?.foto_auditoria?.nota_geral
      return <article key={item.id} className="resale-draft-card">
        <div className="resale-draft-card__top"><span className={item.origem_item==='radar'?'is-radar':'is-home'}>{item.origem_item==='radar'?<PackageCheck size={14}/>:<Home size={14}/>} {item.origem_item==='radar'?'Item do Radar':'Item por fora'}</span>{typeof score==='number'&&<b>{Math.round(score)}/100 fotos</b>}</div>
        <h4>{item.produto}</h4>
        <p>{item.titulo||'Anúncio preparado com IA'}</p>
        <div className="resale-draft-card__meta"><span>Atualizado {dateBR(item.data_atualizacao)}</span>{item.preco_equilibrado!=null&&<strong>{money(item.preco_equilibrado)}</strong>}</div>
        <div className="resale-draft-card__actions"><button onClick={()=>onOpen(item)}><FilePenLine size={14}/> Abrir anúncio <ArrowRight size={13}/></button><button aria-label="Excluir anúncio" onClick={()=>{if(confirm('Excluir este rascunho de anúncio?'))onDelete(item.id)}}><Trash2 size={14}/></button></div>
      </article>
    })}</div>
  </section>
}
