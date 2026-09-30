import { useState } from 'react'
import { Camera,ScanLine,Upload,X } from 'lucide-react'
import type { AnaliseRow } from '../../types/database'
import { prepareScreenshots,revokePreviews,type PreparedImage } from '../../utils/imageInput'

export function InspectionModal({item,onClose,onReinspect}:{item:AnaliseRow;onClose:()=>void;onReinspect:(id:string,notes:string,images:{mime_type:string;data:string;name:string}[])=>Promise<void>}){
  const [notes,setNotes]=useState(item.inspecao_notas??'')
  const [images,setImages]=useState<PreparedImage[]>([])
  const [preparing,setPreparing]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const add=async(files:FileList|null)=>{
    if(!files?.length)return
    setPreparing(true);setError('')
    try{const prepared=await prepareScreenshots(Array.from(files).slice(0,Math.max(0,4-images.length)));setImages(current=>[...current,...prepared])}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível preparar as fotos.')}
    finally{setPreparing(false)}
  }

  const remove=(index:number)=>setImages(current=>{const image=current[index];if(image)URL.revokeObjectURL(image.preview);return current.filter((_,i)=>i!==index)})

  const submit=async()=>{
    if(!notes.trim()&&!images.length){setError('Conte o que você encontrou na visita ou envie fotos novas.');return}
    setBusy(true);setError('')
    try{
      await onReinspect(item.id,notes,images.map(({mime_type,data,name})=>({mime_type,data,name})))
      revokePreviews(images);onClose()
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível reavaliar.')}
    finally{setBusy(false)}
  }

  return <div className="pipeline-modal"><button className="pipeline-modal__backdrop" onClick={onClose} aria-label="Fechar"/><div className="pipeline-modal__card">
    <div className="flex items-start justify-between gap-4"><div><span className="text-[9px] font-bold tracking-[.18em] text-blue-400">PÓS-VISITA</span><h3 className="font-display mt-1 text-xl font-bold pipeline-title">Atualizar inspeção</h3><p className="mt-1 text-[10px] text-slate-500">{item.titulo_anuncio}</p></div><button onClick={onClose} className="pipeline-close"><X size={16}/></button></div>
    <div className="mt-4 rounded-2xl border border-blue-400/10 bg-blue-400/[.04] p-3 text-[10px] leading-5 text-slate-400"><ScanLine size={14} className="mb-1 text-blue-400"/>Conte o que mudou depois de ver o produto pessoalmente. O Radar recalcula risco, teto de compra e negociação.</div>
    <label className="mt-4 block text-xs font-semibold text-slate-500">O que você encontrou?<textarea className="purchase-inspection-text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex.: tela com risco, bateria 78%, controle com drift, vendedor aceitou R$ 900..."/></label>
    <label className="mt-4 grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/20 p-4 text-center"><input type="file" accept="image/*" multiple className="hidden" onChange={e=>{add(e.target.files);e.currentTarget.value=''}}/><span><Upload size={18} className="mx-auto text-emerald-400"/><strong className="mt-2 block text-xs pipeline-title">{preparing?'Preparando fotos...':'Adicionar fotos da inspeção'}</strong><small className="mt-1 block text-[9px] text-slate-600">Até 4 fotos novas</small></span></label>
    {images.length>0&&<div className="mt-3 grid grid-cols-4 gap-2">{images.map((img,i)=><div key={img.preview} className="relative aspect-square overflow-hidden rounded-xl"><img src={img.preview} className="h-full w-full object-cover"/><button onClick={()=>remove(i)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"><X size={11}/></button></div>)}</div>}
    {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}
    <button onClick={submit} disabled={busy||preparing} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-400 to-emerald-400 font-bold text-slate-950"><Camera size={16}/>{busy?'Radar reavaliando...':'Recalcular depois da visita'}</button>
  </div></div>
}
