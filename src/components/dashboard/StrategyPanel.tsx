import { useEffect,useState } from 'react'
import { Banknote,Percent,PiggyBank,Save,Target,TimerReset,TrendingUp } from 'lucide-react'
import type { ProfitGoalMode,RadarConfigRow } from '../../types/database'
import { money,pct } from '../../utils/format'
import { profitGoalLabel } from '../../utils/strategy'

type ConfigPatch=Partial<Pick<RadarConfigRow,'capital_disponivel'|'lucro_minimo'|'lucro_minimo_modo'|'lucro_minimo_percentual'|'roi_minimo'|'dias_alerta_estoque'>>

export function StrategyPanel({config,onSave}:{config:RadarConfigRow;onSave:(patch:ConfigPatch)=>Promise<void>}){
  const [capital,setCapital]=useState(String(config.capital_disponivel||''))
  const [profitValue,setProfitValue]=useState(String(config.lucro_minimo||150))
  const [profitPercent,setProfitPercent]=useState(String(config.lucro_minimo_percentual||20))
  const [profitMode,setProfitMode]=useState<ProfitGoalMode>(config.lucro_minimo_modo||'valor')
  const [roi,setRoi]=useState(String(config.roi_minimo||25))
  const [days,setDays]=useState(String(config.dias_alerta_estoque||14))
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)

  useEffect(()=>{
    setCapital(String(config.capital_disponivel||''))
    setProfitValue(String(config.lucro_minimo||150))
    setProfitPercent(String(config.lucro_minimo_percentual||20))
    setProfitMode(config.lucro_minimo_modo||'valor')
    setRoi(String(config.roi_minimo||25))
    setDays(String(config.dias_alerta_estoque||14))
  },[config])

  const save=async()=>{
    setSaving(true);setSaved(false)
    await onSave({
      capital_disponivel:Number(capital||0),
      lucro_minimo:Number(profitValue||0),
      lucro_minimo_modo:profitMode,
      lucro_minimo_percentual:Math.min(95,Math.max(0,Number(profitPercent||0))),
      roi_minimo:Number(roi||0),
      dias_alerta_estoque:Math.max(1,Number(days||14))
    })
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),1600)
  }

  const preview:RadarConfigRow={...config,capital_disponivel:Number(capital||0),lucro_minimo:Number(profitValue||0),lucro_minimo_modo:profitMode,lucro_minimo_percentual:Number(profitPercent||0),roi_minimo:Number(roi||0),dias_alerta_estoque:Number(days||14)}
  const hint=Number(capital)>0
    ?'Caixa '+money(Number(capital))+' · lucro mínimo '+profitGoalLabel(preview)+' · ROI '+pct(Number(roi||0))
    :'Defina seu caixa e sua meta. O Radar passa a filtrar negócios que realmente cabem na sua estratégia.'

  return <section className="strategy-card">
    <div className="strategy-card__top">
      <div>
        <span className="strategy-eyebrow">SUA ESTRATÉGIA</span>
        <h3 className="font-display strategy-title">Regras do seu brique</h3>
        <p className="strategy-description">Personalize o Radar para analisar oportunidades com base no seu dinheiro, margem e velocidade de giro.</p>
      </div>
      <span className="strategy-target"><Target size={19}/></span>
    </div>

    <div className="strategy-grid">
      <Field icon={PiggyBank} label="Capital disponível" helper="Quanto você pode colocar em estoque" prefix="R$" value={capital} onChange={setCapital}/>

      <div className="strategy-field strategy-field--profit">
        <div className="strategy-field__head">
          <span><Target size={14}/>Lucro mínimo</span>
          <div className="profit-mode" aria-label="Tipo de meta de lucro">
            <button type="button" onClick={()=>setProfitMode('valor')} className={profitMode==='valor'?'is-active':''}><Banknote size={12}/> R$</button>
            <button type="button" onClick={()=>setProfitMode('percentual')} className={profitMode==='percentual'?'is-active':''}><Percent size={12}/> %</button>
          </div>
        </div>
        <small>{profitMode==='valor'?'Valor líquido que você quer ganhar por negócio':'Margem mínima sobre o preço de revenda'}</small>
        <div className="strategy-field__input">
          <b>{profitMode==='valor'?'R$':'%'}</b>
          <input inputMode="decimal" value={profitMode==='valor'?profitValue:profitPercent} onChange={e=>profitMode==='valor'?setProfitValue(e.target.value.replace(',','.')):setProfitPercent(e.target.value.replace(',','.'))}/>
        </div>
      </div>

      <Field icon={TrendingUp} label="ROI mínimo" helper="Retorno mínimo sobre o dinheiro investido" suffix="%" value={roi} onChange={setRoi}/>
      <Field icon={TimerReset} label="Alerta de estoque" helper="Avise quando o produto ficar parado" suffix="dias" value={days} onChange={setDays}/>
    </div>

    <div className="strategy-footer">
      <p>{hint}</p>
      <button onClick={save} disabled={saving} className="strategy-save"><Save size={15}/>{saving?'Salvando...':saved?'Estratégia salva':'Salvar estratégia'}</button>
    </div>
  </section>
}

function Field({icon:Icon,label,helper,prefix,suffix,value,onChange}:{icon:any;label:string;helper:string;prefix?:string;suffix?:string;value:string;onChange:(v:string)=>void}){
  return <label className="strategy-field">
    <span className="strategy-field__label"><Icon size={14}/>{label}</span>
    <small>{helper}</small>
    <div className="strategy-field__input">{prefix&&<b>{prefix}</b>}<input inputMode="decimal" value={value} onChange={e=>onChange(e.target.value.replace(',','.'))}/>{suffix&&<b>{suffix}</b>}</div>
  </label>
}
