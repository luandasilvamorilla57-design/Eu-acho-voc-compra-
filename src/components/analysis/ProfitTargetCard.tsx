import { Calculator,ShieldCheck,TrendingDown,TrendingUp } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import { money } from '../../utils/format'

export function ProfitTargetCard({a}:{a:AnalysisResult}){
  const sell=a.revenda?.preco_fechamento_alvo??a.precos.revenda_provavel
  return <section className="glass profit-target-card rounded-[24px] p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><span className="premium-eyebrow text-emerald-400">FAIXA DE COMPRA</span><h3 className="font-display mt-1.5 text-xl font-bold operation-title">Negocie baixo sem matar o negócio.</h3><p className="mt-2 text-[12px] leading-5 text-slate-500">Abertura, valor-alvo e teto são separados para você ter espaço de negociação e preservar margem na revenda.</p></div><span className="operation-icon"><Calculator size={18}/></span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-4">
      <div className="operation-target-result"><span>Abrir em</span><strong>{money(a.precos.oferta_agressiva)}</strong><small><TrendingDown size={11}/> primeira âncora</small></div>
      <div className="operation-target-result is-accent"><span>Tentar fechar</span><strong>{money(a.precos.oferta_equilibrada)}</strong><small><ShieldCheck size={11}/> compra-alvo</small></div>
      <div className="operation-target-result"><span>Não passar de</span><strong>{money(a.precos.teto_compra)}</strong><small><ShieldCheck size={11}/> teto absoluto</small></div>
      <div className="operation-target-result"><span>Revenda provável</span><strong>{money(sell)}</strong><small><TrendingUp size={11}/> após preparação</small></div>
    </div>
  </section>
}
