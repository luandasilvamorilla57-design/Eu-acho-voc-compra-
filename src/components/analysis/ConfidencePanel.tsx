import { AlertCircle,Eye,ShieldCheck } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'

export function ConfidencePanel({a}:{a:AnalysisResult}){
  const overall=Math.round(a.confianca_geral||0)
  const missing=a.dados_faltantes??[]
  const tone=overall>=75?'good':overall>=50?'mid':'low'
  return <section className="glass rounded-[22px] p-5">
    <div className="flex items-start justify-between gap-4"><div><span className="text-[9px] font-bold tracking-[.18em] text-slate-500">CONFIANÇA DA LEITURA</span><h3 className="font-display mt-1 text-lg font-bold operation-title">O que o Radar sabe — e o que ainda falta.</h3></div><span className={'confidence-score is-'+tone}><b>{overall}%</b><small>confiança</small></span></div>
    <div className="mt-4 grid grid-cols-3 gap-2"><Confidence label="Produto" value={a.confianca_identificacao}/><Confidence label="Preço" value={a.confianca_preco}/><Confidence label="Geral" value={a.confianca_geral}/></div>
    {missing.length>0?<div className="mt-4"><div className="flex items-center gap-2 text-[10px] font-bold text-amber-400"><AlertCircle size={13}/> Para aumentar a precisão</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{missing.slice(0,6).map((x,i)=><div key={i} className="confidence-missing"><Eye size={12}/>{x}</div>)}</div></div>:<div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-400/[.05] p-3 text-[10px] text-emerald-400"><ShieldCheck size={14}/> As informações disponíveis foram suficientes para uma leitura consistente.</div>}
  </section>
}
function Confidence({label,value}:{label:string;value:number}){const n=Math.round(value||0);return <div className="confidence-mini"><span>{label}</span><strong>{n}%</strong><i><b style={{width:String(Math.max(0,Math.min(100,n)))+'%'}}/></i></div>}
