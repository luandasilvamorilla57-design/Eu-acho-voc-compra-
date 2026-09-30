import { useState } from 'react'
import { Save,X } from 'lucide-react'
import type { InventoryStatus,PurchaseRow } from '../../types/database'
import type { PurchaseUpdateInput } from '../../hooks/usePurchases'
import { money } from '../../utils/format'
import { purchaseTotalCost } from '../../utils/purchase'
import { PurchaseCostFields,costDraftToNumbers,type CostDraft } from './PurchaseCostFields'

export function PurchaseManageModal({item,onClose,onSave}:{item:PurchaseRow;onClose:()=>void;onSave:(id:string,patch:PurchaseUpdateInput)=>Promise<void>}){
  const [status,setStatus]=useState<InventoryStatus>(item.situacao_estoque)
  const [minSale,setMinSale]=useState(String(item.preco_minimo_venda??''))
  const [notes,setNotes]=useState(item.observacoes??'')
  const [costs,setCosts]=useState<CostDraft>({
    transport:String(item.custo_transporte||''),repair:String(item.custo_reparo||''),cleaning:String(item.custo_limpeza||''),fees:String(item.custo_taxas||''),other:String(item.outros_custos||''),notes:item.custos_observacao??''
  })
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setError('')
    const c=costDraftToNumbers(costs)
    try{
      await onSave(item.id,{
        custo_transporte:c.transport,custo_reparo:c.repair,custo_limpeza:c.cleaning,custo_taxas:c.fees,outros_custos:c.other,custos_observacao:c.notes||null,
        preco_minimo_venda:Number(minSale||0)||null,observacoes:notes||null,situacao_estoque:status
      })
      onClose()
    }catch(err){setError(err instanceof Error?err.message:'Não foi possível atualizar.')}
    finally{setBusy(false)}
  }

  return <div className="purchase-modal"><button className="purchase-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <form onSubmit={submit} className="purchase-modal__card">
      <div className="flex items-start justify-between"><div><span className="text-[9px] font-bold tracking-[.18em] text-emerald-400">GERENCIAR ITEM</span><h3 className="font-display mt-1 text-xl font-bold purchase-title">{item.produto}</h3><p className="mt-1 text-[10px] text-slate-500">Compra: {money(item.preco_compra)} · custo atual: {money(purchaseTotalCost(item))}</p></div><button type="button" onClick={onClose} className="purchase-close"><X size={16}/></button></div>

      <div className="mt-5"><PurchaseCostFields value={costs} onChange={setCosts}/></div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="text-[10px] text-slate-500">Situação<select className="purchase-input" value={status} onChange={e=>setStatus(e.target.value as InventoryStatus)}><option value="em_estoque">Em estoque</option><option value="reservado">Reservado</option>{item.status==='vendido'&&<><option value="vendido">Vendido</option><option value="prejuizo">Prejuízo</option></>}</select></label>
        <label className="text-[10px] text-slate-500">Preço mínimo de venda<div className="purchase-money-input"><span>R$</span><input inputMode="decimal" value={minSale} onChange={e=>setMinSale(e.target.value.replace(',','.'))}/></div></label>
      </div>
      <label className="mt-4 block text-[10px] text-slate-500">Observações<input className="purchase-input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Defeitos, acessórios, comprador interessado..."/></label>
      {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}
      <button disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950"><Save size={15}/>{busy?'Salvando...':'Salvar alterações'}</button>
    </form>
  </div>
}
