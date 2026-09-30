import { ArrowRight,Sparkles } from 'lucide-react'

export function DashboardHero({onNew}:{onNew:()=>void}){
  return <section className="noise radar-grid glass dashboard-hero-premium relative overflow-hidden rounded-[30px] p-5 sm:p-7 lg:p-9">
    <div className="dashboard-hero-premium__glow"/>
    <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="dashboard-live"><span/> Inteligência de oportunidade ativa</div>
        <h2 className="font-display mt-4 text-[35px] font-extrabold leading-[1.02] tracking-[-.055em] sm:text-5xl">Transforme anúncios em <span>decisões lucrativas.</span></h2>
        <p className="mt-4 max-w-2xl text-[14px] leading-6 text-slate-400 sm:text-[15px]">Preço de mercado, risco, liquidez, teto de compra e estratégia antes de colocar dinheiro no produto.</p>
      </div>
      <button onClick={onNew} className="dashboard-new-analysis"><Sparkles size={18}/><span>Nova análise</span><ArrowRight size={16}/></button>
    </div>
  </section>
}
