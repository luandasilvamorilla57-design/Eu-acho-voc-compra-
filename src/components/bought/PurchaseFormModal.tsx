import { useMemo,useState } from 'react'
import { Check,ClipboardList,PackagePlus,Plus,Search,X } from 'lucide-react'
import type { AnaliseRow,PurchaseRow,RadarConfigRow } from '../../types/database'
import type { NewPurchaseInput } from '../../hooks/usePurchases'
import { money } from '../../utils/format'
import { costDraftToNumbers,PurchaseCostFields,sumCostDraft,type CostDraft } from './PurchaseCostFields'

const emptyCosts:CostDraft={transport:'',repair:'',cleaning:'',fees:'',other:'',notes:''}

export function PurchaseFormModal({
  analyses,purchases,config,onClose,onCreate
}:{
  analyses:AnaliseRow[]
  purchases:PurchaseRow[]
  config:RadarConfigRow
  onClose:()=>void
  onCreate:(input:NewPurchaseInput)=>Promise<void>
}){
  const [source,setSource]=useState<'analysis'|'external'>('analysis')
  const [analysisId,setAnalysisId]=useState('')
  const [product,setProduct]=useState('')
  const [category,setCategory]=useState('')
  const [price,setPrice]=useState('')
  const [query,setQuery]=useState('')
  const [costs,setCosts]=useState<CostDraft>(emptyCosts)
  const [notes,setNotes]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const linked=new Set(purchases.map(p=>p.analise_id).filter(Boolean))
  const available=useMemo(()=>analyses.filter(a=>!linked.has(a.id)&&a.titulo_anuncio.toLowerCase().includes(query.toLowerCase())),[analyses,purchases,query])
  const selected=analyses.find(a=>a.id===analysisId)
  const buyPrice=Number(price||0)
  const totalCost=buyPrice+sumCostDraft(costs)
  const minSale=totalCost+(config.lucro_minimo||0)

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setError('')
    const finalProduct=source==='analysis'?selected?.titulo_anuncio:product.trim()
    const finalCategory=source==='analysis'?selected?.categoria:category.trim()
    if(source==='analysis'&&!selected){setError('Selecione um item analisado pelo Radar.');return}
    if(!finalProduct){setError('Informe o produto comprado.');return}
    if(!buyPrice||buyPrice<=0){setError('Informe quanto você realmente pagou.');return}

    setBusy(true)
    try{
      await onCreate({
        analysisId:source==='analysis'?selected!.id:null,
        origin:source==='analysis'?'analise':'externo',
        product:finalProduct,
        category:finalCategory||null,
        buyPrice,
        costs:costDraftToNumbers(costs),
        minSalePrice:minSale,
        notes
      })
      onClose()
    }catch(err){setError(err instanceof Error?err.message:'Não foi possível salvar a compra.')}
    finally{setBusy(false)}
  }

  return <div className="purchase-modal">
    <button className="purchase-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <form onSubmit={submit} className="purchase-modal__card">
      <div className="flex items-start justify-between gap-4">
        <div><span className="text-[9px] font-bold uppercase tracking-[.2em] text-emerald-400">REGISTRAR COMPRA</span><h3 className="font-display mt-1 text-2xl font-extrabold tracking-[-.04em] purchase-title">O que você comprou?</h3><p className="mt-2 text-xs leading-5 text-slate-500">Registre o preço real e todos os custos para o lucro não ficar maquiado.</p></div>
        <button type="button" onClick={onClose} className="purchase-close"><X size={17}/></button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={()=>{setSource('analysis');setError('')}} className={'purchase-source '+(source==='analysis'?'is-active':'')}><span><ClipboardList size={17}/></span><strong>Do Radar</strong><small>Já analisei aqui</small></button>
        <button type="button" onClick={()=>{setSource('external');setError('')}} className={'purchase-source '+(source==='external'?'is-active':'')}><span><PackagePlus size={17}/></span><strong>Por fora</strong><small>Comprei sem analisar</small></button>
      </div>

      {source==='analysis'?<div className="mt-5">
        <label className="text-xs font-semibold text-slate-500">Selecione uma análise</label>
        <div className="purchase-search mt-2"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nas análises..."/></div>
        <div className="purchase-analysis-list mt-2">{available.length?available.map(a=><button type="button" key={a.id} onClick={()=>setAnalysisId(a.id)} className={'purchase-analysis-item '+(analysisId===a.id?'is-active':'')}><span className="min-w-0"><strong>{a.titulo_anuncio}</strong><small>{a.categoria||'Sem categoria'} · anunciado por {money(a.preco_anunciado)}</small></span><span className="purchase-select-dot">{analysisId===a.id?<Check size={12}/>:null}</span></button>):<div className="p-4 text-center text-[11px] leading-5 text-slate-500">Nenhuma análise disponível.</div>}</div>
      </div>:<div className="mt-5 grid gap-4">
        <label className="text-xs font-semibold text-slate-500">Produto<input className="purchase-input" value={product} onChange={e=>setProduct(e.target.value)} placeholder="Ex.: PS4 Slim 1TB"/></label>
        <label className="text-xs font-semibold text-slate-500">Categoria <span className="font-normal text-slate-600">(opcional)</span><input className="purchase-input" value={category} onChange={e=>setCategory(e.target.value)} placeholder="Ex.: Games"/></label>
      </div>}

      <label className="mt-5 block text-xs font-semibold text-slate-500">Quanto você pagou?<div className="purchase-money-input"><span>R$</span><input inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value.replace(',','.'))} placeholder="0,00"/></div></label>

      <div className="mt-5"><PurchaseCostFields value={costs} onChange={setCosts}/></div>

      {buyPrice>0&&<div className="purchase-cost-preview mt-4"><div><span>Custo total real</span><strong>{money(totalCost)}</strong></div><div><span>Venda mínima pela sua meta</span><strong className="text-emerald-400">{money(minSale)}</strong></div></div>}

      <label className="mt-4 block text-[10px] text-slate-500">Observação do item<input className="purchase-input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Estado, acessórios, onde comprou..."/></label>

      {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}
      <button disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950 disabled:opacity-50"><Plus size={17}/>{busy?'Salvando compra...':'Salvar em Comprei'}</button>
    </form>
  </div>
}
