import { describe,expect,it } from 'vitest'
import { getOpportunityHeat } from './opportunityHeat'
import type { AnalysisResult } from '../types/analysis'

const base={risco_score:20,confianca_geral:85,calculado:{score_oportunidade:85}} as AnalysisResult

describe('opportunity thermometer',()=>{
  it('marks high-score deals as very hot',()=>expect(getOpportunityHeat(base).key).toBe('fervendo'))
  it('marks weak deals as cold',()=>expect(getOpportunityHeat({...base,calculado:{...base.calculado,score_oportunidade:28}}).key).toBe('gelada'))
})
