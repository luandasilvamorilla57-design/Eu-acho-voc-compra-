import { useMemo,useState } from 'react'
import { Check,Copy,RefreshCw,Sparkles,X } from 'lucide-react'
import type { AnaliseRow,PurchaseRow } from '../../types/database'
import type { ResaleAd } from '../../types/resale'
import { supabase } from '../../lib/supabase'
import { money } from '../../utils/format'
import { purchaseTotalCost } from '../../utils/purchase'
import { reportClientError } from '../../lib/errorReporter'

function parseSaved(value:unknown):ResaleAd|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null
  const v=value as any
  return typeof v.titulo==='string'?v as ResaleAd:null
}

export function ResaleAdModal({item,analysis,onClose,onSave}:{item:PurchaseRow;analysis?:AnaliseRow;onClose:()=>void;onSave:(id:string,ad:ResaleAd)=>Promise<void>}){
  const saved=useMemo(()=>parseSaved(item.anuncio_revenda),[item.anuncio_revenda])
  const [ad,setAd]=useState<ResaleAd|null>(saved)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [copied,setCopied]=useState('')

  const generate=async()=>{
    setBusy(true);setError('')
    const {data,error:e}=await supabase.functions.invoke('gerar-anuncio',{body:{
      produto:item.produto,
      categoria:item.categoria,
      observacoes:item.observacoes,
      custo_total:purchaseTotalCost(item),
      preco_minimo:item.preco_minimo_venda,
      analise:analysis?.analise_ia??null
    }})
    if(e){reportClientError(e,'resale.generate');setError(e.message);setBusy(false);return}
    if(data?.error){setError(data.error);setBusy(false);return}
    const next=data.ad as ResaleAd
    setAd(next)
    try{await onSave(item.id,next)}catch(err){reportClientError(err,'resale.save');setError(err instanceof Error?err.message:'Não foi possível salvar o anúncio.')}
    setBusy(false)
  }

  const copy=async(key:string,text:string)=>{
    await navigator.clipboard.writeText(text)
    setCopied(key);setTimeout(()=>setCopied(''),1300)
  }

  return <div className="purchase-modal"><button className="purchase-modal__backdrop" onClick={onClose} aria-label="Fechar"/><div className="purchase-modal__card resale-card">
    <div className="flex items-start justify-between gap-4"><div><span className="premium-eyebrow text-cyan-400">PREPARAR PARA VENDER</span><h3 className="font-display mt-1.5 text-2xl font-extrabold purchase-title">Anúncio de revenda</h3><p className="mt-2 text-[12px] leading-5 text-slate-500">A IA usa o estado real e sua margem. Ela não deve inventar especificações que não estão registradas.</p></div><button type="button" onClick={onClose} className="purchase-close"><X size={17}/></button></div>

    {!ad?<div className="resale-empty"><Sparkles size={22}/><strong>Transforme a compra em um anúncio pronto.</strong><p>Título, descrição, faixa de preço, argumentos e checklist das fotos que ajudam a vender.</p><button onClick={generate} disabled={busy}>{busy?'Gerando anúncio...':'Gerar anúncio de revenda'}</button></div>:<div className="mt-5 grid gap-4">
      <div className="resale-prices"><Price label="Venda rápida" value={ad.preco_venda_rapida}/><Price label="Equilibrado" value={ad.preco_equilibrado} accent/><Price label="Premium" value={ad.preco_premium}/></div>
      <CopyBlock label="Título" text={ad.titulo} copied={copied==='title'} onCopy={()=>copy('title',ad.titulo)}/>
      <CopyBlock label="Descrição pronta" text={ad.descricao} copied={copied==='desc'} onCopy={()=>copy('desc',ad.descricao)} multiline/>
      <div className="grid gap-3 sm:grid-cols-2"><List title="Pontos para destacar" items={ad.pontos_destaque}/><List title="Fotos que faltam fazer" items={ad.checklist_fotos}/></div>
      <CopyBlock label="Resposta para quem pedir desconto" text={ad.resposta_negociacao} copied={copied==='reply'} onCopy={()=>copy('reply',ad.resposta_negociacao)}/>
      <button onClick={generate} disabled={busy} className="resale-regenerate"><RefreshCw size={14}/>{busy?'Gerando novamente...':'Gerar nova versão'}</button>
    </div>}
    {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-[11px] text-red-300">{error}</div>}
  </div></div>
}

function Price({label,value,accent=false}:{label:string;value:number;accent?:boolean}){return <div className={accent?'is-accent':''}><span>{label}</span><strong>{money(value)}</strong></div>}
function CopyBlock({label,text,copied,onCopy,multiline=false}:{label:string;text:string;copied:boolean;onCopy:()=>void;multiline?:boolean}){return <div className="resale-copy"><div className="flex items-center justify-between gap-2"><span>{label}</span><button onClick={onCopy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?'Copiado':'Copiar'}</button></div><p className={multiline?'whitespace-pre-line':''}>{text}</p></div>}
function List({title,items}:{title:string;items:string[]}){return <div className="resale-list"><strong>{title}</strong>{items.map((x,i)=><span key={i}><Check size={12}/>{x}</span>)}</div>}
