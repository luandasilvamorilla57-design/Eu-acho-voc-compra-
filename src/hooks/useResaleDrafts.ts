import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ResaleDraftOrigin,ResaleDraftRow,ResaleSaleOutcome } from '../types/database'
import type { ResaleAd } from '../types/resale'
import type { PreparedImage } from '../utils/imageInput'
import { reportClientError } from '../lib/errorReporter'

export type SaveResaleDraftInput={
  id?:string
  origin:ResaleDraftOrigin
  purchaseId?:string|null
  analysisId?:string|null
  product:string
  category?:string|null
  brand?:string|null
  model?:string|null
  condition?:string|null
  usageTime?:string|null
  notes?:string|null
  minPrice?:number|null
  idealPrice?:number|null
  images:PreparedImage[]
  ad:ResaleAd
}

function decodeBase64(data:string){
  const binary=atob(data)
  const bytes=new Uint8Array(binary.length)
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i)
  return bytes
}

function photoPaths(row:ResaleDraftRow|undefined){
  return row&&Array.isArray(row.fotos)?row.fotos.filter((x):x is string=>typeof x==='string'):[]
}

export function useResaleDrafts(active:boolean){
  const [items,setItems]=useState<ResaleDraftRow[]>([])
  const [loading,setLoading]=useState(false)

  const load=useCallback(async()=>{
    if(!active)return
    setLoading(true)
    const {data,error}=await supabase.from('anuncios_revenda').select('*').order('data_atualizacao',{ascending:false})
    if(error)reportClientError(error,'resale-drafts.load')
    setItems(data??[])
    setLoading(false)
  },[active])

  useEffect(()=>{load()},[load])

  const saveGenerated=async(input:SaveResaleDraftInput)=>{
    const existing=input.id?items.find(x=>x.id===input.id):undefined
    const draftId=input.id||crypto.randomUUID()
    const {data:userData,error:userError}=await supabase.auth.getUser()
    if(userError||!userData.user)throw new Error('Sessão inválida. Entre novamente.')
    const uid=userData.user.id
    const uploaded:string[]=[]

    try{
      for(const image of input.images){
        const path=`${uid}/${draftId}/${crypto.randomUUID()}.jpg`
        const {error}=await supabase.storage.from('resale-photos').upload(path,decodeBase64(image.data),{contentType:'image/jpeg',upsert:false,cacheControl:'3600'})
        if(error)throw error
        uploaded.push(path)
      }

      const previous=photoPaths(existing)
      const paths=uploaded.length?uploaded:previous
      const row={
        id:draftId,
        origem_item:input.origin,
        compra_id:input.purchaseId??null,
        analise_id:input.analysisId??null,
        produto:input.product.trim(),
        categoria:input.category?.trim()||null,
        marca:input.brand?.trim()||null,
        modelo:input.model?.trim()||null,
        condicao:input.condition?.trim()||null,
        tempo_uso:input.usageTime?.trim()||null,
        observacoes:input.notes?.trim()||null,
        preco_minimo:input.minPrice??null,
        preco_ideal:input.idealPrice??null,
        fotos:paths as any,
        resultado_ia:input.ad as any,
        titulo:input.ad.titulo,
        descricao:input.ad.descricao,
        preco_venda_rapida:input.ad.preco_venda_rapida,
        preco_equilibrado:input.ad.preco_equilibrado,
        preco_premium:input.ad.preco_premium,
        status:'pronto' as const
      }
      const {data,error}=await supabase.from('anuncios_revenda').upsert(row).select('*').single()
      if(error)throw error

      if(input.purchaseId){
        const {error:purchaseError}=await supabase.from('compras').update({anuncio_revenda:input.ad as any}).eq('id',input.purchaseId)
        if(purchaseError)throw purchaseError
      }

      if(uploaded.length&&previous.length){
        await supabase.storage.from('resale-photos').remove(previous)
      }
      await load()
      return data
    }catch(error){
      if(uploaded.length)await supabase.storage.from('resale-photos').remove(uploaded)
      reportClientError(error,'resale-drafts.save',{draftId,origin:input.origin})
      throw error
    }
  }

  const updateCopy=async(id:string,title:string,description:string)=>{
    const current=items.find(x=>x.id===id)
    if(!current)throw new Error('Rascunho não encontrado.')
    const result=(current.resultado_ia&&typeof current.resultado_ia==='object'&&!Array.isArray(current.resultado_ia)?current.resultado_ia:{}) as Record<string,unknown>
    const nextResult={...result,titulo:title,descricao:description}
    const {error}=await supabase.from('anuncios_revenda').update({titulo:title,descricao:description,resultado_ia:nextResult as any}).eq('id',id)
    if(error)throw error
    if(current.compra_id){
      const {error:purchaseError}=await supabase.from('compras').update({anuncio_revenda:nextResult as any}).eq('id',current.compra_id)
      if(purchaseError)throw purchaseError
    }
    await load()
  }

  const setSaleOutcome=async(id:string,outcome:ResaleSaleOutcome,salePrice?:number|null)=>{
    const {data,error}=await supabase.rpc('registrar_resultado_anuncio_revenda',{
      p_anuncio_id:id,
      p_resultado:outcome,
      p_preco_venda:salePrice??null
    })
    if(error){
      reportClientError(error,'resale-drafts.sale-outcome',{draftId:id,outcome})
      throw error
    }
    await load()
    return data as unknown as ResaleDraftRow
  }

  const remove=async(id:string)=>{
    const current=items.find(x=>x.id===id)
    if(!current)return
    const paths=photoPaths(current)
    if(paths.length)await supabase.storage.from('resale-photos').remove(paths)
    const {error}=await supabase.from('anuncios_revenda').delete().eq('id',id)
    if(error)throw error
    await load()
  }

  return{items,loading,load,saveGenerated,updateCopy,setSaleOutcome,remove}
}
