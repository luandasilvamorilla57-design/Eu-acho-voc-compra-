import { ArrowRight,Camera,CheckCircle2,FileText,Home,ImagePlus,LockKeyhole,PackageCheck,Sparkles,Tag,ThermometerSun } from 'lucide-react'
import type { AccountPlan } from '../../types/database'
import { planLabel } from '../../utils/plan'

export function PhotoAssistantFeatureCard({plan,unlocked,fullAccess,onLockedClick,onStart}:{plan:AccountPlan;unlocked:boolean;fullAccess:boolean;onLockedClick:()=>void;onStart:()=>void}){
  const action=unlocked?onStart:onLockedClick
  const accessLabel=unlocked?planLabel(plan,fullAccess):'Disponível no BRIKE Pro'

  return <section className={'smart-sale-card '+(unlocked?'is-unlocked':'is-locked')}>
    <span className="smart-sale-card__halo smart-sale-card__halo--one"/>
    <span className="smart-sale-card__halo smart-sale-card__halo--two"/>
    <span className="smart-sale-card__grid"/>

    <div className="smart-sale-card__content">
      <header className="smart-sale-card__header">
        <div className="smart-sale-card__identity">
          <div className="smart-sale-card__labels">
            <span className="smart-sale-card__product"><Sparkles size={13}/> ANÚNCIO INTELIGENTE <b>PRO</b></span>
            <span className="smart-sale-card__access">{unlocked?<CheckCircle2 size={12}/>:<LockKeyhole size={12}/>} {accessLabel}</span>
          </div>
          <h3 className="font-display">Suas fotos passam confiança ou fazem você perder venda?</h3>
          <p>O Radar avalia a apresentação do item, mostra o que enfraquece o anúncio e entrega <strong>título, descrição e faixa de preço</strong> prontos para publicar.</p>
        </div>

        <button type="button" onClick={action} className="smart-sale-card__camera" aria-label={unlocked?'Preparar venda com IA':'Conhecer o recurso do BRIKE Pro'}>
          <span><Camera size={24}/></span>
          <small>{unlocked?'COMEÇAR':'PRO'}</small>
        </button>
      </header>

      <div className="smart-sale-card__features" aria-label="Recursos do anúncio inteligente">
        <Feature icon={ImagePlus} title="Nota das fotos" text="qualidade visual"/>
        <Feature icon={Camera} title="Diagnóstico visual" text="o que refazer"/>
        <Feature icon={FileText} title="Título + descrição" text="prontos para copiar"/>
        <Feature icon={Tag} title="Preço sugerido" text="3 estratégias"/>
        <Feature icon={PackageCheck} title="Item do Radar" text="usa o histórico"/>
        <Feature icon={Home} title="Item que já é seu" text="desapego do zero"/>
      </div>

      <div className="smart-sale-card__how">
        <div className="smart-sale-card__how-title"><span>COMO FUNCIONA</span><b>3 passos</b></div>
        <div className="smart-sale-card__steps">
          <Step n="01" title="Escolha o item" text="Radar ou item por fora"/>
          <ArrowRight className="smart-sale-card__step-arrow" size={14}/>
          <Step n="02" title="Envie as fotos" text="até 6 imagens"/>
          <ArrowRight className="smart-sale-card__step-arrow" size={14}/>
          <Step n="03" title="Receba o anúncio" text="diagnóstico + copy"/>
        </div>
      </div>

      <button type="button" onClick={action} className={'smart-sale-card__cta '+(!unlocked?'is-locked':'')}>
        <span className="smart-sale-card__cta-icon">{unlocked?<Sparkles size={21}/>:<LockKeyhole size={19}/>}</span>
        <span className="smart-sale-card__cta-copy">
          <span className="smart-sale-card__cta-eyebrow"><b>PRO</b> PREPARAÇÃO DE VENDA</span>
          <strong>{unlocked?'Preparar venda com IA':'Desbloquear preparação de venda'}</strong>
          <small>{unlocked?'Diagnóstico visual, anúncio pronto e preço sugerido para vender com mais confiança.':'Avaliação de fotos e anúncio automático fazem parte do BRIKE Pro.'}</small>
        </span>
        <span className="smart-sale-card__cta-arrow"><ArrowRight size={19}/></span>
      </button>

      <footer className="smart-sale-card__footer">
        <span><ThermometerSun size={13}/> Avaliação visual antes de publicar</span>
        <i/>
        <span>OLX + Marketplace</span>
      </footer>
    </div>
  </section>
}

function Feature({icon:Icon,title,text}:{icon:any;title:string;text:string}){
  return <div className="smart-sale-card__feature"><span><Icon size={15}/></span><div><strong>{title}</strong><small>{text}</small></div></div>
}

function Step({n,title,text}:{n:string;title:string;text:string}){
  return <div className="smart-sale-card__step"><b>{n}</b><span><strong>{title}</strong><small>{text}</small></span></div>
}
