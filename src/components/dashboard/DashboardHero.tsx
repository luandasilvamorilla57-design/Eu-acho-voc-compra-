import { ArrowRight,BarChart3,ShieldCheck,Sparkles,Target } from 'lucide-react'
export function DashboardHero({onNew}:{onNew:()=>void}){
  return <section className="noise radar-grid glass dashboard-hero-premium relative overflow-hidden">
    <div className="dashboard-hero-premium__glow"/>
    <div className="dashboard-hero-premium__mesh" aria-hidden="true"/>
    <div className="relative dashboard-hero-premium__layout">
      <div className="max-w-3xl">
        <div className="dashboard-live"><span/> Inteligência de oportunidade ativa</div>
        <h2 className="font-display dashboard-hero-premium__title">Transforme anúncios em <span className="dashboard-hero-premium__accent">decisões lucrativas.</span></h2>
        <p className="dashboard-hero-premium__copy">Leia preço de mercado, risco, liquidez e teto de compra antes de colocar dinheiro no produto.</p>
        <div className="dashboard-hero-premium__proof">
          <span><BarChart3 size={13}/> Mercado</span>
          <span><Target size={13}/> Teto de compra</span>
          <span><ShieldCheck size={13}/> Risco + margem</span>
        </div>
      </div>
      <button onClick={onNew} className="dashboard-new-analysis">
        <span className="dashboard-new-analysis__icon"><Sparkles size={18}/></span>
        <span className="dashboard-new-analysis__copy"><strong>Nova análise</strong><small>Leia o negócio antes de negociar</small></span>
        <ArrowRight size={17} className="dashboard-new-analysis__arrow"/>
      </button>
    </div>
  </section>
}
