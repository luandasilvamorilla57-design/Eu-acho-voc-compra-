import { ExternalLink,Globe2,ShieldCheck } from 'lucide-react'
import type { AnalysisResult,MarketReferenceSource } from '../../types/analysis'
import { money } from '../../utils/format'
import { PanelHeader } from './PanelHeader'

const sourceLabel:Record<MarketReferenceSource,string>={
  usuario:'informado',
  url_context:'anúncio',
  google_search:'web real',
  estimativa:'estimativa'
}

export function MarketPanel({a}:{a:AnalysisResult}){
  const refs=a.mercado.referencias??[]
  const grounded=Boolean(a.meta?.pesquisa_web)
  return <section className="glass market-panel-premium rounded-[24px] p-5 sm:p-6">
    <div className="market-panel-premium__head">
      <PanelHeader eyebrow="MERCADO DE USADOS" title="Preço realista para comprar e revender"/>
      <span className={'market-grounding '+(grounded?'is-live':'is-estimate')}><Globe2 size={13}/>{grounded?String(a.meta?.consultas_mercado||1)+' busca(s) web':'base limitada'}</span>
    </div>

    {a.mercado.base_preco&&<div className="market-basis"><span>BASE COMPARADA</span><strong>{a.mercado.base_preco}</strong><small>{Math.round(a.mercado.amostra_util||0)} comparável(is) útil(eis) · {a.mercado.observacao_amostra||'faixa de usados comparáveis'}</small></div>}

    <div className="mt-4 grid grid-cols-3 gap-2">
      <Tiny label="Usado baixo" value={money(a.mercado.preco_min)}/>
      <Tiny label="Mediana usada" value={money(a.mercado.preco_mediano)} accent/>
      <Tiny label="Usado alto" value={money(a.mercado.preco_max)}/>
    </div>

    <div className="market-range-justification mt-3 rounded-xl bg-slate-950/30 p-4 text-[12px] leading-5 text-slate-400">{a.mercado.justificativa}</div>

    {refs.length>0&&<div className="mt-4 min-w-0">
      <div className="market-refs-heading flex items-center gap-2 text-[10px] font-bold tracking-[.12em] text-slate-500"><ShieldCheck size={13} className="shrink-0 text-blue-400"/> COMPARÁVEIS USADOS NO CÁLCULO</div>
      <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
        {refs.slice(0,8).map((r,i)=>{
          const inner=<><div className="market-ref-result__content"><strong className="market-ref-result__title">{r.titulo||'Referência '+String(i+1)}</strong><span className="market-ref-result__observation">{r.observacao}</span></div><div className="market-ref-result__price"><strong>{money(r.preco)}</strong><small>{sourceLabel[r.fonte]||r.fonte}</small></div>{r.url&&<ExternalLink size={12} className="market-ref-result__external"/>}</>
          return r.url?<a key={i} href={r.url} target="_blank" rel="noreferrer" className="market-ref-result">{inner}</a>:<div key={i} className="market-ref-result">{inner}</div>
        })}
      </div>
    </div>}
  </section>
}

function Tiny({label,value,accent=false}:{label:string;value:string;accent?:boolean}){
  return <div className="market-tiny rounded-xl bg-slate-950/25 p-3"><span className="block text-[9px] text-slate-600">{label}</span><strong className={'font-display mt-1 block text-[13px] '+(accent?'text-emerald-300':'text-slate-300')}>{value}</strong></div>
}
