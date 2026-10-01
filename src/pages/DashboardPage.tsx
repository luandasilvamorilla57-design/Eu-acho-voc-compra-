import { CircleDollarSign,Search,ShoppingCart,TrendingUp } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { PerformancePanel } from '../components/dashboard/PerformancePanel'
import { TopOpportunity } from '../components/dashboard/TopOpportunity'
import { RecentList } from '../components/dashboard/RecentList'
import { StrategyPanel } from '../components/dashboard/StrategyPanel'
import { OpportunityCompare } from '../components/dashboard/OpportunityCompare'
import { FinancialPeriodPanel } from '../components/dashboard/FinancialPeriodPanel'
import { UsagePanel } from '../components/dashboard/UsagePanel'
import { useDashboardData } from '../hooks/useDashboardData'
import type { AccessStatus } from '../hooks/usePlanAccess'
import type { AnaliseRow,PurchaseRow,RadarConfigRow,ResaleDraftRow } from '../types/database'
import { money,pct } from '../utils/format'
import type { RadarConfigPatch } from '../hooks/useRadarConfig'

export function DashboardPage({items,purchases,drafts,config,access,onSaveConfig,onManagePlan,onNew,onOpen}:{items:AnaliseRow[];purchases:PurchaseRow[];drafts:ResaleDraftRow[];config:RadarConfigRow;access:AccessStatus;onSaveConfig:(patch:RadarConfigPatch)=>Promise<void>;onManagePlan:()=>void;onNew:()=>void;onOpen:(a:AnaliseRow)=>void}){
  const s=useDashboardData(items,purchases,drafts)
  const available=config.capital_disponivel>0?Math.max(0,config.capital_disponivel+s.profit+s.externalSaleProceeds-s.invested):0
  const externalHint=s.externalSaleProceeds>0?' · desapegos '+money(s.externalSaleProceeds):''
  return <div className="space-y-4 lg:space-y-5">
    <DashboardHero onNew={onNew}/>
    <UsagePanel status={access} onManage={onManagePlan}/>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard icon={Search} label="Análises" value={String(items.length)} hint="oportunidades avaliadas"/>
      <MetricCard icon={ShoppingCart} label="Comprados" value={String(s.bought)} hint={String(s.sold)+' já vendidos'} tone="blue"/>
      <MetricCard icon={CircleDollarSign} label="Lucro realizado" value={money(s.profit)} hint={'capital em estoque '+money(s.invested)+externalHint}/>
      <MetricCard icon={TrendingUp} label="ROI médio" value={pct(s.roi)} hint={config.capital_disponivel>0?'caixa livre '+money(available):s.externalSaleProceeds>0?'entradas externas '+money(s.externalSaleProceeds):'vendas concluídas'} tone="amber"/>
    </div>
    <StrategyPanel config={config} onSave={onSaveConfig} onAnalyze={onNew}/>
    <FinancialPeriodPanel purchases={purchases}/>
    <OpportunityCompare items={items} config={config} onOpen={onOpen}/>
    <div className="grid gap-4 xl:grid-cols-[1.45fr_.75fr]"><PerformancePanel chart={s.chart}/><TopOpportunity row={s.top} onOpen={onOpen}/></div>
    <RecentList items={items} onOpen={onOpen}/>
  </div>
}
