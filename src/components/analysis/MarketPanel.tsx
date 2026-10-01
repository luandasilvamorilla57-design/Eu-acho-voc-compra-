import { ExternalLink,ShieldCheck } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import { money } from '../../utils/format'
import { PanelHeader } from './PanelHeader'

export function MarketPanel({a}:{a:AnalysisResult}){
  const refs=a.mercado.referencias??[]
  return <section className="glass rounded-[24px] p-5 sm:p-6">
    <PanelHeader eyebrow="FAIXA DE MERCADO" title="Preço e teto de compra"/>
    <div className="mt-4 grid grid-cols-3 gap-2">
      <Tiny label="Mercado mín." value={money(a.mercado.preco_min)}/>
      <Tiny label="Mediana" value={money(a.mercado.preco_mediano)} accent/>
      <Tiny label="Mercado máx." value={money(a.mercado.preco_max)}/>
    </div>

    <div className="market-range-justification mt-3 rounded-xl bg-slate-950/30 p-4 text-[12px] leading-5 text-slate-400">{a.mercado.justificativa}</div>

    {refs.length>0&&<div className="mt-4 min-w-0">
      <div className="market-refs-heading flex items-center gap-2 text-[10px] font-bold tracking-[.12em] text-slate-500">
        <ShieldCheck size={13} className="shrink-0 text-blue-400"/> COMPARÁVEIS USADOS NO CÁLCULO
      </div>

      <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
        {refs.slice(0,6).map((r,i)=>{
          const inner=<>
            <div className="market-ref-result__content">
              <strong className="market-ref-result__title">{r.titulo||`Referência ${i+1}`}</strong>
              <span className="market-ref-result__observation">{r.observacao}</span>
            </div>

            <div className="market-ref-result__price">
              <strong>{money(r.preco)}</strong>
              <small>{r.fonte||'estimativa'}</small>
            </div>

            {r.url&&<ExternalLink size={12} className="market-ref-result__external"/>}
          </>

          return r.url
            ? <a key={i} href={r.url} target="_blank" rel="noreferrer" className="market-ref-result">{inner}</a>
            : <div key={i} className="market-ref-result">{inner}</div>
        })}
      </div>
    </div>}
  </section>
}

function Tiny({label,value,accent=false}:{label:string;value:string;accent?:boolean}){
  return <div className="market-tiny rounded-xl bg-slate-950/25 p-3">
    <span className="block text-[9px] text-slate-600">{label}</span>
    <strong className={`font-display mt-1 block text-[13px] ${accent?'text-emerald-300':'text-slate-300'}`}>{value}</strong>
  </div>
}
