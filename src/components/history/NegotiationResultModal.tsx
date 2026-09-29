import { useState } from 'react'
import { CheckCircle2,Handshake,X,XCircle } from 'lucide-react'
import type { AnaliseRow } from '../../types/database'
import { money } from '../../utils/format'

export function NegotiationResultModal({
  item,onClose,onBought,onFailed
}:{
  item:AnaliseRow
  onClose:()=>void
  onBought:(id:string,price:number)=>Promise<void>
  onFailed:(id:string)=>Promise<void>
}){
  const [mode,setMode]=useState<'choose'|'bought'|'failed'>('choose')
  const [price,setPrice]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const finishBought=async()=>{
    const value=Number(price.replace(',','.'))
    if(!value||value<=0){setError('Informe quanto você realmente pagou.');return}
    setBusy(true);setError('')
    try{await onBought(item.id,value);onClose()}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.')}finally{setBusy(false)}
  }

  const finishFailed=async()=>{
    setBusy(true);setError('')
    try{await onFailed(item.id);onClose()}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.')}finally{setBusy(false)}
  }

  return <div className="pipeline-modal">
    <button className="pipeline-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <div className="pipeline-modal__card">
      <div className="flex items-start justify-between gap-4">
        <div><span className="text-[9px] font-bold tracking-[.18em] text-emerald-400">RESULTADO DA NEGOCIAÇÃO</span><h3 className="font-display mt-1 text-xl font-extrabold pipeline-title">{item.titulo_anuncio}</h3></div>
        <button onClick={onClose} className="pipeline-close"><X size={16}/></button>
      </div>

      {mode==='choose'&&<>
        <p className="mt-4 text-xs leading-5 text-slate-500">Como terminou a conversa com o vendedor?</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={()=>setMode('bought')} className="pipeline-choice is-good"><CheckCircle2 size={20}/><strong>Deu certo</strong><small>Eu comprei</small></button>
          <button onClick={()=>setMode('failed')} className="pipeline-choice is-bad"><XCircle size={20}/><strong>Não fechou</strong><small>Não comprei</small></button>
        </div>
      </>}

      {mode==='bought'&&<>
        <button onClick={()=>setMode('choose')} className="mt-4 text-[10px] text-slate-500">← Voltar</button>
        <div className="mt-3 pipeline-info"><span>Preço pedido</span><strong>{money(item.preco_anunciado)}</strong><span>Oferta recomendada</span><strong>{money(item.oferta_recomendada)}</strong></div>
        <label className="mt-4 block text-xs font-semibold text-slate-500">Quanto você realmente pagou?<div className="pipeline-money"><span>R$</span><input autoFocus inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value.replace(',','.'))} placeholder="0,00"/></div></label>
        <p className="mt-3 text-[10px] leading-5 text-slate-600">Ao confirmar, o item entra automaticamente em <b>Comprei</b> como estoque aguardando venda.</p>
        <button disabled={busy} onClick={finishBought} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950"><CheckCircle2 size={16}/>{busy?'Salvando...':'Confirmar compra'}</button>
      </>}

      {mode==='failed'&&<>
        <button onClick={()=>setMode('choose')} className="mt-4 text-[10px] text-slate-500">← Voltar</button>
        <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/[.05] p-4"><strong className="text-sm text-red-300">Encerrar como não fechada?</strong><p className="mt-2 text-[10px] leading-5 text-slate-500">O anúncio continua no histórico, mas sai da fila de negociações ativas.</p></div>
        <button disabled={busy} onClick={finishFailed} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500/90 font-bold text-white"><XCircle size={16}/>{busy?'Encerrando...':'Não comprei'}</button>
      </>}

      {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}
    </div>
  </div>
}
