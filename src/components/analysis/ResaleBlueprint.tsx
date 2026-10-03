import { ArrowDown,Camera,ChevronRight,Sparkles,Target,WalletCards } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import { money } from '../../utils/format'

export function ResaleBlueprint({a}:{a:AnalysisResult}){
  const r=a.revenda
  if(!r)return null
  return <section className="resale-blueprint">
    <div className="resale-blueprint__glow"/>
    <header className="resale-blueprint__head">
      <div><span className="premium-eyebrow">PLANO DE COMPRA → REVENDA</span><h3>Entre barato. Valorize. Venda melhor.</h3><p>{r.estrategia_preco}</p></div>
      <span className="resale-blueprint__spark"><Sparkles size={20}/></span>
    </header>

    <div className="resale-blueprint__money">
      <Money icon={WalletCards} label="Abrir negociação" value={money(a.precos.oferta_agressiva)} note="âncora inicial"/>
      <ArrowDown className="resale-blueprint__arrow" size={15}/>
      <Money icon={Target} label="Tentar fechar" value={money(a.precos.oferta_equilibrada)} note={'teto '+money(a.precos.teto_compra)} accent/>
      <ArrowDown className="resale-blueprint__arrow" size={15}/>
      <Money icon={Sparkles} label="Anunciar depois" value={money(r.preco_publicacao)} note={'fechar perto de '+money(r.preco_fechamento_alvo)}/>
    </div>

    <div className="resale-blueprint__columns">
      <div className="resale-blueprint__block">
        <div className="resale-blueprint__block-head"><Sparkles size={15}/><div><span>VALORIZAÇÃO</span><strong>O que fazer antes de anunciar</strong></div></div>
        <div className="resale-blueprint__steps">{r.preparacao.slice(0,5).map((step,i)=><div key={i}><b>{String(i+1).padStart(2,'0')}</b><span><strong>{step.acao}</strong><small>Custo {money(step.custo_estimado)} · ganho estimado {money(step.ganho_valor_estimado)}</small></span><em>{step.prioridade}</em></div>)}</div>
      </div>

      <div className="resale-blueprint__block">
        <div className="resale-blueprint__block-head"><Camera size={15}/><div><span>FOTOS QUE VENDEM</span><strong>Mostre valor sem esconder defeitos</strong></div></div>
        <div className="resale-blueprint__photos">{r.fotos.slice(0,5).map((photo,i)=><div key={i}><span><Camera size={13}/></span><p><strong>{photo.foto}</strong><small>{photo.como_fazer}</small></p></div>)}</div>
      </div>
    </div>

    <div className="resale-blueprint__listing">
      <span>ANÚNCIO SUGERIDO</span><strong>{r.anuncio.titulo_sugerido}</strong>
      <div>{r.anuncio.destaques.slice(0,4).map((x,i)=><p key={i}><ChevronRight size={12}/>{x}</p>)}</div>
    </div>

    <footer><span>Saída rápida <b>{money(r.preco_liquidacao)}</b></span><i/><span>Fechamento alvo <b>{money(r.preco_fechamento_alvo)}</b></span><i/><span>Valorização estimada <b>{money(r.ganho_valorizacao_estimado)}</b></span></footer>
  </section>
}

function Money({icon:Icon,label,value,note,accent=false}:{icon:any;label:string;value:string;note:string;accent?:boolean}){
  return <div className={'resale-blueprint__money-card '+(accent?'is-accent':'')}><span><Icon size={15}/></span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></div>
}
