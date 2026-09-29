import { useMemo } from 'react'
import type { AnaliseRow,PurchaseRow } from '../types/database'
import { dateBR } from '../utils/format'

export function useDashboardData(items:AnaliseRow[],purchases:PurchaseRow[]){
  return useMemo(()=>{
    const bought=purchases.length
    const sold=purchases.filter(i=>i.status==='vendido').length
    const profit=purchases.reduce((x,i)=>x+(i.lucro_realizado??0),0)
    const rs=purchases.filter(i=>i.status==='vendido'&&i.roi_realizado!=null).map(i=>i.roi_realizado!)
    const roi=rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:0

    const soldByDate=purchases
      .filter(i=>i.status==='vendido'&&i.data_venda)
      .slice()
      .sort((a,b)=>new Date(a.data_venda!).getTime()-new Date(b.data_venda!).getTime())

    let running=0
    const chart=soldByDate.map(i=>{
      running+=i.lucro_realizado??0
      return {d:dateBR(i.data_venda!),lucro:running}
    })

    const top=items.slice().sort((x,y)=>((y.analise_ia as any)?.calculado?.score_oportunidade??0)-((x.analise_ia as any)?.calculado?.score_oportunidade??0))[0]
    return{bought,sold,profit,roi,chart,top}
  },[items,purchases])
}
