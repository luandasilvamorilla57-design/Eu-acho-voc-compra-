import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PurchaseOrigin,PurchaseRow } from '../types/database'

export type NewPurchaseInput={
  analysisId?:string|null
  origin:PurchaseOrigin
  product:string
  category?:string|null
  buyPrice:number
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
    const {error}=await supabase.from('compras').insert({
      analise_id:input.analysisId??null,
      origem_compra:input.origin,
      produto:input.product.trim(),
      categoria:input.category?.trim()||null,
      preco_compra:input.buyPrice,
      status:'comprado'
    })
    if(error)throw error
    await load()
  }

  const markSold=async(id:string,salePrice:number)=>{
    const {error}=await supabase.from('compras').update({
      preco_venda:salePrice,
      status:'vendido',
      data_venda:new Date().toISOString()
    }).eq('id',id)
    if(error)throw error
    await load()
  }

  return{items,loading,load,createPurchase,markSold}
}
