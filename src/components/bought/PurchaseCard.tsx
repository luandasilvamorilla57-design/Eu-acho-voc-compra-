import { AlertTriangle,ArrowRight,BadgeCheck,CalendarDays,ClipboardList,LockKeyhole,PackageOpen,Settings2,ShoppingBag,Sparkles } from 'lucide-react'
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
        <span className={'purchase-card__icon '+(sold?'is-sold':'')}>{sold?<BadgeCheck size={20}/>:<ShoppingBag size={20}/>}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-display purchase-item-title truncate font-bold purchase-title">{item.produto}</h3><span className={'purchase-status '+(sold?'is-sold':'')}>{label}</span></div>
          <div className="purchase-item-meta mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays size={13}/>{dateBR(item.data_compra)} · {days} dias</span><span className="flex items-center gap-1.5">{item.origem_compra==='analise'?<ClipboardList size={13}/>:<PackageOpen size={13}/>} {item.origem_compra==='analise'?'Veio do Radar':'Compra por fora'}</span></div>
        </div>
      </div>
      <span className={'inventory-health is-'+health.key}>{health.label}</span>
    </div>

    {stale&&<div className="purchase-stale mt-3"><AlertTriangle size={14}/><span>{health.detail}</span></div>}

    <div className={'mt-4 grid gap-2 '+(sold?'grid-cols-3':'grid-cols-2')}>
      <Stat label="Você pagou" value={money(item.preco_compra)}/>
      <Stat label="Custo total" value={money(total)} hint={extra>0?money(extra)+' extras':undefined}/>
      {sold&&<Stat label="Lucro real" value={money(item.lucro_realizado)} accent={(item.lucro_realizado??0)>=0}/>}
    </div>

    {!sold&&item.preco_minimo_venda&&<div className="purchase-min-sale mt-3 flex items-center justify-between rounded-xl purchase-result-row px-3 py-3"><span>Não vender abaixo de</span><strong>{money(item.preco_minimo_venda)}</strong></div>}
    {sold&&<div className="purchase-sold-result mt-3 flex items-center justify-between rounded-xl purchase-result-row px-3 py-3"><span>Vendeu por {money(item.preco_venda)} · ROI</span><strong className={(item.roi_realizado??0)>=0?'is-positive':'is-negative'}>{pct(item.roi_realizado)}</strong></div>}

    <button onClick={()=>photoAssistantUnlocked?onAd(item):onLockedAd()} className={'purchase-pro-action mt-4 '+(adReady?'is-ready ':'')+(!photoAssistantUnlocked?'is-locked':'')}>
      <span className="purchase-pro-action__icon">{photoAssistantUnlocked?<Sparkles size={19}/>:<LockKeyhole size={18}/>}</span>
      <span className="purchase-pro-action__copy">
        <span className="purchase-pro-action__eyebrow"><b>PRO</b> ANÚNCIO INTELIGENTE</span>
        <strong>{photoAssistantUnlocked?(adReady?'Abrir anúncio inteligente':'Preparar venda com IA'):'Desbloquear preparação de venda'}</strong>
        <small>{photoAssistantUnlocked?(adReady?'Avaliação e anúncio já salvos neste produto.':'Avaliar fotos + criar título e descrição prontos.'):'Avaliação de fotos e anúncio automático no BRIKE Pro.'}</small>
      </span>
      <ArrowRight size={17} className="purchase-pro-action__arrow"/>
    </button>

    <div className={'purchase-secondary-actions mt-3 grid gap-2 '+(!sold?'grid-cols-2':'grid-cols-1')}>
      <button onClick={()=>onManage(item)} className="purchase-manage"><Settings2 size={16}/> Gerenciar item</button>
      {!sold&&<button onClick={()=>onSell(item)} className="purchase-sell"><BadgeCheck size={16}/> Já vendeu?</button>}
    </div>
  </article>
}

function Stat({label,value,accent=false,hint}:{label:string;value:string;accent?:boolean;hint?:string}){return <div className="purchase-stat purchase-stat--large rounded-xl p-3"><span>{label}</span><strong className={'font-display '+(accent?'text-emerald-400':'purchase-title')}>{value}</strong>{hint&&<small>{hint}</small>}</div>}
