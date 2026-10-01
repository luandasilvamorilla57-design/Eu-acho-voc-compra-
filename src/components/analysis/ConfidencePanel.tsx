import { AlertCircle,Eye,ShieldCheck } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'

export function ConfidencePanel({a}:{a:AnalysisResult}){
  const overall=Math.round(a.confianca_geral||0)
  const missing=a.dados_faltantes??[]
  const refs=a.mercado?.referencias??[]
  const concrete=refs.filter(r=>r.fonte==='usuario'||r.fonte==='url_context').length
  const tone=overall>=75?'good':overall>=50?'mid':'low'
  const label=overall>=75?'ALTA':overall>=50?'MÉDIA':'BAIXA'
  const why=overall>=75
    ? (concrete>0?'Há referência concreta e os dados principais estão coerentes.':'Os dados principais estão consistentes, mas confirme o produto presencialmente.')
    : overall>=50
      ? 'A leitura é útil, porém ainda existem informações que podem alterar preço, risco ou teto.'
      : 'Use esta análise como triagem. Faltam dados importantes antes de colocar dinheiro no produto.'

  return <section className="glass rounded-[22px] p-5">
    <div className="flex items-start justify-between gap-4">
      <div><span className="text-[9px] font-bold tracking-[.18em] text-slate-500">CONFIANÇA DA LEITURA</span><h3 className="font-display mt-1 text-lg font-bold operation-title">O que o Radar sabe — e o que ainda falta.</h3><p className="confidence-why">{why}</p></div>
      <span className={'confidence-score is-'+tone}><b>{label}</b><strong>{overall}%</strong><small>confiança</small></span>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2"><Confidence label="Produto" value={a.confianca_identificacao}/><Confidence label="Preço" value={a.confianca_preco}/><Confidence label="Geral" value={a.confianca_geral}/></div>
    {concrete>0&&<div className="confidence-evidence"><ShieldCheck size={13}/>{concrete} referência(s) concreta(s) ajudaram a sustentar a leitura.</div>}
    {missing.length>0?<div className="mt-4"><div className="flex items-center gap-2 text-[10px] font-bold text-amber-400"><AlertCircle size={13}/> Para aumentar a precisão</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{missing.slice(0,6).map((x,i)=><div key={i} className="confidence-missing"><Eye size={12}/>{x}</div>)}</div></div>:<div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-400/[.05] p-3 text-[10px] text-emerald-400"><ShieldCheck size={14}/> As informações disponíveis foram suficientes para uma leitura consistente.</div>}
  </section>
}
function Confidence({label,value}:{label:string;value:number}){const n=Math.round(value||0);return <div className="confidence-mini"><span>{label}</span><strong>{n}%</strong><i><b style={{width:String(Math.max(0,Math.min(100,n)))+'%'}}/></i></div>}
