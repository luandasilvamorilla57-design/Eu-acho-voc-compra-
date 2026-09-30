import type { RadarConfigRow } from '../types/database'
import { money,pct } from './format'

export type ProfitGoalMode='valor'|'percentual'

export function profitGoalMode(config?:RadarConfigRow):ProfitGoalMode{
  return config?.lucro_minimo_modo==='percentual'?'percentual':'valor'
}

export function profitGoalPercent(config?:RadarConfigRow){
  return Math.max(0,Math.min(95,Number(config?.lucro_minimo_percentual??20)))
}

export function desiredProfitAmount(config:RadarConfigRow|undefined,resale:number){
  if(profitGoalMode(config)==='percentual')return Math.max(0,resale)*profitGoalPercent(config)/100
  return Math.max(0,Number(config?.lucro_minimo??150))
}

export function targetCeiling(config:RadarConfigRow|undefined,resale:number,costs:number){
  return Math.max(0,resale-costs-desiredProfitAmount(config,resale))
}

export function minimumSalePrice(config:RadarConfigRow|undefined,totalCost:number){
  if(profitGoalMode(config)==='percentual'){
    const margin=profitGoalPercent(config)/100
    return margin>=.95?totalCost:Math.max(totalCost,totalCost/(1-margin))
  }
  return totalCost+Math.max(0,Number(config?.lucro_minimo??150))
}

export function profitGoalLabel(config?:RadarConfigRow){
  return profitGoalMode(config)==='percentual'
    ? pct(profitGoalPercent(config))
    : money(config?.lucro_minimo??150)
}
