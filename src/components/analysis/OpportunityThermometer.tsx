import { Flame,Snowflake,ThermometerSun } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import { money,pct } from '../../utils/format'
import { getOpportunityHeat } from '../../utils/opportunityHeat'

export function OpportunityThermometer({a}:{a:AnalysisResult}){
  const heat=getOpportunityHeat(a)
  const marker=Math.max(3,Math.min(97,heat.value))
  return <section className={'opportunity-thermometer heat-'+heat.key}>
    <div className="opportunity-thermometer__head">
      <div>
        <span className="premium-eyebrow">TEMPERATURA DA OPORTUNIDADE</span>
        <div className="opportunity-thermometer__verdict"><ThermometerSun size={20}/><strong>{heat.label}</strong><b>{heat.action}</b></div>
        <p>{heat.summary}</p>
      </div>
      <div className="opportunity-thermometer__score"><strong>{Math.round(heat.value)}</strong><span>/100</span></div>
    </div>

    <div className="heat-scale">
      <div className="heat-scale__labels"><span><Snowflake size={12}/> Fria</span><span>Morna</span><span>Quente <Flame size={12}/></span></div>
      <div className="heat-scale__track"><i style={{left:String(marker)+'%'}}><b/></i></div>
    </div>

    <div className="opportunity-thermometer__facts">
      <div><span>Preço pedido</span><strong>{money(a.precos.preco_anunciado)}</strong></div>
      <div><span>Oferta equilibrada</span><strong>{money(a.precos.oferta_equilibrada)}</strong></div>
      <div><span>Lucro provável</span><strong>{money(a.calculado.lucro_potencial)}</strong></div>
      <div><span>ROI projetado</span><strong>{pct(a.calculado.roi_percentual)}</strong></div>
    </div>
  </section>
}
