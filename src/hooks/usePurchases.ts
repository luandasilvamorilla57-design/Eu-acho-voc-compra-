import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { InventoryStatus,PurchaseOrigin,PurchaseRow } from '../types/database'
import { purchaseTotalCost } from '../utils/purchase'

export type PurchaseCosts={transport?:number;repair?:number;cleaning?:number;fees?:number;other?:number;notes?:string}
export type NewPurchaseInput={
  analysisId?:string|null
  origin:PurchaseOrigin
  product:string
  category?:string|null
  buyPrice:number
  costs?:PurchaseCosts
  minSalePrice?:number|null
  notes?:string|null
}

export type PurchaseUpdateInput={
  custo_transporte?:number
  custo_reparo?:number
  custo_limpeza?:number
  custo_taxas?:number
  outros_custos?:number
  custos_observacao?:string|null
  preco_minimo_venda?:number|null
  observacoes?:string|null
  situacao_estoque?:InventoryStatus
  data_reserva?:string|null
}

export function usePurchases(active:boolean){
  const [items,setItems]=useState<PurchaseRow[]>([])
  const [loading,setLoading]=useState(false)

  const load=useCallback(async()=>{
    if(!active)return
    setLoading(true)
    const {data}=await supabase.from('compras').select('*').order('data_compra',{ascending:false})
    setItems(data??[])
    setLoading(false)
  },[active])

  useEffect(()=>{load()},[load])

  const createPurchase=async(input:NewPurchaseInput)=>{
    const c=input.costs??{}
    const {error}=await supabase.from('compras').insert({
      analise_id:input.analysisId??null,
      origem_compra:input.origin,
      produto:input.product.trim(),
      categoria:input.category?.trim()||null,
      preco_compra:input.buyPrice,
      custo_transporte:c.transport??0,
      custo_reparo:c.repair??0,
      custo_limpeza:c.cleaning??0,
      custo_taxas:c.fees??0,
      outros_custos:c.other??0,
      custos_observacao:c.notes?.trim()||null,
      preco_minimo_venda:input.minSalePrice??null,
      observacoes:input.notes?.trim()||null,
      situacao_estoque:'em_estoque',
      status:'comprado'
    })
    if(error)throw error
    await load()
  }

  const markSold=async(id:string,salePrice:number)=>{
    const item=items.find(x=>x.id===id)
    if(!item)throw new Error('Compra não encontrada.')
    const loss=salePrice<purchaseTotalCost(item)
    const {error}=await supabase.from('compras').update({
      preco_venda:salePrice,
      status:'vendido',
      situacao_estoque:loss?'prejuizo':'vendido',
      data_venda:new Date().toISOString()
    }).eq('id',id)
    if(error)throw error
    await load()
  }

  const updatePurchase=async(id:string,patch:PurchaseUpdateInput)=>{
    const finalPatch={...patch}
    if(patch.situacao_estoque==='reservado'&&!patch.data_reserva)finalPatch.data_reserva=new Date().toISOString()
    if(patch.situacao_estoque==='em_estoque')finalPatch.data_reserva=null
    const {error}=await supabase.from('compras').update(finalPatch).eq('id',id)
    if(error)throw error
    await load()
  }

  return{items,loading,load,createPurchase,markSold,updatePurchase}
}
