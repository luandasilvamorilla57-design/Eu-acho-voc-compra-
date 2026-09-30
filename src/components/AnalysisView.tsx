import type { AnalysisResult } from '../types/analysis'
import type { RadarConfigRow } from '../types/database'
import { AnalysisHero } from './analysis/AnalysisHero'
import { AnalysisMetrics } from './analysis/AnalysisMetrics'
import { RadarVerdictCard,type VerdictAction } from './analysis/RadarVerdictCard'
import { ProfitTargetCard } from './analysis/ProfitTargetCard'
import { ConfidencePanel } from './analysis/ConfidencePanel'
import { MarketPanel } from './analysis/MarketPanel'
import { RiskNegotiation } from './analysis/RiskNegotiation'
import { ChecklistSources } from './analysis/ChecklistSources'

export function AnalysisView({a,onDecision,decisionBusy,config}:{a:AnalysisResult;onDecision?:(action:VerdictAction)=>void;decisionBusy?:VerdictAction|null;config?:RadarConfigRow}){
  return <div className="space-y-4">
    <AnalysisHero a={a}/><AnalysisMetrics a={a}/><RadarVerdictCard a={a} onAction={onDecision} busy={decisionBusy} config={config}/><ProfitTargetCard a={a} config={config}/><ConfidencePanel a={a}/><MarketPanel a={a}/><RiskNegotiation a={a}/><ChecklistSources a={a}/>
  </div>
}
