import type { AccountPlan } from '../types/database'

export function hasPhotoAssistant(plan:AccountPlan){
  return plan==='pro'||plan==='max'
}

export function planLabel(plan:AccountPlan){
  if(plan==='max')return 'BRIKE Max'
  if(plan==='pro')return 'BRIKE Pro'
  return 'BRIKE Start'
}
