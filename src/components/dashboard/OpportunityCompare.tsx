import { ArrowUpRight,Scale } from 'lucide-react'
import type { AnaliseRow,RadarConfigRow } from '../../types/database'
import type { AnalysisResult } from '../../types/analysis'
import { money,pct } from '../../utils/format'

export function OpportunityCompare({items,config,onOpen}:{items:AnaliseRow[];config:RadarConfigRow;onOpen:(a:AnaliseRow)=>void}){
  const active=items.filter(i=>!['descartado','negociacao_falhou','comprado','vendido'].includes(i.pipeline_status))
    .slice().sort((a,b)=>score(b)-score(a)).slice(0,3)
  if(active.length<2)return null

  return <section className="glass rounded-[24px] p-5">
    <div className="flex items-start justify-between"><div><span className="text-[9px] font-bold tracking-[.18em] text-blue-400">COMPARAR OPORTUNIDADES</span><h3 className="font-display mt-1 text-lg font-bold operation-title">Onde colocar o dinheiro primeiro?</h3></div><span className="operation-icon operation-icon--blue"><Scale size={17}/></span></div>
    <div className="mt-4 grid gap-2 lg:grid-cols-3">
      {active.map((row,index)=>{
        const a=row.analise_ia as unknown as AnalysisResult
        const required=a.precos.oferta_equilibrada||row.oferta_recomendada||row.preco_anunciado
        const targetCeiling=Math.max(0,(a.precos.revenda_provavel||0)-(a.precos.custos_estimados||0)-(config.lucro_minimo||0))
        const fits=!config.capital_disponivel||required<=config.capital_disponivel
        return <button key={row.id} onClick={()=>onOpen(row)} className="opportunity-compare text-left">
          <div className="flex items-center justify-between"><span className="opportunity-rank">#{index+1}</span><span className={fits?'text-emerald-400':'text-amber-400'}>{fits?'Cabe no caixa':'Acima do caixa'}</span></div>
          <strong className="mt-3 block truncate text-sm operation-title">{row.titulo_anuncio}</strong>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] text-slate-500"><span>Score <b>{a.calculado.score_oportunidade}</b></span><span>ROI <b>{pct(a.calculado.roi_percentual)}</b></span><span>Entrada <b>{money(required)}</b></span><span>Teto p/ meta <b>{money(targetCeiling)}</b></span></div>
          <span className="mt-3 flex items-center gap-1 text-[9px] text-blue-400">Abrir análise <ArrowUpRight size={11}/></span>
        </button>
      })}
    </div>
  </section>
}
function score(row:AnaliseRow){return Number((row.analise_ia as any)?.calculado?.score_oportunidade??0)}
