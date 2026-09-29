import { CircleDollarSign,Search,ShoppingCart,TrendingUp } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { PerformancePanel } from '../components/dashboard/PerformancePanel'
import { TopOpportunity } from '../components/dashboard/TopOpportunity'
import { RecentList } from '../components/dashboard/RecentList'
import { useDashboardData } from '../hooks/useDashboardData'
import type { AnaliseRow,PurchaseRow } from '../types/database'
import { money,pct } from '../utils/format'

export function DashboardPage({items,purchases,onNew,onOpen}:{items:AnaliseRow[];purchases:PurchaseRow[];onNew:()=>void;onOpen:(a:AnaliseRow)=>void}){
  const s=useDashboardData(items,purchases)
  return <div className="space-y-4 lg:space-y-5">
    <DashboardHero onNew={onNew}/>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard icon={Search} label="Análises" value={String(items.length)} hint="oportunidades avaliadas"/>
      <MetricCard icon={ShoppingCart} label="Comprados" value={String(s.bought)} hint={`${s.sold} já vendidos`} tone="blue"/>
      <MetricCard icon={CircleDollarSign} label="Lucro realizado" value={money(s.profit)} hint="resultado confirmado"/>
      <MetricCard icon={TrendingUp} label="ROI médio" value={pct(s.roi)} hint="vendas concluídas" tone="amber"/>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.45fr_.75fr]">
      <PerformancePanel chart={s.chart}/>
      <TopOpportunity row={s.top} onOpen={onOpen}/>
    </div>
    <RecentList items={items} onOpen={onOpen}/>
  </div>
}
