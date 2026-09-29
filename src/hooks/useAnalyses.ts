import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnaliseRow,PipelineStatus,Status } from '../types/database'

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
   const {data:analysis,error}=await supabase.from('analises').update({status,preco_compra_real:preco_compra_real??null,preco_venda_real:preco_venda_real??null}).eq('id',id).select('id,titulo_anuncio,categoria').single()
   if(error)return error
   if(analysis&&['comprei','vendi'].includes(status)&&preco_compra_real&&preco_compra_real>0){
     const {error:purchaseError}=await supabase.from('compras').upsert({
       analise_id:analysis.id,origem_compra:'analise',produto:analysis.titulo_anuncio,categoria:analysis.categoria,preco_compra:preco_compra_real,
       preco_venda:status==='vendi'?(preco_venda_real??null):null,status:status==='vendi'?'vendido':'comprado',data_venda:status==='vendi'?new Date().toISOString():null
     },{onConflict:'analise_id'})
     if(purchaseError)return purchaseError
   }
   await load();return null
 }

 const setPipeline=async(id:string,pipeline_status:PipelineStatus)=>{
   const {error}=await supabase.from('analises').update({pipeline_status}).eq('id',id)
   if(!error)await load()
   return error
 }

 const resolveNegotiation=async(id:string,outcome:'bought'|'failed',buyPrice?:number)=>{
   const analysis=items.find(i=>i.id===id)
   if(!analysis)throw new Error('Análise não encontrada.')

   if(outcome==='failed'){
     const {error}=await supabase.from('analises').update({pipeline_status:'negociacao_falhou'}).eq('id',id)
     if(error)throw error
     await load()
     return
   }

   if(!buyPrice||buyPrice<=0)throw new Error('Informe o valor pago.')
   const {error}=await supabase.from('compras').upsert({
     analise_id:analysis.id,
     origem_compra:'analise',
     produto:analysis.titulo_anuncio,
     categoria:analysis.categoria,
     preco_compra:buyPrice,
     status:'comprado'
   },{onConflict:'analise_id'})
   if(error)throw error
   await load()
 }

 return {items,loading,load,updateStatus,setPipeline,resolveNegotiation}
}
