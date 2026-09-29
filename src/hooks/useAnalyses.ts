import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnaliseRow,Status } from '../types/database'

export function useAnalyses(active:boolean){
 const [items,setItems]=useState<AnaliseRow[]>([])
 const [loading,setLoading]=useState(false)

 const load=useCallback(async()=>{
   if(!active)return
   setLoading(true)
   const {data}=await supabase.from('analises').select('*').order('data_criacao',{ascending:false})
   setItems(data??[])
   setLoading(false)
 },[active])

 useEffect(()=>{load()},[load])

 const updateStatus=async(id:string,status:Status,preco_compra_real?:number|null,preco_venda_real?:number|null)=>{
   const {data:analysis,error}=await supabase.from('analises')
     .update({
       status,
       preco_compra_real:preco_compra_real??null,
       preco_venda_real:preco_venda_real??null
     })
     .eq('id',id)
     .select('id,titulo_anuncio,categoria')
     .single()

   if(error)return error

   if(analysis&&['comprei','vendi'].includes(status)&&preco_compra_real&&preco_compra_real>0){
     const {error:purchaseError}=await supabase.from('compras').upsert({
       analise_id:analysis.id,
       origem_compra:'analise',
       produto:analysis.titulo_anuncio,
       categoria:analysis.categoria,
       preco_compra:preco_compra_real,
       preco_venda:status==='vendi'?(preco_venda_real??null):null,
       status:status==='vendi'?'vendido':'comprado',
       data_venda:status==='vendi'?new Date().toISOString():null
     },{onConflict:'analise_id'})
     if(purchaseError)return purchaseError
   }

   await load()
   return null
 }

 return {items,loading,load,updateStatus}
}
