import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnalysisResult } from '../types/analysis'
import type { PipelineStatus,RadarConfigRow,RadarDecision } from '../types/database'
import type { AdOrigin } from '../components/new-analysis/AnalysisForm'
import type { MarketReferenceInput } from '../types/market'
import { prepareScreenshots, revokePreviews, type PreparedImage, MAX_IMAGES } from '../utils/imageInput'
import { reportClientError } from '../lib/errorReporter'
import type { BriqueOpportunity } from '../data/briqueCatalog'

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

function decodeBase64(data:string){
  const binary=atob(data)
  const bytes=new Uint8Array(binary.length)
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i)
  return bytes
}

async function uploadAnalysisImages(analysisId:string,images:PreparedImage[]){
  if(!images.length)return [] as string[]
  const {data:userData,error:userError}=await supabase.auth.getUser()
  if(userError||!userData.user)throw new Error('Sua sessão expirou. Entre novamente para salvar as fotos da análise.')

  const uploaded:string[]=[]
  try{
    for(const image of images){
      const path=`${userData.user.id}/${analysisId}/${crypto.randomUUID()}.jpg`
      const {error}=await supabase.storage.from('analysis-photos').upload(path,decodeBase64(image.data),{contentType:'image/jpeg',upsert:false,cacheControl:'3600'})
      if(error)throw error
      uploaded.push(path)
    }
    return uploaded
  }catch(error){
    if(uploaded.length)await supabase.storage.from('analysis-photos').remove(uploaded)
    throw error
  }
}

export function useNewAnalysis(onSaved:(destination:'dashboard'|'history')=>void,userProfile='',onUsageChanged?:()=>void|Promise<unknown>,focus:BriqueOpportunity|null=null,config?:RadarConfigRow){
  const [origem,setOrigemState]=useState<AdOrigin>('olx')
  const [link,setLink]=useState('')
  const [texto,setTexto]=useState('')
  const [preco,setPreco]=useState('')
  const [marketRefs,setMarketRefs]=useState<MarketReferenceInput[]>([])
  const [images,setImages]=useState<PreparedImage[]>([])
  const [imageBusy,setImageBusy]=useState(false)
  const [busy,setBusy]=useState(false)
  const [saving,setSaving]=useState(false)
  const [decisionBusy,setDecisionBusy]=useState<'negotiate'|'discard'|'save'|null>(null)
  const [error,setError]=useState('')
  const [result,setResult]=useState<AnalysisResult|null>(null)
  const imagesRef=useRef<PreparedImage[]>([])

  useEffect(()=>{imagesRef.current=images},[images])
  useEffect(()=>()=>revokePreviews(imagesRef.current),[])

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

  const addMarketRef=()=>setMarketRefs(current=>current.length>=5?current:[...current,{url:'',price:0,note:''}])
  const updateMarketRef=(index:number,patch:Partial<MarketReferenceInput>)=>setMarketRefs(current=>current.map((r,i)=>i===index?{...r,...patch}:r))
  const removeMarketRef=(index:number)=>setMarketRefs(current=>current.filter((_,i)=>i!==index))

  const analyze=async()=>{
    setError('');setResult(null)
    if(origem==='olx'&&!link.trim()){setError('Cole o link do anúncio da OLX.');return}
    if(origem==='facebook'&&!images.length){setError('Envie pelo menos um print do anúncio do Facebook Marketplace.');return}
    if(origem==='manual'&&!texto.trim()){setError('Cole os dados do anúncio para continuar.');return}

    const refs=marketRefs
      .map(r=>({url:r.url.trim(),price:Number(r.price||0),note:r.note.trim()}))
      .filter(r=>r.url||r.price>0||r.note)

    setBusy(true)
    try{
      const {data,error:e}=await supabase.functions.invoke('analisar-anuncio',{
        body:{
          origem,
          link:origem==='olx'?link:'',
          texto,
          preco:Number(preco||0),
          imagens:origem==='facebook'?images.map(({mime_type,data,name})=>({mime_type,data,name})):[],
          referencias_mercado:refs,
          perfil_usuario:userProfile,
          criterios_usuario:config?{
            capital_disponivel:config.capital_disponivel,
            lucro_minimo_modo:config.lucro_minimo_modo,
            lucro_minimo:config.lucro_minimo,
            lucro_minimo_percentual:config.lucro_minimo_percentual,
            roi_minimo:config.roi_minimo,
            giro_preferido:config.giro_preferido
          }:null,
          contexto_garimpo:focus?{
            produto:focus.title,
            categoria:focus.kind,
            maior_risco:focus.critical,
            foco_analise:focus.analysisFocus,
            faixa_anuncio:focus.marketAsk,
            faixa_compra:focus.targetBuy,
            abordagem:focus.negotiation
          }:null
        }
      })
      if(e){
        const msg=await readFunctionError(e)
        reportClientError(e,'analysis.invoke',{origem})
        setError(msg);return
      }
      if(data?.error){setError(data?.details||data.error);return}
      setResult(data.analysis as AnalysisResult)
      void onUsageChanged?.()
    }catch(e){
      reportClientError(e,'analysis.invoke.unexpected',{origem})
      setError(e instanceof Error?e.message:'A conexão foi interrompida durante a análise. Tente novamente.')
    }finally{
      setBusy(false)
    }
  }

  const save=async(pipeline_status:PipelineStatus,veredito_radar:RadarDecision|null,destination:'dashboard'|'history',action:'negotiate'|'discard'|'save',navigate=true)=>{
    if(!result)return null
    setSaving(true);setDecisionBusy(action);setError('')
    const textoPersistido=texto.trim() || (origem==='facebook'? `Análise por ${images.length} print(s) do Facebook Marketplace` : '')
    const refs=marketRefs.map(r=>({url:r.url.trim(),price:Number(r.price||0),note:r.note.trim()})).filter(r=>r.url||r.price>0||r.note)
    const analysisId=crypto.randomUUID()
    let photoPaths:string[]=[]

    try{
      photoPaths=await uploadAnalysisImages(analysisId,images)
      const {data:saved,error:e}=await supabase.from('analises').insert({
        id:analysisId,
        origem,
        titulo_anuncio:result.produto,
        preco_anunciado:result.precos.preco_anunciado,
        categoria:result.categoria,
        link_anuncio:origem==='olx'&&link?link:null,
        texto_anuncio:textoPersistido,
        analise_ia:result as any,
        referencias_usuario:refs as any,
        fotos:photoPaths as any,
        margem_lucro_potencial:result.calculado.margem_percentual,
        oferta_recomendada:result.precos.oferta_equilibrada,
        status:'analisado',
        pipeline_status,
        veredito_radar
      }).select('id').single()

      if(e||!saved?.id){
        if(photoPaths.length)await supabase.storage.from('analysis-photos').remove(photoPaths)
        throw e||new Error('Não foi possível salvar a análise.')
      }

      if(navigate)onSaved(destination)
      return saved.id as string
    }catch(e){
      const message=e instanceof Error?e.message:'Não foi possível salvar a análise e suas fotos.'
      setError(message)
      reportClientError(e,'analysis.save',{origin:origem,imageCount:images.length})
      return null
    }finally{
      setSaving(false)
      setDecisionBusy(null)
    }
  }

  return{origem,link,texto,preco,marketRefs,images,imageBusy,busy,saving,decisionBusy,error,result,setOrigem,setLink,setTexto,setPreco,addMarketRef,updateMarketRef,removeMarketRef,addImages,removeImage,analyze,save}
}
