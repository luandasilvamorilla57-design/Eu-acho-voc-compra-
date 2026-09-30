import { useState } from 'react'
import { MessageSquarePlus,X } from 'lucide-react'
import type { AnaliseRow } from '../../types/database'

export function NegotiationLogModal({item,onClose,onSave}:{item:AnaliseRow;onClose:()=>void;onSave:(id:string,offer:number|null,response:string,note:string)=>Promise<void>}){
  const [offer,setOffer]=useState('')
  const [response,setResponse]=useState('')
  const [note,setNote]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const save=async()=>{
    if(!offer&&!response.trim()&&!note.trim()){setError('Registre pelo menos uma informação da negociação.');return}
    setBusy(true);setError('')
    try{await onSave(item.id,offer?Number(offer.replace(',','.')):null,response,note);onClose()}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar.')}
    finally{setBusy(false)}
  }

  return <div className="pipeline-modal"><button className="pipeline-modal__backdrop" onClick={onClose} aria-label="Fechar"/><div className="pipeline-modal__card">
    <div className="flex items-start justify-between"><div><span className="text-[9px] font-bold tracking-[.18em] text-emerald-400">HISTÓRICO DA NEGOCIAÇÃO</span><h3 className="font-display mt-1 text-xl font-bold pipeline-title">Registrar conversa</h3><p className="mt-1 text-[10px] text-slate-500">{item.titulo_anuncio}</p></div><button onClick={onClose} className="pipeline-close"><X size={16}/></button></div>
    <label className="mt-5 block text-xs text-slate-500">Sua oferta<div className="pipeline-money"><span>R$</span><input inputMode="decimal" value={offer} onChange={e=>setOffer(e.target.value.replace(',','.'))} placeholder="0,00"/></div></label>
    <label className="mt-4 block text-xs text-slate-500">Resposta do vendedor<input className="purchase-input" value={response} onChange={e=>setResponse(e.target.value)} placeholder="Ex.: fez contraproposta de R$ 950"/></label>
    <label className="mt-4 block text-xs text-slate-500">Observação<textarea className="purchase-inspection-text" value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex.: vai responder amanhã, aceitou testar na hora..."/></label>
    {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}
    <button onClick={save} disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950"><MessageSquarePlus size={16}/>{busy?'Salvando...':'Salvar no histórico'}</button>
  </div></div>
}
