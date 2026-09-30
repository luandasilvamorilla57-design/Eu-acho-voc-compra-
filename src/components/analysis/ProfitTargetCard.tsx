import { useEffect,useState } from 'react'
import { Calculator,CheckCircle2,WalletCards } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import type { RadarConfigRow } from '../../types/database'
import { money } from '../../utils/format'

export function ProfitTargetCard({a,config}:{a:AnalysisResult;config?:RadarConfigRow}){
  const [goal,setGoal]=useState(String(config?.lucro_minimo||150))
  useEffect(()=>setGoal(String(config?.lucro_minimo||150)),[config?.lucro_minimo])
  const desired=Math.max(0,Number(goal||0))
  const resale=a.precos.revenda_provavel||0
  const costs=a.precos.custos_estimados||0
  const ceiling=Math.max(0,resale-costs-desired)
  const suggested=Math.max(0,Math.min(ceiling,a.precos.oferta_equilibrada||ceiling))
  const fits=!config?.capital_disponivel||suggested<=config.capital_disponivel

  return <section className="glass rounded-[22px] p-5">
    <div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-bold tracking-[.18em] text-emerald-400">QUANTO POSSO PAGAR?</span><h3 className="font-display mt-1 text-lg font-bold operation-title">Comece pelo lucro que você quer.</h3></div><span className="operation-icon"><Calculator size={17}/></span></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
      <label className="operation-target"><span>Quero ganhar no mínimo</span><div><b>R$</b><input inputMode="decimal" value={goal} onChange={e=>setGoal(e.target.value.replace(',','.'))}/></div></label>
      <div className="operation-target-result"><span>Seu teto de compra</span><strong>{money(ceiling)}</strong><small>revenda provável − custos − sua meta</small></div>
      <div className="operation-target-result is-accent"><span>Oferta para começar</span><strong>{money(suggested)}</strong><small>{fits?<><CheckCircle2 size={10}/> cabe no seu capital</>:<><WalletCards size={10}/> acima do capital configurado</>}</small></div>
    </div>
  </section>
}
