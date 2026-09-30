import type { AccountPlan,RadarConfigRow } from '../types/database'

export function hasUnlimitedAccess(config:Pick<RadarConfigRow,'acesso_total'>){
  return config.acesso_total===true
}

export function hasPhotoAssistant(plan:AccountPlan,fullAccess=false){
  return fullAccess||plan==='pro'||plan==='max'
}

export function planLabel(plan:AccountPlan,fullAccess=false){
  if(fullAccess)return 'Conta proprietária'
  if(plan==='max')return 'BRIKE Max'
  if(plan==='pro')return 'BRIKE Pro'
  return 'BRIKE Start'
}
