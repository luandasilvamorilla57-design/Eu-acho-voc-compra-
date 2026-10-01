import { useMemo,useState } from 'react'
import { BadgeDollarSign,CheckCircle2,PackageCheck,Sparkles,X } from 'lucide-react'
import type { ResaleDraftRow } from '../../types/database'
import { money } from '../../utils/format'

export function ResaleSoldModal({item,onClose,onConfirm}:{item:ResaleDraftRow;onClose:()=>void;onConfirm:(price:number)=>Promise<void>}){
  const suggested=Number(item.preco_equilibrado||item.preco_venda_rapida||0)
  const [price,setPrice]=useState(suggested?String(suggested):'')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const value=useMemo(()=>Number(String(price).replace(',','.'))||0,[price])

  const submit=async()=>{
    if(value<=0){setError('Informe o valor real da venda.');return}
    setBusy(true);setError('')
    try{await onConfirm(value);onClose()}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar a venda.')}
    finally{setBusy(false)}
  }

  return <div className="resale-outcome-modal">
    <button className="resale-outcome-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <section className="resale-outcome-modal__card">
      <button className="resale-outcome-modal__close" onClick={onClose}><X size={17}/></button>
      <span className="resale-outcome-modal__icon"><BadgeDollarSign size={23}/></span>
      <span className="premium-eyebrow text-emerald-400">VENDA REALIZADA</span>
      <h3 className="font-display">Por quanto você vendeu?</h3>
      <p>Esse valor passa a fazer parte do resultado real do BRIKE RADAR.</p>

      <div className="resale-outcome-modal__product"><Sparkles size={14}/><div><strong>{item.produto}</strong><small>{item.compra_id?'Ligado a uma compra registrada':'Item por fora'}</small></div></div>

      <label><span>Valor final da venda</span><div className="resale-outcome-modal__input"><b>R$</b><input autoFocus inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value.replace(',','.'))} placeholder="0,00"/></div></label>

      {value>0&&<div className="resale-outcome-modal__preview">
        <CheckCircle2 size={16}/>
        <div><span>Entrada no caixa</span><strong>{money(value)}</strong><small>{item.compra_id?'A compra será marcada como vendida e o lucro será calculado pelo custo real.':'Como não há custo de compra registrado, o valor entra no caixa, mas não é tratado como lucro.'}</small></div>
      </div>}

      {item.compra_id&&<div className="resale-outcome-modal__sync"><PackageCheck size={14}/> Compra, estoque e histórico serão atualizados juntos.</div>}
      {error&&<div className="resale-outcome-modal__error">{error}</div>}

      <button className="resale-outcome-modal__confirm" onClick={submit} disabled={busy||value<=0}>{busy?'Registrando venda...':'Confirmar venda e atualizar caixa'}</button>
    </section>
  </div>
}
