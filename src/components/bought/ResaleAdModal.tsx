import { useEffect,useMemo,useState } from 'react'
import { AlertTriangle,Camera,Check,CheckCircle2,Copy,ImagePlus,RefreshCw,Sparkles,Upload,X } from 'lucide-react'
import type { AnaliseRow,PurchaseRow } from '../../types/database'
import type { PhotoAudit,ResaleAd } from '../../types/resale'
import { supabase } from '../../lib/supabase'
import { money } from '../../utils/format'
import { purchaseTotalCost } from '../../utils/purchase'
import { prepareScreenshots,revokePreviews,type PreparedImage } from '../../utils/imageInput'
import { reportClientError } from '../../lib/errorReporter'

function parseSaved(value:unknown):ResaleAd|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null
  const v=value as any
  return typeof v.titulo==='string'?v as ResaleAd:null
}

export function ResaleAdModal({item,analysis,onClose,onSave}:{item:PurchaseRow;analysis?:AnaliseRow;onClose:()=>void;onSave:(id:string,ad:ResaleAd)=>Promise<void>}){
  const saved=useMemo(()=>parseSaved(item.anuncio_revenda),[item.anuncio_revenda])
  const [ad,setAd]=useState<ResaleAd|null>(saved)
  const [images,setImages]=useState<PreparedImage[]>([])
  const [preparing,setPreparing]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [copied,setCopied]=useState('')

  useEffect(()=>()=>revokePreviews(images),[])

  const addImages=async(files:FileList|null)=>{
    if(!files?.length)return
    const room=6-images.length
    if(room<=0){setError('Você já selecionou 6 fotos.');return}
    setPreparing(true);setError('')
    try{
      const prepared=await prepareScreenshots(Array.from(files).slice(0,room))
      setImages(current=>[...current,...prepared])
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível preparar as fotos.')}
    finally{setPreparing(false)}
  }

  const removeImage=(index:number)=>{
    setImages(current=>{
      const removed=current[index]
      if(removed)URL.revokeObjectURL(removed.preview)
      return current.filter((_,i)=>i!==index)
    })
  }

  const generate=async()=>{
    if(images.length===0){setError('Envie pelo menos uma foto que você pretende usar no anúncio.');return}
    setBusy(true);setError('')
    const {data,error:e}=await supabase.functions.invoke('gerar-anuncio',{body:{
      produto:item.produto,
      categoria:item.categoria,
      observacoes:item.observacoes,
      custo_total:purchaseTotalCost(item),
      preco_minimo:item.preco_minimo_venda,
      analise:analysis?.analise_ia??null,
      imagens:images.map(({mime_type,data,name})=>({mime_type,data,name}))
    }})
    if(e){reportClientError(e,'resale.generate',{purchaseId:item.id});setError(e.message);setBusy(false);return}
    if(data?.error){setError(data.error);setBusy(false);return}
    const next=data.ad as ResaleAd
    setAd(next)
    try{await onSave(item.id,next)}
    catch(err){reportClientError(err,'resale.save',{purchaseId:item.id});setError(err instanceof Error?err.message:'Não foi possível salvar o anúncio.')}
    setBusy(false)
  }

  const copy=async(key:string,text:string)=>{
    try{await navigator.clipboard.writeText(text);setCopied(key);setTimeout(()=>setCopied(''),1300)}
    catch{setError('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.')}
  }

  return <div className="purchase-modal">
    <button className="purchase-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <div className="purchase-modal__card resale-card resale-photo-assistant">
      <div className="flex items-start justify-between gap-4">
        <div><span className="premium-eyebrow text-cyan-400">ANÚNCIO INTELIGENTE · PRO</span><h3 className="font-display mt-1.5 text-2xl font-extrabold purchase-title">Foto boa vende melhor.</h3><p className="mt-2 text-[12px] leading-5 text-slate-500">Envie as fotos que você pretende publicar. O Radar analisa cada uma e só depois monta o anúncio.</p></div>
        <button type="button" onClick={onClose} className="purchase-close"><X size={17}/></button>
      </div>

      <section className="photo-assistant-upload">
        <div className="photo-assistant-upload__head"><div><span className="premium-eyebrow text-blue-400">FOTOS DO ANÚNCIO</span><strong>1 a 6 fotos · quanto mais completas, melhor a avaliação</strong></div><span>{images.length}/6</span></div>
        {images.length>0&&<div className="photo-assistant-previews">{images.map((image,index)=><div key={image.preview} className="photo-assistant-preview"><img src={image.preview} alt={'Foto '+(index+1)}/><span>Foto {index+1}</span><button type="button" onClick={()=>removeImage(index)}><X size={12}/></button></div>)}</div>}
        {images.length<6&&<label className="photo-assistant-drop">
          <input type="file" accept="image/*" multiple className="hidden" onChange={e=>{addImages(e.target.files);e.currentTarget.value=''}}/>
          <Upload size={17}/><span><b>{preparing?'Preparando fotos...':'Adicionar fotos para análise'}</b><small>Nitidez · luz · enquadramento · fundo · limpeza · ângulos</small></span>
        </label>}
      </section>

      {ad?.foto_auditoria&&<PhotoAuditPanel audit={ad.foto_auditoria}/>}

      {ad&&<div className="mt-5 grid gap-4">
        <div className="resale-section-heading"><span className="premium-eyebrow text-emerald-400">ANÚNCIO PRONTO</span><strong>Copie e publique na OLX ou Marketplace.</strong></div>
        <div className="resale-prices"><Price label="Venda rápida" value={ad.preco_venda_rapida}/><Price label="Equilibrado" value={ad.preco_equilibrado} accent/><Price label="Premium" value={ad.preco_premium}/></div>
        <CopyBlock label="Título sugerido" text={ad.titulo} copied={copied==='title'} onCopy={()=>copy('title',ad.titulo)}/>
        <CopyBlock label="Descrição pronta" text={ad.descricao} copied={copied==='desc'} onCopy={()=>copy('desc',ad.descricao)} multiline/>
        <div className="grid gap-3 sm:grid-cols-2"><List title="Pontos para destacar" items={ad.pontos_destaque}/><List title="Fotos que ainda ajudam" items={ad.checklist_fotos}/></div>
        <CopyBlock label="Resposta para quem pedir desconto" text={ad.resposta_negociacao} copied={copied==='reply'} onCopy={()=>copy('reply',ad.resposta_negociacao)}/>
      </div>}

      {!ad&&<div className="photo-assistant-explainer">
        <div><Camera size={16}/><span><b>Qualidade visual</b><small>Detecta foto escura, embaçada, cortada ou com fundo ruim.</small></span></div>
        <div><ImagePlus size={16}/><span><b>Apresentação do produto</b><small>Aponta sujeira aparente, reflexos e ângulos importantes que estão faltando.</small></span></div>
        <div><Sparkles size={16}/><span><b>Anúncio automático</b><small>Depois da avaliação, cria título, descrição e faixa de preço.</small></span></div>
      </div>}

      {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-[11px] leading-5 text-red-300">{error}</div>}

      <button onClick={generate} disabled={busy||preparing||images.length===0} className="photo-assistant-generate">
        {ad?<RefreshCw size={16}/>:<Sparkles size={16}/>}
        {busy?'Analisando fotos e montando anúncio...':ad?'Reanalisar fotos e gerar nova versão':'Analisar fotos e criar anúncio'}
      </button>
      {saved&&images.length===0&&<p className="mt-2 text-center text-[9px] text-slate-600">O resultado anterior continua salvo. Para gerar uma nova avaliação, selecione as fotos novamente.</p>}
    </div>
  </div>
}

function PhotoAuditPanel({audit}:{audit:PhotoAudit}){
  const tone=audit.nota_geral>=80?'good':audit.nota_geral>=60?'mid':'bad'
  return <section className={'photo-audit is-'+tone}>
    <div className="photo-audit__top">
      <div><span className="premium-eyebrow text-cyan-400">DIAGNÓSTICO DAS FOTOS</span><h4 className="font-display mt-1.5 text-lg font-bold purchase-title">{audit.pronta_para_publicar?'Dá para publicar.':'Vale melhorar antes de publicar.'}</h4><p>{audit.resumo}</p></div>
      <div className="photo-audit__score"><strong>{Math.round(audit.nota_geral)}</strong><span>/100</span><small>nota geral</small></div>
    </div>

    {audit.foto_principal_indice>0&&<div className="photo-main-pick"><CheckCircle2 size={14}/> Melhor candidata para foto principal: <b>Foto {audit.foto_principal_indice}</b></div>}

    <div className="photo-review-grid">{audit.avaliacoes.map(photo=><article key={photo.indice} className={'photo-review is-'+photo.qualidade}>
      <div className="photo-review__head"><span>Foto {photo.indice}</span><strong>{Math.round(photo.nota)}/100</strong></div>
      {photo.problemas.length>0&&<div className="photo-review__problems">{photo.problemas.slice(0,3).map((x,i)=><span key={i}><AlertTriangle size={11}/>{x}</span>)}</div>}
      {photo.pontos_fortes.length>0&&<div className="photo-review__good">{photo.pontos_fortes.slice(0,2).map((x,i)=><span key={i}><Check size={11}/>{x}</span>)}</div>}
      <p>{photo.acao_recomendada}</p>
    </article>)}</div>

    {audit.plano_de_fotos.length>0&&<div className="photo-shot-plan"><strong>Se for refazer, siga esta ordem:</strong>{audit.plano_de_fotos.map((x,i)=><span key={i}><b>{i+1}</b>{x}</span>)}</div>}
  </section>
}

function Price({label,value,accent=false}:{label:string;value:number;accent?:boolean}){return <div className={accent?'is-accent':''}><span>{label}</span><strong>{money(value)}</strong></div>}
function CopyBlock({label,text,copied,onCopy,multiline=false}:{label:string;text:string;copied:boolean;onCopy:()=>void;multiline?:boolean}){return <div className="resale-copy"><div className="flex items-center justify-between gap-2"><span>{label}</span><button onClick={onCopy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?'Copiado':'Copiar'}</button></div><p className={multiline?'whitespace-pre-line':''}>{text}</p></div>}
function List({title,items}:{title:string;items:string[]}){return <div className="resale-list"><strong>{title}</strong>{items.map((x,i)=><span key={i}><Check size={12}/>{x}</span>)}</div>}
