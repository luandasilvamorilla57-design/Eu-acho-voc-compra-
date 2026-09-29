import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnalysisResult } from '../types/analysis'

async function readFunctionError(error:any){
  try{
    const response=error?.context
    if(response instanceof Response){
      const body=await response.clone().json()
      return body?.details||body?.error||error?.message
    }
  }catch{}
  return error?.message||'Não foi possível analisar.'
}

export function useNewAnalysis(onSaved:()=>void){
  const [link,setLink]=useState('')
  const [texto,setTexto]=useState('')
  const [preco,setPreco]=useState('')
  const [busy,setBusy]=useState(false)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [result,setResult]=useState<AnalysisResult|null>(null)

  const analyze=async()=>{
    setError('')
    setResult(null)

    if(!link.trim()&&!texto.trim()){
      setError('Cole o link ou o texto do anúncio.')
      return
    }

    setBusy(true)
    const {data,error:e}=await supabase.functions.invoke('analisar-anuncio',{
      body:{link,texto,preco:Number(preco||0)}
    })
    setBusy(false)

    if(e){
      setError(await readFunctionError(e))
      return
    }

    if(data?.error){
      setError(data?.details||data.error)
      return
    }

    setResult(data.analysis as AnalysisResult)
  }

  const save=async()=>{
    if(!result)return
    setSaving(true)
    const {error:e}=await supabase.from('analises').insert({
      titulo_anuncio:result.produto,
      preco_anunciado:result.precos.preco_anunciado,
      categoria:result.categoria,
      link_anuncio:link||null,
      texto_anuncio:texto,
      analise_ia:result as any,
      margem_lucro_potencial:result.calculado.margem_percentual,
      oferta_recomendada:result.precos.oferta_equilibrada,
      status:'analisado'
    })
    setSaving(false)
    if(e){
      setError(e.message)
      return
    }
    onSaved()
  }

  return{link,texto,preco,busy,saving,error,result,setLink,setTexto,setPreco,analyze,save}
}
