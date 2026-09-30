import { useMemo,useState } from 'react'
import { BadgeDollarSign,Boxes,PackageCheck,Plus,TrendingUp } from 'lucide-react'
import type { AnaliseRow,PurchaseRow,RadarConfigRow } from '../types/database'
import type { NewPurchaseInput,PurchaseUpdateInput } from '../hooks/usePurchases'
import { PurchaseFormModal } from '../components/bought/PurchaseFormModal'
import { PurchaseCard } from '../components/bought/PurchaseCard'
import { PurchaseManageModal } from '../components/bought/PurchaseManageModal'
import { SellModal } from '../components/bought/SellModal'
import { money,pct } from '../utils/format'
import { purchaseTotalCost } from '../utils/purchase'

export function BoughtPage({analyses,purchases,config,onCreate,onSold,onUpdate}:{analyses:AnaliseRow[];purchases:PurchaseRow[];config:RadarConfigRow;onCreate:(input:NewPurchaseInput)=>Promise<void>;onSold:(id:string,salePrice:number)=>Promise<void>;onUpdate:(id:string,patch:PurchaseUpdateInput)=>Promise<void>}){
  const [adding,setAdding]=useState(false)
  const [selling,setSelling]=useState<PurchaseRow|null>(null)
  const [managing,setManaging]=useState<PurchaseRow|null>(null)

  const stats=useMemo(()=>{
    const stock=purchases.filter(p=>p.status!=='vendido')
    const sold=purchases.filter(p=>p.status==='vendido')
    const invested=stock.reduce((sum,p)=>sum+purchaseTotalCost(p),0)
    const potential=stock.reduce((sum,p)=>sum+(p.preco_minimo_venda??purchaseTotalCost(p)),0)
    const profit=sold.reduce((sum,p)=>sum+(p.lucro_realizado??0),0)
    const rois=sold.filter(p=>p.roi_realizado!=null).map(p=>p.roi_realizado!)
    return{stock:stock.length,sold:sold.length,invested,potential,profit,roi:rois.length?rois.reduce((a,b)=>a+b,0)/rois.length:0}
  },[purchases])

  const sorted=useMemo(()=>purchases.slice().sort((a,b)=>{if(a.status!==b.status)return a.status==='comprado'?-1:1;return new Date(b.data_compra).getTime()-new Date(a.data_compra).getTime()}),[purchases])

  return <div className="space-y-4 lg:space-y-5">
    <section className="purchase-hero relative overflow-hidden rounded-[28px] p-5 sm:p-7"><div className="purchase-hero__orb"/><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-emerald-300"><PackageCheck size={14}/> CARTEIRA DE COMPRAS</div><h2 className="font-display mt-3 text-[31px] font-extrabold leading-[1.02] tracking-[-.055em] sm:text-4xl">Seu dinheiro está onde?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Acompanhe custo total, capital preso, tempo em estoque, preço mínimo e lucro real.</p></div><button onClick={()=>setAdding(true)} className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 font-bold text-slate-950"><Plus size={17}/> Registrar compra</button></div></section>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MiniMetric icon={Boxes} label="Em estoque" value={String(stats.stock)} hint={money(stats.invested)+' de capital preso'}/>
      <MiniMetric icon={PackageCheck} label="Vendidos" value={String(stats.sold)} hint="negócios finalizados"/>
      <MiniMetric icon={BadgeDollarSign} label="Lucro real" value={money(stats.profit)} hint={'saída mínima da carteira '+money(stats.potential)}/>
      <MiniMetric icon={TrendingUp} label="ROI médio" value={pct(stats.roi)} hint="sobre custo total"/>
    </div>

    <div><div className="mb-3 flex items-end justify-between"><div><span className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">SEUS ITENS</span><h3 className="font-display mt-1 text-xl font-bold purchase-title">Compras registradas</h3></div><span className="text-[10px] text-slate-600">{purchases.length} {purchases.length===1?'item':'itens'}</span></div>
      {sorted.length?<div className="grid gap-3 xl:grid-cols-2">{sorted.map(item=><PurchaseCard key={item.id} item={item} onSell={setSelling} onManage={setManaging} alertDays={config.dias_alerta_estoque}/>)}</div>:<div className="glass rounded-[24px] p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-400"><PackageCheck size={21}/></span><h3 className="font-display mt-4 text-lg font-bold purchase-title">Nenhuma compra registrada</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">Quando fechar um negócio, registre preço e custos reais para acompanhar sua margem.</p><button onClick={()=>setAdding(true)} className="mt-5 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950">Registrar primeira compra</button></div>}
    </div>

    {adding&&<PurchaseFormModal analyses={analyses} purchases={purchases} config={config} onClose={()=>setAdding(false)} onCreate={onCreate}/>}
    {selling&&<SellModal item={selling} onClose={()=>setSelling(null)} onSold={onSold}/>}
    {managing&&<PurchaseManageModal item={managing} onClose={()=>setManaging(null)} onSave={onUpdate}/>}
  </div>
}

function MiniMetric({icon:Icon,label,value,hint}:{icon:any;label:string;value:string;hint:string}){return <div className="glass rounded-[20px] p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/[.08] text-emerald-400"><Icon size={17}/></span><span className="mt-4 block text-[10px] text-slate-500">{label}</span><strong className="font-display mt-1 block text-xl font-extrabold purchase-title">{value}</strong><small className="mt-1 block text-[9px] text-slate-600">{hint}</small></div>}
