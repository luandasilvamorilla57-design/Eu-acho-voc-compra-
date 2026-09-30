import { ArrowRight,Camera,CheckCircle2,ImagePlus,LockKeyhole,Sparkles } from 'lucide-react'
import type { AccountPlan } from '../../types/database'
import { planLabel } from '../../utils/plan'

export function PhotoAssistantFeatureCard({plan,unlocked,fullAccess,onLockedClick}:{plan:AccountPlan;unlocked:boolean;fullAccess:boolean;onLockedClick:()=>void}){
  return <section className={'photo-feature-card '+(unlocked?'is-unlocked':'is-locked')}>
    <div className="photo-feature-card__glow"/>
    <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="premium-eyebrow text-cyan-400">ANÚNCIO INTELIGENTE</span>
            <span className="photo-feature-card__plan">{unlocked?<><CheckCircle2 size={11}/> {planLabel(plan,fullAccess)}</>:<><LockKeyhole size={11}/> BRIKE Pro</>}</span>
          </div>
          <h3 className="font-display mt-2 text-[23px] font-extrabold tracking-[-.04em] purchase-title">Suas fotos estão ajudando a vender?</h3>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-slate-500">Envie as fotos do anúncio. O Radar avalia nitidez, luz, enquadramento, limpeza, fundo e ângulos faltando — depois cria título e descrição prontos para OLX ou Facebook.</p>
        </div>
        <span className="photo-feature-card__icon"><Camera size={22}/></span>
      </div>

      <div className="photo-feature-card__benefits">
        <span><ImagePlus size={13}/> Nota das fotos</span>
        <span><Camera size={13}/> O que refazer</span>
        <span><Sparkles size={13}/> Título + descrição</span>
      </div>

      {!unlocked&&<button type="button" onClick={onLockedClick} className="photo-feature-card__cta"><LockKeyhole size={14}/> Ver recurso do BRIKE Pro <ArrowRight size={14}/></button>}
      {unlocked&&<div className="photo-feature-card__hint"><Sparkles size={13}/> Abra um item abaixo e toque em <b>Preparar venda</b>.</div>}
    </div>
  </section>
}
