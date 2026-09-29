import type { AnalysisResult } from '../types/analysis'
import { AnalysisHero } from './analysis/AnalysisHero'
import { AnalysisMetrics } from './analysis/AnalysisMetrics'
import { RadarVerdictCard,type VerdictAction } from './analysis/RadarVerdictCard'
import { MarketPanel } from './analysis/MarketPanel'
import { RiskNegotiation } from './analysis/RiskNegotiation'
import { ChecklistSources } from './analysis/ChecklistSources'

export function AnalysisView({
  a,onDecision,decisionBusy
}:{
  a:AnalysisResult
  onDecision?:(action:VerdictAction)=>void
  decisionBusy?:VerdictAction|null
}){
  return <div className="space-y-4">
    <AnalysisHero a={a}/>
    <AnalysisMetrics a={a}/>
    <RadarVerdictCard a={a} onAction={onDecision} busy={decisionBusy}/>
    <MarketPanel a={a}/>
    <RiskNegotiation a={a}/>
    <ChecklistSources a={a}/>
  </div>
}
