import { CircleDollarSign,Search,ShoppingCart,TrendingUp } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { PerformancePanel } from '../components/dashboard/PerformancePanel'
import { TopOpportunity } from '../components/dashboard/TopOpportunity'
import { RecentList } from '../components/dashboard/RecentList'
import { StrategyPanel } from '../components/dashboard/StrategyPanel'
import { OpportunityCompare } from '../components/dashboard/OpportunityCompare'
import { FinancialPeriodPanel } from '../components/dashboard/FinancialPeriodPanel'
import { useDashboardData } from '../hooks/useDashboardData'
import type { AnaliseRow,PurchaseRow,RadarConfigRow } from '../types/database'
import { money,pct } from '../utils/format'

type ConfigPatch=Partial<Pick<RadarConfigRow,'capital_disponivel'|'lucro_minimo'|'lucro_minimo_modo'|'lucro_minimo_percentual'|'roi_minimo'|'dias_alerta_estoque'>>

export function DashboardPage({items,purchases,config,onSaveConfig,onNew,onOpen}:{items:AnaliseRow[];purchases:PurchaseRow[];config:RadarConfigRow;onSaveConfig:(patch:ConfigPatch)=>Promise<void>;onNew:()=>void;onOpen:(a:AnaliseRow)=>void}){
  const s=useDashboardData(items,purchases)
  const available=config.capital_disponivel>0?Math.max(0,config.capital_disponivel-s.invested):0
  return <div className="space-y-4 lg:space-y-5">
    <DashboardHero onNew={onNew}/>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard icon={Search} label="Análises" value={String(items.length)} hint="oportunidades avaliadas"/>
      <MetricCard icon={ShoppingCart} label="Comprados" value={String(s.bought)} hint={String(s.sold)+' já vendidos'} tone="blue"/>
      <MetricCard icon={CircleDollarSign} label="Lucro realizado" value={money(s.profit)} hint={'capital em estoque '+money(s.invested)}/>
      <MetricCard icon={TrendingUp} label="ROI médio" value={pct(s.roi)} hint={config.capital_disponivel>0?'caixa livre '+money(available):'vendas concluídas'} tone="amber"/>
    </div>
    <StrategyPanel config={config} onSave={onSaveConfig}/>
    <FinancialPeriodPanel purchases={purchases}/>
    <OpportunityCompare items={items} config={config} onOpen={onOpen}/>
    <div className="grid gap-4 xl:grid-cols-[1.45fr_.75fr]"><PerformancePanel chart={s.chart}/><TopOpportunity row={s.top} onOpen={onOpen}/></div>
    <RecentList items={items} onOpen={onOpen}/>
  </div>
}
