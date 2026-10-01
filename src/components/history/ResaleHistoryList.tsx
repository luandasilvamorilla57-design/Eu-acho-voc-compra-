import { useState } from 'react'
import { ArrowRight,BadgeCheck,FilePenLine,Home,Image,PackageCheck,Sparkles,Tag,XCircle } from 'lucide-react'
import type { ResaleDraftRow } from '../../types/database'
import type { ResaleAd } from '../../types/resale'
import { dateBR,money } from '../../utils/format'
import { ResaleSoldModal } from './ResaleSoldModal'

export function ResaleHistoryList({items,onOpen,onSold,onNotSold,compact=false}:{items:ResaleDraftRow[];onOpen:(item:ResaleDraftRow)=>void;onSold:(item:ResaleDraftRow,price:number)=>Promise<void>;onNotSold:(item:ResaleDraftRow)=>Promise<void>;compact?:boolean}){
  const [selling,setSelling]=useState<ResaleDraftRow|null>(null)
  const [busyId,setBusyId]=useState('')
  const [error,setError]=useState('')

  if(!items.length)return <div className="history-ai-empty"><Sparkles size={21}/><strong>Nenhum anúncio com IA ainda.</strong><p>Quando você usar o Preparar venda com IA, o anúncio e o diagnóstico das fotos ficarão registrados aqui.</p></div>

  const markNotSold=async(item:ResaleDraftRow)=>{
    if(!confirm('Marcar este anúncio como NÃO VENDIDO? O registro continuará no histórico e poderá ser consultado depois.'))return
    setBusyId(item.id);setError('')
    try{await onNotSold(item)}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível atualizar o resultado.')}
    finally{setBusyId('')}
  }

  return <section className={'history-ai '+(compact?'is-compact':'')}>
    {!compact&&<div className="history-ai__heading"><div><span className="premium-eyebrow text-cyan-400">ANÚNCIOS COM IA</span><h3 className="font-display">Histórico de preparação de venda</h3><p>Além do anúncio, registre o resultado real para o Radar entender o que realmente vende.</p></div><span>{items.length} {items.length===1?'registro':'registros'}</span></div>}
    {error&&<div className="history-ai__error">{error}</div>}
    <div className="history-ai__grid">{items.map(item=>{
      const ad=item.resultado_ia as unknown as ResaleAd|null
      const score=Number(ad?.foto_auditoria?.nota_geral)
      const hasScore=Number.isFinite(score)
      const sold=item.resultado_venda==='vendido'
      const notSold=item.resultado_venda==='nao_vendido'
      return <article key={item.id} className={'history-ai-card '+(sold?'is-sold':notSold?'is-not-sold':'')}>
        <div className="history-ai-card__top">
          <span className={item.origem_item==='radar'?'is-radar':'is-home'}>{item.origem_item==='radar'?<PackageCheck size={13}/>:<Home size={13}/>} {item.origem_item==='radar'?'ITEM DO RADAR':'ITEM POR FORA'}</span>
          {sold?<b className="is-sold"><BadgeCheck size={12}/> VENDIDO</b>:notSold?<b className="is-not-sold"><XCircle size={12}/> NÃO VENDEU</b>:<b>IA · {item.status==='pronto'?'PRONTO':'RASCUNHO'}</b>}
        </div>
        <h4>{item.produto}</h4>
        <p>{item.titulo||'Anúncio preparado com IA'}</p>

        <div className="history-ai-card__metrics">
          <div><Image size={13}/><span>Fotos</span><strong>{hasScore?Math.round(score)+'/100':'—'}</strong></div>
          <div><Tag size={13}/><span>{sold?'Venda real':'Preço sugerido'}</span><strong>{sold&&item.preco_venda_real!=null?money(item.preco_venda_real):item.preco_equilibrado!=null?money(item.preco_equilibrado):'—'}</strong></div>
        </div>

        {item.resultado_venda==='pendente'&&<div className="history-ai-card__outcome">
          <span>Esse anúncio vendeu?</span>
          <div>
            <button className="is-no" disabled={busyId===item.id} onClick={()=>markNotSold(item)}><XCircle size={15}/> Não vendeu</button>
            <button className="is-yes" onClick={()=>setSelling(item)}><BadgeCheck size={15}/> Vendeu</button>
          </div>
        </div>}

        {sold&&<div className="history-ai-card__sold-note"><BadgeCheck size={14}/><div><strong>{money(item.preco_venda_real||0)} entrou no resultado real</strong><small>{item.compra_id?'Compra e estoque sincronizados automaticamente.':'Valor contabilizado como entrada de caixa de item por fora.'}</small></div></div>}

        {notSold&&<div className="history-ai-card__not-sold-note"><XCircle size={14}/><div><strong>Não convertido em venda</strong><small>Esse resultado permanece salvo para melhorar a leitura do histórico.</small></div></div>}

        <div className="history-ai-card__footer">
          <span>{sold&&item.data_venda?'Vendido '+dateBR(item.data_venda):'Atualizado '+dateBR(item.data_atualizacao)}</span>
          <button onClick={()=>onOpen(item)}><FilePenLine size={14}/> Abrir anúncio <ArrowRight size={13}/></button>
        </div>
      </article>
    })}</div>

    {selling&&<ResaleSoldModal item={selling} onClose={()=>setSelling(null)} onConfirm={price=>onSold(selling,price)}/>}
  </section>
}
