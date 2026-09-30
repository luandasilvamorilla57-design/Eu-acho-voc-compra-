import type { LucideIcon } from 'lucide-react'

export function MetricCard({icon:Icon,label,value,hint,tone='green'}:{icon:LucideIcon;label:string;value:string;hint:string;tone?:'green'|'blue'|'amber'}){
  const toneMap={green:'metric-card-premium__icon--green',blue:'metric-card-premium__icon--blue',amber:'metric-card-premium__icon--amber'}
  return <div className="glass metric-card-premium">
    <div className={'metric-card-premium__icon '+toneMap[tone]}><Icon size={19}/></div>
    <span className="metric-card-premium__label">{label}</span>
    <strong className="font-display metric-card-premium__value">{value}</strong>
    <small className="metric-card-premium__hint">{hint}</small>
  </div>
}
