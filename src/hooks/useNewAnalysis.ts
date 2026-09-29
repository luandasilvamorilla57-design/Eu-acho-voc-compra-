import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnalysisResult } from '../types/analysis'
import type { PipelineStatus,RadarDecision } from '../types/database'
import type { AdOrigin } from '../components/new-analysis/AnalysisForm'
import { prepareScreenshots, revokePreviews, type PreparedImage, MAX_IMAGES } from '../utils/imageInput'

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

export function useNewAnalysis(onSaved:(destination:'dashboard'|'history')=>void){
  const [origem,setOrigemState]=useState<AdOrigin>('olx')
  const [link,setLink]=useState('')
  const [texto,setTexto]=useState('')
  const [preco,setPreco]=useState('')
  const [images,setImages]=useState<PreparedImage[]>([])
  const [imageBusy,setImageBusy]=useState(false)
  const [busy,setBusy]=useState(false)
  const [saving,setSaving]=useState(false)
  const [decisionBusy,setDecisionBusy]=useState<'negotiate'|'discard'|'save'|null>(null)
  const [error,setError]=useState('')
  const [result,setResult]=useState<AnalysisResult|null>(null)

  useEffect(()=>()=>revokePreviews(images),[])

  const setOrigem=(next:AdOrigin)=>{
    setError('')
    setResult(null)
    setOrigemState(next)
    if(next!=='facebook'){revokePreviews(images);setImages([])}
    if(next!=='olx')setLink('')
  }

  const addImages=async(files:FileList|null)=>{
    if(!files?.length)return
    const room=MAX_IMAGES-images.length
    if(room<=0){setError(`Você pode enviar no máximo ${MAX_IMAGES} prints.`);return}
    setError('');setImageBusy(true)
    try{
      const prepared=await prepareScreenshots(Array.from(files).slice(0,room))
      setImages(current=>[...current,...prepared])
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível preparar os prints.')}
    finally{setImageBusy(false)}
  }

  const removeImage=(index:number)=>{
    setImages(current=>{
      const removed=current[index]
      if(removed)URL.revokeObjectURL(removed.preview)
      return current.filter((_,i)=>i!==index)
    })
  }

  const analyze=async()=>{
    setError('');setResult(null)
    if(origem==='olx'&&!link.trim()){setError('Cole o link do anúncio da OLX.');return}
    if(origem==='facebook'&&!images.length){setError('Envie pelo menos um print do anúncio do Facebook Marketplace.');return}
    if(origem==='manual'&&!texto.trim()){setError('Cole os dados do anúncio para continuar.');return}

    setBusy(true)
    const {data,error:e}=await supabase.functions.invoke('analisar-anuncio',{
      body:{origem,link:origem==='olx'?link:'',texto,preco:Number(preco||0),imagens:origem==='facebook'?images.map(({mime_type,data,name})=>({mime_type,data,name})):[]}
    })
    setBusy(false)
    if(e){setError(await readFunctionError(e));return}
    if(data?.error){setError(data?.details||data.error);return}
    setResult(data.analysis as AnalysisResult)
  }

  const save=async(pipeline_status:PipelineStatus,veredito_radar:RadarDecision|null,destination:'dashboard'|'history',action:'negotiate'|'discard'|'save')=>{
    if(!result)return
    setSaving(true);setDecisionBusy(action);setError('')
    const textoPersistido=texto.trim() || (origem==='facebook'? `Análise por ${images.length} print(s) do Facebook Marketplace` : '')
    const {error:e}=await supabase.from('analises').insert({
      origem,
      titulo_anuncio:result.produto,
      preco_anunciado:result.precos.preco_anunciado,
      categoria:result.categoria,
      link_anuncio:origem==='olx'&&link?link:null,
      texto_anuncio:textoPersistido,
      analise_ia:result as any,
      margem_lucro_potencial:result.calculado.margem_percentual,
      oferta_recomendada:result.precos.oferta_equilibrada,
      status:'analisado',
      pipeline_status,
      veredito_radar
    })
    setSaving(false);setDecisionBusy(null)
    if(e){setError(e.message);return}
    onSaved(destination)
  }

  return{origem,link,texto,preco,images,imageBusy,busy,saving,decisionBusy,error,result,setOrigem,setLink,setTexto,setPreco,addImages,removeImage,analyze,save}
}
