import type { PurchaseRow } from '../types/database'

export const purchaseExtraCosts=(p:Pick<PurchaseRow,'custo_transporte'|'custo_reparo'|'custo_limpeza'|'custo_taxas'|'outros_custos'>)=>
  (p.custo_transporte??0)+(p.custo_reparo??0)+(p.custo_limpeza??0)+(p.custo_taxas??0)+(p.outros_custos??0)

export const purchaseTotalCost=(p:PurchaseRow)=>p.preco_compra+purchaseExtraCosts(p)

export const daysBetween=(start:string,end:string)=>{
  const diff=new Date(end).getTime()-new Date(start).getTime()
  return Math.max(0,Math.floor(diff/86400000))
}

export const daysSince=(iso:string)=>daysBetween(iso,new Date().toISOString())

export const purchasePhotoPaths=(p:PurchaseRow):string[]=>Array.isArray(p.fotos)?p.fotos.filter((x):x is string=>typeof x==='string'):[]
