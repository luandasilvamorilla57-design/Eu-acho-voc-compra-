import { useEffect,useState } from 'react'
import { Camera,Trash2,Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function PurchasePhotos({paths,editable=false,busy=false,onUpload,onRemove}:{paths:string[];editable?:boolean;busy?:boolean;onUpload?:(files:FileList|null)=>void;onRemove?:(path:string)=>void}){
  const [urls,setUrls]=useState<Record<string,string>>({})

  useEffect(()=>{
    let active=true
    const load=async()=>{
      if(!paths.length){setUrls({});return}
      const {data}=await supabase.storage.from('purchase-photos').createSignedUrls(paths,3600)
      if(!active)return
      const next:Record<string,string>={}
      for(const row of data??[])if(row.path&&row.signedUrl)next[row.path]=row.signedUrl
      setUrls(next)
    }
    load()
    return()=>{active=false}
  },[paths.join('|')])

  if(!paths.length&&!editable)return null

  return <div className="purchase-photos">
    {paths.length>0&&<div className="purchase-photo-grid">{paths.map(path=><div key={path} className="purchase-photo">
      {urls[path]?<img src={urls[path]} alt="Foto do produto"/>:<div className="purchase-photo__loading"><Camera size={15}/></div>}
      {editable&&onRemove&&<button type="button" onClick={()=>onRemove(path)} aria-label="Remover foto"><Trash2 size={12}/></button>}
    </div>)}</div>}
    {editable&&onUpload&&paths.length<8&&<label className="purchase-photo-upload">
      <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={e=>{onUpload(e.target.files);e.currentTarget.value=''}}/>
      <Upload size={14}/><span>{busy?'Enviando fotos...':'Adicionar fotos reais'}</span><small>{paths.length}/8</small>
    </label>}
  </div>
}
