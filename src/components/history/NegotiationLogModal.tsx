import { useMemo,useState } from 'react'
import { AlertTriangle,CheckCircle2,MessageSquarePlus,X } from 'lucide-react'
import type { AnaliseRow,RadarConfigRow } from '../../types/database'
import type { AnalysisResult } from '../../types/analysis'
import { money,pct } from '../../utils/format'
import { targetCeiling } from '../../utils/strategy'

export function NegotiationLogModal({item,config,onClose,onSave}:{item:AnaliseRow;config:RadarConfigRow;onClose:()=>void;onSave:(id:string,offer:number|null,counter:number|null,response:string,note:string)=>Promise<void>}){
  const [offer,setOffer]=useState('')
  const [counter,setCounter]=useState('')
  const [response,setResponse]=useState('')
  const [note,setNote]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const a=item.analise_ia as unknown as AnalysisResult

  const calc=useMemo(()=>{
    const candidate=Number((counter||offer).replace(',','.'))||0
    if(!candidate)return null
    const resale=Number(a?.precos?.revenda_provavel||0)
    const costs=Number(a?.precos?.custos_estimados||0)
    const strategy=targetCeiling(config,resale,costs)
    const ai=Number(a?.precos?.teto_compra||strategy)
    const ceiling=Math.min(strategy||Number.POSITIVE_INFINITY,ai||Number.POSITIVE_INFINITY)
    const safe=Number.isFinite(ceiling)?ceiling:Math.max(strategy,ai,0)
    const profit=resale-candidate-costs
    const roi=candidate>0?profit/candidate*100:0
    const margin=resale>0?profit/resale*100:0
    return{candidate,resale,costs,safe,profit,roi,margin,ok:candidate<=safe&&profit>0,delta:Math.max(0,candidate-safe)}
  },[offer,counter,a,config])

  const save=async()=>{
    if(!offer&&!counter&&!response.trim()&&!note.trim()){setError('Registre pelo menos uma informação da negociação.');return}
    setBusy(true);setError('')
    try{await onSave(item.id,offer?Number(offer.replace(',','.')):null,counter?Number(counter.replace(',','.')):null,response,note);onClose()}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar.')}
    finally{setBusy(false)}
  }

  return <div className="pipeline-modal"><button className="pipeline-modal__backdrop" onClick={onClose} aria-label="Fechar"/><div className="pipeline-modal__card">
    <div className="flex items-start justify-between"><div><span className="premium-eyebrow text-emerald-400">NEGOCIAÇÃO EM TEMPO REAL</span><h3 className="font-display mt-1.5 text-xl font-bold pipeline-title">A contraproposta ainda compensa?</h3><p className="mt-1 text-[11px] text-slate-500">{item.titulo_anuncio}</p></div><button onClick={onClose} className="pipeline-close"><X size={16}/></button></div>

    <div className="mt-5 grid grid-cols-2 gap-2">
      <label className="text-[11px] text-slate-500">Sua oferta<div className="pipeline-money"><span>R$</span><input inputMode="decimal" value={offer} onChange={e=>setOffer(e.target.value.replace(',','.'))} placeholder="0,00"/></div></label>
      <label className="text-[11px] text-slate-500">Contraproposta do vendedor<div className="pipeline-money"><span>R$</span><input inputMode="decimal" value={counter} onChange={e=>setCounter(e.target.value.replace(',','.'))} placeholder="0,00"/></div></label>
    </div>

    {calc&&<div className={'counter-live '+(calc.ok?'is-good':'is-bad')}>
      <div className="counter-live__verdict">{calc.ok?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>}<strong>{calc.ok?'AINDA CABE NA SUA META':'PASSOU DO SEU LIMITE'}</strong></div>
      <div className="counter-live__grid"><span><small>Preço avaliado</small><b>{money(calc.candidate)}</b></span><span><small>Seu teto</small><b>{money(calc.safe)}</b></span><span><small>Lucro projetado</small><b>{money(calc.profit)}</b></span><span><small>ROI</small><b>{pct(calc.roi)}</b></span></div>
      {!calc.ok&&calc.delta>0&&<p>Para voltar ao seu limite, tente reduzir pelo menos {money(calc.delta)}.</p>}
    </div>}

    <label className="mt-4 block text-[11px] text-slate-500">Resposta do vendedor<input className="purchase-input" value={response} onChange={e=>setResponse(e.target.value)} placeholder="Ex.: aceita R$ 950 se buscar hoje"/></label>
    <label className="mt-4 block text-[11px] text-slate-500">Observação<textarea className="purchase-inspection-text" value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex.: vai responder amanhã, aceitou testar na hora..."/></label>
    {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}
    <button onClick={save} disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950"><MessageSquarePlus size={16}/>{busy?'Salvando...':'Salvar no histórico'}</button>
  </div></div>
}
