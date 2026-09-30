import { Calculator,CheckCircle2,WalletCards } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import type { RadarConfigRow } from '../../types/database'
import { money } from '../../utils/format'
import { profitGoalLabel,targetCeiling } from '../../utils/strategy'

export function ProfitTargetCard({a,config}:{a:AnalysisResult;config?:RadarConfigRow}){
  const resale=a.precos.revenda_provavel||0
  const costs=a.precos.custos_estimados||0
  const ceiling=targetCeiling(config,resale,costs)
  const suggested=Math.max(0,Math.min(ceiling,a.precos.oferta_equilibrada||ceiling))
  const fits=!config?.capital_disponivel||suggested<=config.capital_disponivel

  return <section className="glass profit-target-card rounded-[24px] p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="premium-eyebrow text-emerald-400">QUANTO POSSO PAGAR?</span>
        <h3 className="font-display mt-1.5 text-xl font-bold operation-title">Comece pelo lucro que você quer.</h3>
        <p className="mt-2 text-[12px] leading-5 text-slate-500">Meta atual: <b className="text-slate-300">{profitGoalLabel(config)}</b>. O teto abaixo preserva essa margem.</p>
      </div>
      <span className="operation-icon"><Calculator size={18}/></span>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="operation-target-result"><span>Revenda provável</span><strong>{money(resale)}</strong><small>referência usada no cálculo</small></div>
      <div className="operation-target-result"><span>Seu teto de compra</span><strong>{money(ceiling)}</strong><small>já descontando custos e sua meta</small></div>
      <div className="operation-target-result is-accent"><span>Oferta para começar</span><strong>{money(suggested)}</strong><small>{fits?<><CheckCircle2 size={11}/> cabe no capital configurado</>:<><WalletCards size={11}/> acima do capital configurado</>}</small></div>
    </div>
  </section>
}
