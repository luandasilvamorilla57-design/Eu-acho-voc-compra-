import { describe,expect,it } from 'vitest'
import { inventoryHealth } from './radarAlerts'
import type { PurchaseRow } from '../types/database'

const item={status:'comprado',situacao_estoque:'em_estoque',data_compra:new Date(Date.now()-20*86400000).toISOString(),data_reserva:null} as PurchaseRow

describe('inventory health',()=>{
  it('flags stale stock',()=>{expect(inventoryHealth(item,14).key).toBe('stuck')})
  it('recognizes sold stock',()=>{expect(inventoryHealth({...item,status:'vendido',situacao_estoque:'vendido'},14).key).toBe('sold')})
})
