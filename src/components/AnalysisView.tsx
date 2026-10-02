import type { AnalysisResult } from '../types/analysis'
import type { PurchaseRow,RadarConfigRow } from '../types/database'
import { AnalysisHero } from './analysis/AnalysisHero'
import { OpportunityThermometer } from './analysis/OpportunityThermometer'
import { AnalysisMetrics } from './analysis/AnalysisMetrics'
import { RadarVerdictCard,type VerdictAction } from './analysis/RadarVerdictCard'
import { ProfitTargetCard } from './analysis/ProfitTargetCard'
import { ConfidencePanel } from './analysis/ConfidencePanel'
import { HistoricalBenchmark } from './analysis/HistoricalBenchmark'
import { MarketPanel } from './analysis/MarketPanel'
import { RiskNegotiation } from './analysis/RiskNegotiation'
import { ChecklistSources } from './analysis/ChecklistSources'

export function AnalysisView({a,onDecision,decisionBusy,config,purchases=[]}:{a:AnalysisResult;onDecision?:(action:VerdictAction)=>void;decisionBusy?:VerdictAction|null;config?:RadarConfigRow;purchases?:PurchaseRow[]}){
  return <div className="space-y-4">
    <AnalysisHero a={a}/>
    <OpportunityThermometer a={a}/>
    <AnalysisMetrics a={a}/>
    <RadarVerdictCard a={a} onAction={onDecision} busy={decisionBusy} config={config}/>
    <ProfitTargetCard a={a}/>
    <ConfidencePanel a={a}/>
    <HistoricalBenchmark a={a} purchases={purchases}/>
    <MarketPanel a={a}/>
    <RiskNegotiation a={a}/>
    <ChecklistSources a={a}/>
  </div>
}
