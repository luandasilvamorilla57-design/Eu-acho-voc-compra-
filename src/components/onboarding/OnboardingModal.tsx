import { useState } from 'react'
import { Bell,BriefcaseBusiness,Check,ChevronRight,House,Search,ShoppingBag,Target } from 'lucide-react'
import type { RadarConfigRow } from '../../types/database'
import type { RadarConfigPatch } from '../../hooks/useRadarConfig'
const categories=['Celulares','Eletrônicos','Eletrodomésticos','Ferramentas','Games','Móveis','Autopeças','Outros']

export function OnboardingModal({config,onSave}:{config:RadarConfigRow;onSave:(patch:RadarConfigPatch)=>Promise<void>}){
  const [step,setStep]=useState(0)
  const [profile,setProfile]=useState(config.perfil_operacao||'revenda')
  const [experience,setExperience]=useState(config.experiencia||'iniciante')
  const [selected,setSelected]=useState<string[]>(Array.isArray(config.categorias_preferidas)?config.categorias_preferidas.filter((x):x is string=>typeof x==='string'):[])
  const [capital,setCapital]=useState(String(config.capital_disponivel||''))
  const [profit,setProfit]=useState(String(config.lucro_minimo||150))
  const [roi,setRoi]=useState(String(config.roi_minimo||25))
  const [goal,setGoal]=useState(String(config.objetivo_lucro_mensal||''))
  const [notifications,setNotifications]=useState(config.notificacoes_ativas!==false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const toggle=(name:string)=>setSelected(v=>v.includes(name)?v.filter(x=>x!==name):[...v,name].slice(0,5))

  const finish=async()=>{
    setBusy(true);setError('')
    try{
      await onSave({
        perfil_operacao:profile as RadarConfigRow['perfil_operacao'],
        experiencia:experience as RadarConfigRow['experiencia'],
        categorias_preferidas:selected,
        capital_disponivel:Number(capital||0),
        lucro_minimo:Number(profit||0),
        roi_minimo:Number(roi||0),
        objetivo_lucro_mensal:Number(goal||0),
        notificacoes_ativas:notifications,
        onboarding_concluido:true
      })
      if(notifications&&'Notification' in window&&Notification.permission==='default'){
        try{await Notification.requestPermission()}catch{}
      }
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar sua configuração.')}
    finally{setBusy(false)}
  }

  return <div className="onboarding">
    <div className="onboarding__backdrop"/>
    <section className="onboarding__card">
      <div className="onboarding__top">
        <div><span className="premium-eyebrow text-emerald-400">CONFIGURAÇÃO INICIAL</span><strong>{step+1} de 3</strong></div>
        <div className="onboarding__progress"><i style={{width:((step+1)/3*100)+'%'}}/></div>
      </div>

      {step===0&&<div className="onboarding__body">
        <span className="onboarding__icon"><Target size={22}/></span>
        <h2 className="font-display">Como você pretende usar o Radar?</h2>
        <p>Isso muda a forma como os alertas e comparações são apresentados. Você pode alterar depois.</p>
        <div className="onboarding__options">
          <Choice active={profile==='revenda'} icon={ShoppingBag} title="Compra e revenda" text="Compro barato para revender com margem." onClick={()=>setProfile('revenda')}/>
          <Choice active={profile==='garimpo'} icon={Search} title="Garimpo de oportunidades" text="Procuro boas compras, mesmo sem revender sempre." onClick={()=>setProfile('garimpo')}/>
          <Choice active={profile==='desapego'} icon={House} title="Desapego" text="Quero vender melhor itens que já tenho." onClick={()=>setProfile('desapego')}/>
          <Choice active={profile==='misto'} icon={BriefcaseBusiness} title="Uso misto" text="Faço um pouco de tudo." onClick={()=>setProfile('misto')}/>
        </div>
        <button className="onboarding__primary" onClick={()=>setStep(1)}>Continuar <ChevronRight size={17}/></button>
      </div>}

      {step===1&&<div className="onboarding__body">
        <span className="onboarding__icon"><ShoppingBag size={22}/></span>
        <h2 className="font-display">Ensine o Radar sobre o seu brique.</h2>
        <p>Escolha até 5 categorias e diga o seu nível. Isso ajuda a contextualizar o histórico sem substituir os dados do anúncio.</p>
        <div className="onboarding__experience">
          {([['iniciante','Começando'],['intermediario','Já faço negócios'],['avancado','Vivo de revenda']] as const).map(([id,label])=><button key={id} className={experience===id?'is-active':''} onClick={()=>setExperience(id)}>{label}</button>)}
        </div>
        <div className="onboarding__chips">{categories.map(c=><button key={c} onClick={()=>toggle(c)} className={selected.includes(c)?'is-active':''}>{selected.includes(c)&&<Check size={12}/>} {c}</button>)}</div>
        <div className="onboarding__money-grid">
          <MiniField label="Capital disponível" prefix="R$" value={capital} setValue={setCapital}/>
          <MiniField label="Lucro mínimo / negócio" prefix="R$" value={profit} setValue={setProfit}/>
          <MiniField label="ROI mínimo" suffix="%" value={roi} setValue={setRoi}/>
          <MiniField label="Meta de lucro mensal" prefix="R$" value={goal} setValue={setGoal}/>
        </div>
        <div className="onboarding__buttons"><button onClick={()=>setStep(0)}>Voltar</button><button className="is-primary" onClick={()=>setStep(2)}>Continuar <ChevronRight size={17}/></button></div>
      </div>}

      {step===2&&<div className="onboarding__body">
        <span className="onboarding__icon"><Bell size={22}/></span>
        <h2 className="font-display">Deixe o Radar cuidar do que pode passar batido.</h2>
        <p>Alertas de estoque parado e negociações esquecidas aparecem dentro do app. Se você permitir, o navegador também pode avisar enquanto o Radar estiver aberto.</p>
        <button className={'onboarding__notification '+(notifications?'is-active':'')} onClick={()=>setNotifications(v=>!v)}>
          <span><Bell size={18}/></span><div><strong>Alertas inteligentes</strong><small>Estoque parado, reserva antiga e negociação sem resposta.</small></div><b>{notifications?'ATIVOS':'DESATIVADOS'}</b>
        </button>
        <div className="onboarding__summary"><Check size={18}/><div><strong>Pronto para personalizar.</strong><p>O Radar passa a comparar oportunidades com suas metas e, conforme você vende, aprende com seus próprios resultados.</p></div></div>
        {error&&<div className="onboarding__error">{error}</div>}
        <div className="onboarding__buttons"><button onClick={()=>setStep(1)}>Voltar</button><button className="is-primary" onClick={finish} disabled={busy}>{busy?'Salvando...':'Entrar no BRIKE RADAR'} <ChevronRight size={17}/></button></div>
      </div>}
    </section>
  </div>
}

function Choice({active,icon:Icon,title,text,onClick}:{active:boolean;icon:any;title:string;text:string;onClick:()=>void}){
  return <button onClick={onClick} className={active?'is-active':''}><span><Icon size={18}/></span><div><strong>{title}</strong><small>{text}</small></div>{active&&<Check size={16}/>}</button>
}
function MiniField({label,prefix,suffix,value,setValue}:{label:string;prefix?:string;suffix?:string;value:string;setValue:(v:string)=>void}){
  return <label><span>{label}</span><div>{prefix&&<b>{prefix}</b>}<input inputMode="decimal" value={value} onChange={e=>setValue(e.target.value.replace(',','.'))}/>{suffix&&<b>{suffix}</b>}</div></label>
}
