import { Activity,BarChart3,ScanSearch,ShieldCheck,Sparkles,TrendingUp } from 'lucide-react'
import { Brand } from '../Brand'
import { AuthPainCard } from './AuthPainCard'
import { AuthBenefits } from './AuthBenefits'

export function AuthShowcase(){
  return <section className="auth-showcase noise radar-grid relative overflow-hidden border-b border-slate-800/70 p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-[5.8vw]">
    <div className="auth-orb auth-orb--one"/>
    <div className="auth-orb auth-orb--two"/>
    <div className="auth-rings" aria-hidden="true"><span/><span/><span/></div>
    <div className="auth-scanline" aria-hidden="true"/>

    <div className="relative z-10 mx-auto flex min-h-full max-w-[920px] flex-col justify-between">
      <div>
        <div className="auth-showcase__top">
          <Brand/>
          <div className="auth-showcase__meta"><span>DADOS</span><i/> <span>ANÁLISES</span><i/> <span>DECISÕES MAIS SEGURAS</span></div>
        </div>

        <div className="auth-hero-copy mt-8 sm:mt-11">
          <div className="auth-kicker">PARE DE COMPRAR NO ACHISMO</div>
          <h1 className="font-display mt-4">Antes de pagar, saiba se o anúncio <span>realmente vale a pena.</span></h1>
          <p>Do garimpo à revenda: descubra quanto vale pagar, o que testar, como negociar e quando agir para não deixar margem nem capital parados.</p>
        </div>

        <div className="auth-intel-preview" aria-label="Exemplo de inteligência do BRIKE RADAR">
          <div className="auth-intel-preview__head">
            <div>
              <span><ScanSearch size={13}/> ANÁLISE ANTES DA COMPRA</span>
              <strong>Decisão baseada em preço, risco e giro.</strong>
            </div>
            <b>Score 86</b>
          </div>
          <div className="auth-intel-preview__grid">
            <Metric icon={TrendingUp} label="Preço de compra" value="R$ 780" hint="teto recomendado"/>
            <Metric icon={BarChart3} label="Revenda provável" value="R$ 1.050" hint="faixa estimada"/>
            <Metric icon={ShieldCheck} label="Risco" value="Baixo" hint="checklist validado"/>
          </div>
          <div className="auth-intel-preview__signal">
            <Activity size={15}/>
            <span>O Radar conecta análise, negociação, estoque, ações e revenda em um único fluxo.</span>
          </div>
        </div>

        <AuthPainCard/>
        <AuthBenefits/>
      </div>

      <div className="auth-outcome mt-6 hidden lg:flex">
        <div className="auth-outcome__icon"><Sparkles size={15}/></div>
        <div>
          <div>UMA OPERAÇÃO MAIS INTELIGENTE</div>
          <p>Garimpo por caixa, análise com IA, alertas da Central de Ação e apoio para preparar a revenda.</p>
        </div>
      </div>
    </div>
  </section>
}

function Metric({icon:Icon,label,value,hint}:{icon:any;label:string;value:string;hint:string}){
  return <div className="auth-intel-metric">
    <span><Icon size={15}/></span>
    <div><small>{label}</small><strong>{value}</strong><em>{hint}</em></div>
  </div>
}
