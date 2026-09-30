import { describe,expect,it } from 'vitest'
import { desiredProfitAmount,minimumSalePrice,targetCeiling } from './strategy'
import type { RadarConfigRow } from '../types/database'

const base:RadarConfigRow={user_id:'u',capital_disponivel:1000,lucro_minimo:150,lucro_minimo_modo:'valor',lucro_minimo_percentual:20,roi_minimo:25,dias_alerta_estoque:14,data_atualizacao:''}

describe('strategy math',()=>{
  it('respects fixed profit goal',()=>{expect(desiredProfitAmount(base,1000)).toBe(150);expect(targetCeiling(base,1000,50)).toBe(800);expect(minimumSalePrice(base,500)).toBe(650)})
  it('respects percentage margin goal',()=>{const c={...base,lucro_minimo_modo:'percentual' as const};expect(desiredProfitAmount(c,1000)).toBe(200);expect(targetCeiling(c,1000,50)).toBe(750);expect(minimumSalePrice(c,800)).toBe(1000)})
})
