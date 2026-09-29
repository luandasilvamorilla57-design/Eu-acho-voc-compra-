import type { AnalysisResult } from '../types/analysis'
import { AnalysisHero } from './analysis/AnalysisHero'
import { AnalysisMetrics } from './analysis/AnalysisMetrics'
import { MarketPanel } from './analysis/MarketPanel'
import { RiskNegotiation } from './analysis/RiskNegotiation'
import { ChecklistSources } from './analysis/ChecklistSources'
export function AnalysisView({a,onSave,saving=false}:{a:AnalysisResult;onSave?:()=>void;saving?:boolean}){return <div className="space-y-4"><AnalysisHero a={a}/><AnalysisMetrics a={a}/><MarketPanel a={a}/><RiskNegotiation a={a}/><ChecklistSources a={a}/>{onSave&&<button disabled={saving} onClick={onSave} className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 font-bold text-slate-950 disabled:opacity-50">{saving?'Salvando...':'Salvar análise no radar'}</button>}</div>}
