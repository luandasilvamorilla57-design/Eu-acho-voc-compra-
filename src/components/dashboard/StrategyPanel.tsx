import { useEffect,useState } from 'react'
import { PiggyBank,Save,Target,TimerReset,TrendingUp } from 'lucide-react'
import type { RadarConfigRow } from '../../types/database'
import { money,pct } from '../../utils/format'

type ConfigPatch=Partial<Pick<RadarConfigRow,'capital_disponivel'|'lucro_minimo'|'roi_minimo'|'dias_alerta_estoque'>>

export function StrategyPanel({config,onSave}:{config:RadarConfigRow;onSave:(patch:ConfigPatch)=>Promise<void>}){
  const [capital,setCapital]=useState(String(config.capital_disponivel||''))
  const [profit,setProfit]=useState(String(config.lucro_minimo||150))
  const [roi,setRoi]=useState(String(config.roi_minimo||25))
  const [days,setDays]=useState(String(config.dias_alerta_estoque||14))
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  useEffect(()=>{setCapital(String(config.capital_disponivel||''));setProfit(String(config.lucro_minimo||150));setRoi(String(config.roi_minimo||25));setDays(String(config.dias_alerta_estoque||14))},[config])
  const save=async()=>{setSaving(true);setSaved(false);await onSave({capital_disponivel:Number(capital||0),lucro_minimo:Number(profit||0),roi_minimo:Number(roi||0),dias_alerta_estoque:Math.max(1,Number(days||14))});setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),1600)}
  const hint=config.capital_disponivel>0?'Capital configurado: '+money(config.capital_disponivel)+' · meta '+money(config.lucro_minimo)+' / '+pct(config.roi_minimo):'Defina seu capital para o Radar mostrar quais oportunidades cabem no caixa.'
  return <section className="glass rounded-[24px] p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-bold tracking-[.18em] text-emerald-400">SUA ESTRATÉGIA</span><h3 className="font-display mt-1 text-lg font-bold operation-title">Regras do seu brique</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">O Radar usa estes limites para contextualizar oportunidades e estoque.</p></div><span className="operation-icon"><Target size={17}/></span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Field icon={PiggyBank} label="Capital disponível" prefix="R$" value={capital} onChange={setCapital}/><Field icon={Target} label="Lucro mínimo" prefix="R$" value={profit} onChange={setProfit}/><Field icon={TrendingUp} label="ROI mínimo" suffix="%" value={roi} onChange={setRoi}/><Field icon={TimerReset} label="Alerta de estoque" suffix=" dias" value={days} onChange={setDays}/></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-[10px] text-slate-600">{hint}</p><button onClick={save} disabled={saving} className="operation-save"><Save size={14}/>{saving?'Salvando...':saved?'Salvo':'Salvar'}</button></div></section>
}
function Field({icon:Icon,label,prefix,suffix,value,onChange}:{icon:any;label:string;prefix?:string;suffix?:string;value:string;onChange:(v:string)=>void}){return <label className="operation-field"><span><Icon size={12}/>{label}</span><div>{prefix&&<b>{prefix}</b>}<input inputMode="decimal" value={value} onChange={e=>onChange(e.target.value.replace(',','.'))}/>{suffix&&<b>{suffix}</b>}</div></label>}
