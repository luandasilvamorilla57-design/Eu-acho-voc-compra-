import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { InventoryStatus,Json,PurchaseOrigin,PurchaseRow } from '../types/database'
import type { ResaleAd } from '../types/resale'
import { purchasePhotoPaths,purchaseTotalCost } from '../utils/purchase'
import { prepareScreenshots,revokePreviews } from '../utils/imageInput'
import { reportClientError } from '../lib/errorReporter'

export type PurchaseCosts={transport?:number;repair?:number;cleaning?:number;fees?:number;other?:number;notes?:string}
export type NewPurchaseInput={analysisId?:string|null;origin:PurchaseOrigin;product:string;category?:string|null;buyPrice:number;costs?:PurchaseCosts;minSalePrice?:number|null;notes?:string|null}
export type PurchaseUpdateInput={custo_transporte?:number;custo_reparo?:number;custo_limpeza?:number;custo_taxas?:number;outros_custos?:number;custos_observacao?:string|null;preco_minimo_venda?:number|null;observacoes?:string|null;situacao_estoque?:InventoryStatus;data_reserva?:string|null;fotos?:Json;anuncio_revenda?:Json|null}

function decodeBase64(data:string){const binary=atob(data);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes}

export function usePurchases(active:boolean){
  const [items,setItems]=useState<PurchaseRow[]>([])
  const [loading,setLoading]=useState(false)

  const load=useCallback(async()=>{if(!active)return;setLoading(true);const {data,error}=await supabase.from('compras').select('*').order('data_compra',{ascending:false});if(error)reportClientError(error,'purchases.load');setItems(data??[]);setLoading(false)},[active])
  useEffect(()=>{load()},[load])

  const createPurchase=async(input:NewPurchaseInput)=>{
    const c=input.costs??{}
    const {error}=await supabase.from('compras').insert({analise_id:input.analysisId??null,origem_compra:input.origin,produto:input.product.trim(),categoria:input.category?.trim()||null,preco_compra:input.buyPrice,custo_transporte:c.transport??0,custo_reparo:c.repair??0,custo_limpeza:c.cleaning??0,custo_taxas:c.fees??0,outros_custos:c.other??0,custos_observacao:c.notes?.trim()||null,preco_minimo_venda:input.minSalePrice??null,observacoes:input.notes?.trim()||null,situacao_estoque:'em_estoque',status:'comprado'})
    if(error)throw error
    await load()
  }

  const markSold=async(id:string,salePrice:number)=>{
    const item=items.find(x=>x.id===id);if(!item)throw new Error('Compra não encontrada.')
    const loss=salePrice<purchaseTotalCost(item)
    const {error}=await supabase.from('compras').update({preco_venda:salePrice,status:'vendido',situacao_estoque:loss?'prejuizo':'vendido',data_venda:new Date().toISOString()}).eq('id',id)
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

  const uploadPhotos=async(id:string,files:FileList|null):Promise<string[]>=>{
    if(!files?.length){const current=items.find(x=>x.id===id);return current?purchasePhotoPaths(current):[]}
    const item=items.find(x=>x.id===id);if(!item)throw new Error('Compra não encontrada.')
    const existing=purchasePhotoPaths(item);const room=8-existing.length
    if(room<=0)throw new Error('Este item já tem 8 fotos.')
    const prepared=await prepareScreenshots(Array.from(files).slice(0,room))
    const {data:userData,error:userError}=await supabase.auth.getUser()
    if(userError||!userData.user){revokePreviews(prepared);throw new Error('Sessão inválida. Entre novamente.')}
    const uploaded:string[]=[]
    try{
      for(const image of prepared){
        const path=`${userData.user.id}/${id}/${crypto.randomUUID()}.jpg`
        const {error}=await supabase.storage.from('purchase-photos').upload(path,decodeBase64(image.data),{contentType:'image/jpeg',upsert:false,cacheControl:'3600'})
        if(error)throw error
        uploaded.push(path)
      }
      const next=[...existing,...uploaded]
      const {error}=await supabase.from('compras').update({fotos:next as any}).eq('id',id)
      if(error)throw error
      await load()
      return next
    }catch(error){
      if(uploaded.length)await supabase.storage.from('purchase-photos').remove(uploaded)
      reportClientError(error,'purchase.photos.upload',{purchaseId:id})
      throw error
    }finally{revokePreviews(prepared)}
  }

  const removePhoto=async(id:string,path:string)=>{
    const item=items.find(x=>x.id===id);if(!item)throw new Error('Compra não encontrada.')
    const current=purchasePhotoPaths(item);if(!current.includes(path))return
    const {error:storageError}=await supabase.storage.from('purchase-photos').remove([path]);if(storageError)throw storageError
    const {error}=await supabase.from('compras').update({fotos:current.filter(x=>x!==path) as any}).eq('id',id);if(error)throw error
    await load()
  }

  const saveResaleAd=async(id:string,ad:ResaleAd)=>{const {error}=await supabase.from('compras').update({anuncio_revenda:ad as any}).eq('id',id);if(error)throw error;await load()}

  return{items,loading,load,createPurchase,markSold,updatePurchase,uploadPhotos,removePhoto,saveResaleAd}
}
