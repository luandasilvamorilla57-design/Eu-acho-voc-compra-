import { Calculator,ShieldCheck,TrendingUp } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import { money } from '../../utils/format'

export function ProfitTargetCard({a}:{a:AnalysisResult}){
  const resale=Math.max(0,a.precos.revenda_provavel||0)
  const costs=Math.max(0,a.precos.custos_estimados||0)
  const ceiling=Math.max(0,a.precos.teto_compra||a.precos.oferta_equilibrada||0)
  const suggested=Math.max(0,Math.min(ceiling||Infinity,a.precos.oferta_equilibrada||ceiling||0))

  return <section className="glass profit-target-card rounded-[24px] p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="premium-eyebrow text-emerald-400">FAIXA DE COMPRA</span>
        <h3 className="font-display mt-1.5 text-xl font-bold operation-title">Até quanto ainda faz sentido negociar?</h3>
        <p className="mt-2 text-[12px] leading-5 text-slate-500">O teto abaixo vem da análise do anúncio, do produto, dos riscos e do mercado. Nenhuma meta fixa de lucro do usuário reduz ou invalida a oportunidade.</p>
      </div>
      <span className="operation-icon"><Calculator size={18}/></span>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="operation-target-result"><span>Revenda provável</span><strong>{money(resale)}</strong><small><TrendingUp size={11}/> referência da própria análise</small></div>
      <div className="operation-target-result"><span>Teto da análise</span><strong>{money(ceiling)}</strong><small><ShieldCheck size={11}/> limite calculado para este anúncio</small></div>
      <div className="operation-target-result is-accent"><span>Oferta equilibrada</span><strong>{money(suggested)}</strong><small>{costs>0?'custos estimados: '+money(costs):'ajuste conforme condição e negociação'}</small></div>
    </div>
  </section>
}
