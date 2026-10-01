import { ArrowUpRight,Scale } from 'lucide-react'
import type { AnaliseRow,RadarConfigRow } from '../../types/database'
import type { AnalysisResult } from '../../types/analysis'
import { money,pct } from '../../utils/format'

export function OpportunityCompare({items,config,onOpen}:{items:AnaliseRow[];config:RadarConfigRow;onOpen:(a:AnaliseRow)=>void}){
  const active=items.filter(i=>!['descartado','negociacao_falhou','comprado','vendido'].includes(i.pipeline_status))
    .slice().sort((a,b)=>score(b)-score(a)).slice(0,3)
  if(active.length<2)return null

  return <section className="glass premium-panel rounded-[26px] p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div><span className="premium-eyebrow text-blue-400">COMPARAR OPORTUNIDADES</span><h3 className="font-display mt-1.5 text-xl font-bold operation-title">Onde colocar o dinheiro primeiro?</h3><p className="mt-2 text-[12px] leading-5 text-slate-500">Compare retorno, entrada necessária e aderência ao seu caixa antes de imobilizar capital.</p></div>
      <span className="operation-icon operation-icon--blue"><Scale size={18}/></span>
    </div>
    <div className="mt-5 grid gap-3 lg:grid-cols-3">
      {active.map((row,index)=>{
        const a=row.analise_ia as unknown as AnalysisResult
        const required=a.precos.oferta_equilibrada||row.oferta_recomendada||row.preco_anunciado
        const radarCeiling=a.precos.teto_compra||a.precos.oferta_equilibrada||required
        const fits=!config.capital_disponivel||required<=config.capital_disponivel
        return <button key={row.id} onClick={()=>onOpen(row)} className="opportunity-compare text-left">
          <div className="flex items-center justify-between gap-3"><span className="opportunity-rank">#{index+1}</span><span className={'opportunity-fit '+(fits?'is-good':'is-warn')}>{fits?'Cabe no caixa':'Negocie p/ caber'}</span></div>
          <strong className="mt-4 block truncate text-[15px] operation-title">{row.titulo_anuncio}</strong>
          <div className="opportunity-stats mt-4">
            <span><small>Score</small><b>{a.calculado.score_oportunidade}</b></span>
            <span><small>ROI</small><b>{pct(a.calculado.roi_percentual)}</b></span>
            <span><small>Entrada</small><b>{money(required)}</b></span>
            <span><small>Teto Radar</small><b>{money(radarCeiling)}</b></span>
          </div>
          <span className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">Abrir análise <ArrowUpRight size={13}/></span>
        </button>
      })}
    </div>
  </section>
}
function score(row:AnaliseRow){return Number((row.analise_ia as any)?.calculado?.score_oportunidade??0)}
