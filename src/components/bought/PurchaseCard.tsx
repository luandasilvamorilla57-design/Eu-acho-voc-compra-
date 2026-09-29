import { BadgeCheck,CalendarDays,ClipboardList,PackageOpen,ShoppingBag } from 'lucide-react'
import type { PurchaseRow } from '../../types/database'
import { dateBR,money,pct } from '../../utils/format'

export function PurchaseCard({item,onSell}:{item:PurchaseRow;onSell:(item:PurchaseRow)=>void}){
  const sold=item.status==='vendido'
  return <article className="glass purchase-card rounded-[22px] p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`purchase-card__icon ${sold?'is-sold':''}`}>{sold?<BadgeCheck size={18}/>:<ShoppingBag size={18}/>}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display truncate text-base font-bold purchase-title">{item.produto}</h3>
            <span className={`purchase-status ${sold?'is-sold':''}`}>{sold?'VENDIDO':'EM ESTOQUE'}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><CalendarDays size={11}/>{dateBR(item.data_compra)}</span>
            <span className="flex items-center gap-1">{item.origem_compra==='analise'?<ClipboardList size={11}/>:<PackageOpen size={11}/>} {item.origem_compra==='analise'?'Veio do Radar':'Compra por fora'}</span>
            {item.categoria&&<span>{item.categoria}</span>}
          </div>
        </div>
      </div>
    </div>

    <div className={`mt-4 grid gap-2 ${sold?'grid-cols-3':'grid-cols-2'}`}>
      <Stat label="Você pagou" value={money(item.preco_compra)}/>
      {sold&&<Stat label="Vendeu por" value={money(item.preco_venda)}/>}
      <Stat label={sold?'Lucro real':'Situação'} value={sold?money(item.lucro_realizado):'Aguardando venda'} accent={sold&&((item.lucro_realizado??0)>=0)}/>
    </div>

    {sold?<div className="mt-3 flex items-center justify-between rounded-xl purchase-result-row px-3 py-2.5">
      <span className="text-[10px] text-slate-500">ROI realizado</span>
      <strong className={`text-xs ${(item.roi_realizado??0)>=0?'text-emerald-400':'text-red-400'}`}>{pct(item.roi_realizado)}</strong>
    </div>:<button onClick={()=>onSell(item)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[.055] text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/10">
      <BadgeCheck size={15}/> Já vendeu?
    </button>}
  </article>
}

function Stat({label,value,accent=false}:{label:string;value:string;accent?:boolean}){
  return <div className="purchase-stat rounded-xl p-3"><span className="block text-[8px] uppercase tracking-[.12em] text-slate-600">{label}</span><strong className={`font-display mt-1 block text-sm ${accent?'text-emerald-400':'purchase-title'}`}>{value}</strong></div>
}
