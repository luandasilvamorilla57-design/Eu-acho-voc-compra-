import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnaliseRow,PipelineStatus,Status } from '../types/database'
import type { AnalysisResult } from '../types/analysis'
import { reportClientError } from '../lib/errorReporter'

async function readFunctionError(error:any){
  try{const response=error?.context;if(response instanceof Response){const body=await response.clone().json();return body?.details||body?.error||error?.message}}catch{}
  return error?.message||'Não foi possível concluir.'
}

export function useAnalyses(active:boolean){
 const [items,setItems]=useState<AnaliseRow[]>([])
 const [loading,setLoading]=useState(false)

 const load=useCallback(async()=>{if(!active)return;setLoading(true);const {data,error}=await supabase.from('analises').select('*').order('data_criacao',{ascending:false});if(error)reportClientError(error,'analyses.load');setItems(data??[]);setLoading(false)},[active])
 useEffect(()=>{load()},[load])

 const updateStatus=async(id:string,status:Status,preco_compra_real?:number|null,preco_venda_real?:number|null)=>{
   const {data:analysis,error}=await supabase.from('analises').update({status,preco_compra_real:preco_compra_real??null,preco_venda_real:preco_venda_real??null}).eq('id',id).select('id,titulo_anuncio,categoria').single()
   if(error)return error
   if(analysis&&['comprei','vendi'].includes(status)&&preco_compra_real&&preco_compra_real>0){
     const {error:purchaseError}=await supabase.from('compras').upsert({analise_id:analysis.id,origem_compra:'analise',produto:analysis.titulo_anuncio,categoria:analysis.categoria,preco_compra:preco_compra_real,preco_venda:status==='vendi'?(preco_venda_real??null):null,status:status==='vendi'?'vendido':'comprado',situacao_estoque:status==='vendi'?'vendido':'em_estoque',data_venda:status==='vendi'?new Date().toISOString():null},{onConflict:'analise_id'})
     if(purchaseError)return purchaseError
   }
   await load();return null
 }

 const setPipeline=async(id:string,pipeline_status:PipelineStatus)=>{const {error}=await supabase.from('analises').update({pipeline_status}).eq('id',id);if(!error)await load();return error}

 const resolveNegotiation=async(id:string,outcome:'bought'|'failed',buyPrice?:number)=>{
   const analysis=items.find(i=>i.id===id);if(!analysis)throw new Error('Análise não encontrada.')
   if(outcome==='failed'){const {error}=await supabase.from('analises').update({pipeline_status:'negociacao_falhou'}).eq('id',id);if(error)throw error;await load();return}
   if(!buyPrice||buyPrice<=0)throw new Error('Informe o valor pago.')
   const {error}=await supabase.from('compras').upsert({analise_id:analysis.id,origem_compra:'analise',produto:analysis.titulo_anuncio,categoria:analysis.categoria,preco_compra:buyPrice,status:'comprado',situacao_estoque:'em_estoque'},{onConflict:'analise_id'})
   if(error)throw error
   await load()
 }

 const addNegotiationLog=async(id:string,offer:number|null,counter:number|null,response:string,note:string)=>{
   const item=items.find(i=>i.id===id);if(!item)throw new Error('Análise não encontrada.')
   const history=Array.isArray(item.historico_negociacao)?item.historico_negociacao:[]
   const entry={data:new Date().toISOString(),oferta:offer,contraproposta:counter,resposta:response.trim(),nota:note.trim()}
   const {error}=await supabase.from('analises').update({historico_negociacao:[...history,entry] as any}).eq('id',id)
   if(error)throw error
   await load()
 }

 const reinspect=async(id:string,notes:string,images:{mime_type:string;data:string;name:string}[])=>{
   const item=items.find(i=>i.id===id);if(!item)throw new Error('Análise não encontrada.')
   const {data,error}=await supabase.functions.invoke('analisar-anuncio',{body:{modo:'inspecao',origem:item.origem,link:item.link_anuncio||'',texto:item.texto_anuncio||'',preco:item.preco_anunciado,imagens:images,inspecao_notas:notes,contexto_anterior:item.analise_ia,referencias_mercado:Array.isArray(item.referencias_usuario)?item.referencias_usuario:[]}})
   if(error){reportClientError(error,'analysis.reinspect',{analysisId:id});throw new Error(await readFunctionError(error))}
   if(data?.error)throw new Error(data.error)
   const a=data.analysis as AnalysisResult
   const {error:updateError}=await supabase.from('analises').update({analise_ia:a as any,margem_lucro_potencial:a.calculado.margem_percentual,oferta_recomendada:a.precos.oferta_equilibrada,teto_compra_reavaliado:a.precos.teto_compra,inspecao_notas:notes,inspecao_data:new Date().toISOString(),status:'visitei'}).eq('id',id)
   if(updateError)throw updateError
   await load()
 }

 return {items,loading,load,updateStatus,setPipeline,resolveNegotiation,addNegotiationLog,reinspect}
}
