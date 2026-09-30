import { AlertTriangle,BadgeCheck,CalendarDays,ClipboardList,FilePenLine,LockKeyhole,PackageOpen,Settings2,ShoppingBag } from 'lucide-react'
import type { PurchaseRow } from '../../types/database'
import { dateBR,money,pct } from '../../utils/format'
import { daysSince,purchaseExtraCosts,purchasePhotoPaths,purchaseTotalCost } from '../../utils/purchase'
import { inventoryHealth } from '../../utils/radarAlerts'
import { PurchasePhotos } from './PurchasePhotos'

export function PurchaseCard({item,onSell,onManage,onAd,onLockedAd,alertDays,photoAssistantUnlocked}:{item:PurchaseRow;onSell:(item:PurchaseRow)=>void;onManage:(item:PurchaseRow)=>void;onAd:(item:PurchaseRow)=>void;onLockedAd:()=>void;alertDays:number;photoAssistantUnlocked:boolean}){
  const sold=item.status==='vendido'
  const days=daysSince(item.data_compra)
  const extra=purchaseExtraCosts(item)
  const total=purchaseTotalCost(item)
  const health=inventoryHealth(item,alertDays)
  const photos=purchasePhotoPaths(item)
  const stale=health.key==='stuck'
  const label=item.situacao_estoque==='reservado'?'RESERVADO':item.situacao_estoque==='prejuizo'?'PREJUÍZO':sold?'VENDIDO':'EM ESTOQUE'
  const adReady=!!item.anuncio_revenda

  return <article className="glass purchase-card rounded-[24px] p-4 sm:p-5">
    {photos.length>0&&<div className="mb-4"><PurchasePhotos paths={photos.slice(0,4)}/></div>}
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className={'purchase-card__icon '+(sold?'is-sold':'')}>{sold?<BadgeCheck size={18}/>:<ShoppingBag size={18}/>}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-display truncate text-base font-bold purchase-title">{item.produto}</h3><span className={'purchase-status '+(sold?'is-sold':'')}>{label}</span></div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500"><span className="flex items-center gap-1"><CalendarDays size={11}/>{dateBR(item.data_compra)} · {days} dias</span><span className="flex items-center gap-1">{item.origem_compra==='analise'?<ClipboardList size={11}/>:<PackageOpen size={11}/>} {item.origem_compra==='analise'?'Veio do Radar':'Compra por fora'}</span></div>
        </div>
      </div>
      <span className={'inventory-health is-'+health.key}>{health.label}</span>
    </div>

    {stale&&<div className="purchase-stale mt-3"><AlertTriangle size={13}/><span>{health.detail}</span></div>}

    <div className={'mt-4 grid gap-2 '+(sold?'grid-cols-3':'grid-cols-2')}>
      <Stat label="Você pagou" value={money(item.preco_compra)}/>
      <Stat label="Custo total" value={money(total)} hint={extra>0?money(extra)+' extras':undefined}/>
      {sold&&<Stat label="Lucro real" value={money(item.lucro_realizado)} accent={(item.lucro_realizado??0)>=0}/>}
    </div>

    {!sold&&item.preco_minimo_venda&&<div className="mt-3 flex items-center justify-between rounded-xl purchase-result-row px-3 py-2.5"><span className="text-[11px] text-slate-500">Não vender abaixo de</span><strong className="text-[13px] text-emerald-400">{money(item.preco_minimo_venda)}</strong></div>}
    {sold&&<div className="mt-3 flex items-center justify-between rounded-xl purchase-result-row px-3 py-2.5"><span className="text-[11px] text-slate-500">Vendeu por {money(item.preco_venda)} · ROI</span><strong className={(item.roi_realizado??0)>=0?'text-[13px] text-emerald-400':'text-[13px] text-red-400'}>{pct(item.roi_realizado)}</strong></div>}

    <div className={'mt-4 grid gap-2 '+(!sold?'grid-cols-3':'grid-cols-2')}>
      <button onClick={()=>onManage(item)} className="purchase-manage"><Settings2 size={14}/> Gerenciar</button>
      <button onClick={()=>photoAssistantUnlocked?onAd(item):onLockedAd()} className={'purchase-ad '+(adReady?'is-ready ':'')+(!photoAssistantUnlocked?'is-locked':'')}>
        {photoAssistantUnlocked?<FilePenLine size={14}/>:<LockKeyhole size={14}/>}
        {photoAssistantUnlocked?(adReady?'Anúncio pronto':'Preparar venda'):'Pro · Anúncio IA'}
      </button>
      {!sold&&<button onClick={()=>onSell(item)} className="purchase-sell"><BadgeCheck size={15}/> Já vendeu?</button>}
    </div>
  </article>
}

function Stat({label,value,accent=false,hint}:{label:string;value:string;accent?:boolean;hint?:string}){return <div className="purchase-stat rounded-xl p-3"><span className="block text-[9px] uppercase tracking-[.12em] text-slate-600">{label}</span><strong className={'font-display mt-1 block text-sm '+(accent?'text-emerald-400':'purchase-title')}>{value}</strong>{hint&&<small className="mt-1 block text-[9px] text-slate-600">{hint}</small>}</div>}
