import { useMemo,useState } from 'react'
import { CalendarRange,ReceiptText,TrendingUp,WalletCards } from 'lucide-react'
import type { PurchaseRow } from '../../types/database'
import { money,pct } from '../../utils/format'
import { purchaseTotalCost } from '../../utils/purchase'

type Period='30'|'90'|'all'
export function FinancialPeriodPanel({purchases}:{purchases:PurchaseRow[]}){
  const [period,setPeriod]=useState<Period>('30')
  const stats=useMemo(()=>{
    const cutoff=period==='all'?0:Date.now()-Number(period)*86400000
    const inPeriod=(iso:string|null)=>!!iso&&(cutoff===0||new Date(iso).getTime()>=cutoff)
    const bought=purchases.filter(p=>inPeriod(p.data_compra))
    const sold=purchases.filter(p=>p.status==='vendido'&&inPeriod(p.data_venda))
    const revenue=sold.reduce((s,p)=>s+Number(p.preco_venda??0),0)
    const profit=sold.reduce((s,p)=>s+Number(p.lucro_realizado??0),0)
    const invested=bought.reduce((s,p)=>s+purchaseTotalCost(p),0)
    const rois=sold.filter(p=>p.roi_realizado!=null).map(p=>Number(p.roi_realizado))
    const roi=rois.length?rois.reduce((a,b)=>a+b,0)/rois.length:0
    const cat=new Map<string,{sales:number;profit:number}>()
    sold.forEach(p=>{const k=p.categoria||'Outros';const v=cat.get(k)||{sales:0,profit:0};v.sales++;v.profit+=Number(p.lucro_realizado??0);cat.set(k,v)})
    const categories=[...cat.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.profit-a.profit).slice(0,4)
    return{bought:bought.length,sold:sold.length,revenue,profit,invested,roi,categories}
  },[purchases,period])

  return <section className="glass finance-panel rounded-[26px] p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><span className="premium-eyebrow text-emerald-400">FINANCEIRO POR PERÍODO</span><h3 className="font-display mt-1.5 text-xl font-bold operation-title">O que realmente entrou e saiu.</h3><p className="mt-2 text-[12px] text-slate-500">Compras, faturamento e lucro calculados pelas datas reais do seu histórico.</p></div>
      <div className="period-switch">{([['30','30 dias'],['90','90 dias'],['all','Tudo']] as const).map(([id,label])=><button key={id} onClick={()=>setPeriod(id)} className={period===id?'is-active':''}>{label}</button>)}</div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
      <Metric icon={WalletCards} label="Compras no período" value={String(stats.bought)} hint={money(stats.invested)+' investidos'}/>
      <Metric icon={ReceiptText} label="Vendas concluídas" value={String(stats.sold)} hint={money(stats.revenue)+' faturados'}/>
      <Metric icon={TrendingUp} label="Lucro líquido" value={money(stats.profit)} hint={'ROI médio '+pct(stats.roi)} accent/>
      <Metric icon={CalendarRange} label="Resultado por venda" value={stats.sold?money(stats.profit/stats.sold):money(0)} hint="lucro médio realizado"/>
    </div>
    {stats.categories.length>0&&<div className="mt-4 finance-categories"><span>Lucro por categoria</span>{stats.categories.map(c=><div key={c.name}><b>{c.name}</b><small>{c.sales} venda(s)</small><strong>{money(c.profit)}</strong></div>)}</div>}
  </section>
}
function Metric({icon:Icon,label,value,hint,accent=false}:{icon:any;label:string;value:string;hint:string;accent?:boolean}){return <div className="finance-metric"><Icon size={16}/><span>{label}</span><strong className={accent?'text-emerald-400':''}>{value}</strong><small>{hint}</small></div>}
