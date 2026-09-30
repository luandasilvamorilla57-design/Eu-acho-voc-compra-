import type { PurchaseRow } from '../types/database'

export const purchaseExtraCosts=(p:Pick<PurchaseRow,'custo_transporte'|'custo_reparo'|'custo_limpeza'|'custo_taxas'|'outros_custos'>)=>
  (p.custo_transporte??0)+(p.custo_reparo??0)+(p.custo_limpeza??0)+(p.custo_taxas??0)+(p.outros_custos??0)

export const purchaseTotalCost=(p:PurchaseRow)=>p.preco_compra+purchaseExtraCosts(p)

export const daysSince=(iso:string)=>{
  const diff=Date.now()-new Date(iso).getTime()
  return Math.max(0,Math.floor(diff/86400000))
}
