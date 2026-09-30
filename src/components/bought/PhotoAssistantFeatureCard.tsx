import { ArrowRight,Camera,CheckCircle2,Home,ImagePlus,LockKeyhole,PackageCheck,Sparkles } from 'lucide-react'
import type { AccountPlan } from '../../types/database'
import { planLabel } from '../../utils/plan'

export function PhotoAssistantFeatureCard({plan,unlocked,fullAccess,onLockedClick,onStart}:{plan:AccountPlan;unlocked:boolean;fullAccess:boolean;onLockedClick:()=>void;onStart:()=>void}){
  return <section className={'photo-feature-card '+(unlocked?'is-unlocked':'is-locked')}>
    <div className="photo-feature-card__glow"/>
    <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="premium-eyebrow text-cyan-400">ANÚNCIO INTELIGENTE</span>
            <span className="photo-feature-card__plan">{unlocked?<><CheckCircle2 size={11}/> {planLabel(plan,fullAccess)}</>:<><LockKeyhole size={11}/> BRIKE Pro</>}</span>
          </div>
          <h3 className="font-display mt-2 font-extrabold tracking-[-.04em] purchase-title">Transforme fotos em anúncio que vende.</h3>
          <p className="mt-2 max-w-2xl text-slate-500">O Radar avalia suas fotos, mostra o que reduz a confiança do comprador e cria título, descrição e faixa de preço prontos para publicar.</p>
        </div>
        <span className="photo-feature-card__icon"><Camera size={22}/></span>
      </div>

      <div className="photo-feature-card__benefits">
        <span><ImagePlus size={13}/> Nota das fotos</span>
        <span><Camera size={13}/> Diagnóstico visual</span>
        <span><Sparkles size={13}/> Título + descrição</span>
        <span><PackageCheck size={13}/> Item do Radar</span>
        <span><Home size={13}/> Item que já é seu</span>
      </div>

      {unlocked?<button type="button" onClick={onStart} className="photo-feature-card__start"><Sparkles size={16}/><span><strong>Preparar venda com IA</strong><small>Item do Radar ou algo que você já tem em casa</small></span><ArrowRight size={16}/></button>
      :<button type="button" onClick={onLockedClick} className="photo-feature-card__cta"><LockKeyhole size={14}/> Ver recurso do BRIKE Pro <ArrowRight size={14}/></button>}
    </div>
  </section>
}
