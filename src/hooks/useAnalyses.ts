import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnaliseRow,Status } from '../types/database'
export function useAnalyses(active:boolean){
 const [items,setItems]=useState<AnaliseRow[]>([]); const [loading,setLoading]=useState(false)
 const load=useCallback(async()=>{if(!active)return;setLoading(true);const {data}=await supabase.from('analises').select('*').order('data_criacao',{ascending:false});setItems(data??[]);setLoading(false)},[active])
 useEffect(()=>{load()},[load])
 const updateStatus=async(id:string,status:Status,preco_compra_real?:number|null,preco_venda_real?:number|null)=>{const {error}=await supabase.from('analises').update({status,preco_compra_real:preco_compra_real??null,preco_venda_real:preco_venda_real??null}).eq('id',id);if(!error)await load();return error}
 return {items,loading,load,updateStatus}
}
