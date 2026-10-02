import { useEffect,useState } from 'react'
import { Camera,Image as ImageIcon,X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function AnalysisPhotos({paths}:{paths:string[]}){
  const [urls,setUrls]=useState<Record<string,string>>({})
  const [opened,setOpened]=useState<string>('')

  useEffect(()=>{
    let active=true
    const load=async()=>{
      if(!paths.length){setUrls({});return}
      const {data}=await supabase.storage.from('analysis-photos').createSignedUrls(paths,3600)
      if(!active)return
      const next:Record<string,string>={}
      for(const row of data??[])if(row.path&&row.signedUrl)next[row.path]=row.signedUrl
      setUrls(next)
    }
    void load()
    return()=>{active=false}
  },[paths.join('|')])

  if(!paths.length)return null

  return <>
    <section className="analysis-saved-photos">
      <div className="analysis-saved-photos__head">
        <div><span><Camera size={14}/> FOTOS ENVIADAS NA ANÁLISE</span><strong>Produto analisado</strong></div>
        <b>{paths.length} {paths.length===1?'imagem':'imagens'}</b>
      </div>
      <div className="analysis-saved-photos__grid">
        {paths.map((path,index)=><button type="button" key={path} onClick={()=>urls[path]&&setOpened(path)} className="analysis-saved-photo">
          {urls[path]?<img src={urls[path]} alt={`Foto enviada para análise ${index+1}`} loading="lazy"/>:<span><ImageIcon size={19}/></span>}
          <i>{String(index+1).padStart(2,'0')}</i>
        </button>)}
      </div>
      <p>Estas são as imagens originais que foram enviadas ao Radar para gerar esta análise.</p>
    </section>
    {opened&&urls[opened]&&<div className="analysis-photo-lightbox">
      <button type="button" className="analysis-photo-lightbox__backdrop" onClick={()=>setOpened('')} aria-label="Fechar foto"/>
      <button type="button" className="analysis-photo-lightbox__close" onClick={()=>setOpened('')} aria-label="Fechar"><X size={19}/></button>
      <img src={urls[opened]} alt="Foto ampliada do produto"/>
    </div>}
  </>
}
