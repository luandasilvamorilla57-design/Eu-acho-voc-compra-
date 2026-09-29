import { useState } from 'react'
import { BadgeDollarSign,X } from 'lucide-react'
import type { PurchaseRow } from '../../types/database'
import { money } from '../../utils/format'

export function SellModal({item,onClose,onSold}:{item:PurchaseRow;onClose:()=>void;onSold:(id:string,salePrice:number)=>Promise<void>}){
  const [price,setPrice]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const sale=Number(price.replace(',','.'))
  const preview=sale>0?sale-item.preco_compra:null

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!sale||sale<=0){setError('Informe por quanto você vendeu.');return}
    setBusy(true);setError('')
    try{
      await onSold(item.id,sale)
      onClose()
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível registrar a venda.')
    }finally{setBusy(false)}
  }

  return <div className="purchase-modal">
    <button className="purchase-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <form onSubmit={submit} className="purchase-modal__card purchase-sale-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[.2em] text-emerald-400">VENDA REALIZADA</span>
          <h3 className="font-display mt-1 text-xl font-extrabold purchase-title">Por quanto vendeu?</h3>
          <p className="mt-2 text-xs text-slate-500">{item.produto}</p>
        </div>
        <button type="button" onClick={onClose} className="purchase-close"><X size={17}/></button>
      </div>

      <div className="mt-5 rounded-2xl purchase-sale-summary">
        <span>Você pagou</span><strong>{money(item.preco_compra)}</strong>
      </div>

      <label className="mt-4 block text-xs font-semibold text-slate-500">Valor da venda<div className="purchase-money-input"><span>R$</span><input autoFocus inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value.replace(',','.'))} placeholder="0,00"/></div></label>

      {preview!==null&&<div className={`mt-4 rounded-2xl p-4 ${preview>=0?'bg-emerald-400/[.06] text-emerald-400':'bg-red-400/[.06] text-red-400'}`}>
        <span className="block text-[9px] font-bold uppercase tracking-[.16em]">RESULTADO</span>
        <strong className="font-display mt-1 block text-xl">{preview>=0?'+':''}{money(preview)}</strong>
        <small className="mt-1 block opacity-70">{preview>=0?'lucro estimado desta venda':'prejuízo desta venda'}</small>
      </div>}

      {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}

      <button disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950 disabled:opacity-50">
        <BadgeDollarSign size={17}/>{busy?'Registrando...':'Confirmar venda'}
      </button>
    </form>
  </div>
}
