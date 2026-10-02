import { useEffect,useState } from 'react'
import { Bell,Check,ChevronRight,Download,ShieldCheck,UserRound } from 'lucide-react'
import type { RadarConfigRow } from '../../types/database'
import type { RadarConfigPatch } from '../../hooks/useRadarConfig'

type InstallPrompt={
  prompt:()=>Promise<void>
  userChoice:Promise<{outcome:'accepted'|'dismissed'}>
}

const isStandalone=()=>typeof window!=='undefined'&&(
  window.matchMedia?.('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator&{standalone?:boolean}).standalone)
)

export function OnboardingModal({config,onSave}:{config:RadarConfigRow;onSave:(patch:RadarConfigPatch)=>Promise<void>}){
  const [step,setStep]=useState(0)
  const [experience,setExperience]=useState(config.experiencia||'iniciante')
  const [notifications,setNotifications]=useState(config.notificacoes_ativas!==false)
  const [installReady,setInstallReady]=useState(()=>Boolean((window as any).__brikeInstallPrompt))
  const [installed,setInstalled]=useState(isStandalone)
  const [installNote,setInstallNote]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{
    const ready=()=>setInstallReady(Boolean((window as any).__brikeInstallPrompt))
    const done=()=>{setInstalled(true);setInstallReady(false);setInstallNote('App instalado neste dispositivo.')}
    window.addEventListener('brike-install-ready',ready)
    window.addEventListener('appinstalled',done)
    return()=>{
      window.removeEventListener('brike-install-ready',ready)
      window.removeEventListener('appinstalled',done)
    }
  },[])

  const installApp=async()=>{
    setInstallNote('')
    if(installed)return
    const prompt=(window as any).__brikeInstallPrompt as InstallPrompt|undefined
    if(!prompt){
      setInstallNote('Se a instalação não aparecer, use o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.')
      return
    }
    try{
      await prompt.prompt()
      const choice=await prompt.userChoice
      if(choice.outcome==='accepted'){
        setInstalled(true)
        setInstallReady(false)
        ;(window as any).__brikeInstallPrompt=null
        setInstallNote('Instalação confirmada.')
      }else{
        setInstallNote('Sem problema. Você pode instalar depois pelo navegador.')
      }
    }catch{
      setInstallNote('Você pode instalar depois pelo menu do navegador.')
    }
  }

  const finish=async()=>{
    setBusy(true);setError('')
    try{
      await onSave({
        experiencia:experience as RadarConfigRow['experiencia'],
        notificacoes_ativas:notifications,
        onboarding_concluido:true
      })
      if(notifications&&'Notification' in window&&Notification.permission==='default'){
        try{await Notification.requestPermission()}catch{}
      }
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir a configuração.')}
    finally{setBusy(false)}
  }

  return <div className="onboarding">
    <div className="onboarding__backdrop"/>
    <section className="onboarding__card">
      <div className="onboarding__top">
        <div><span className="premium-eyebrow text-emerald-400">PRIMEIRO ACESSO</span><strong>{step+1} de 2</strong></div>
        <div className="onboarding__progress"><i style={{width:((step+1)/2*100)+'%'}}/></div>
      </div>

      {step===0&&<div className="onboarding__body">
        <span className="onboarding__icon"><UserRound size={22}/></span>
        <h2 className="font-display">Como você se considera hoje?</h2>
        <p>Isso serve apenas para ajustar a linguagem e o nível de detalhe da experiência. <strong>Não altera score, preço, teto de compra nem o veredito de um anúncio.</strong></p>

        <div className="onboarding__level-grid">
          <Level active={experience==='iniciante'} title="Começando" text="Ainda estou pegando prática no garimpo e na negociação." onClick={()=>setExperience('iniciante')}/>
          <Level active={experience==='intermediario'} title="Já faço negócios" text="Já compro, negocio e revendo com alguma frequência." onClick={()=>setExperience('intermediario')}/>
          <Level active={experience==='avancado'} title="Vivo de revenda" text="Garimpo e revenda já fazem parte da minha rotina." onClick={()=>setExperience('avancado')}/>
        </div>

        <div className="onboarding__neutral-note"><ShieldCheck size={16}/><span>O Radar analisa cada anúncio pelo produto, condição, preço, risco e mercado — sem meta fixa de lucro imposta no primeiro acesso.</span></div>

        <button className="onboarding__primary" onClick={()=>setStep(1)}>Continuar <ChevronRight size={17}/></button>
      </div>}

      {step===1&&<div className="onboarding__body">
        <span className="onboarding__icon"><Bell size={22}/></span>
        <h2 className="font-display">Só falta escolher como quer usar o Radar.</h2>
        <p>Ative os avisos que ajudam na operação e, se quiser, instale o BRIKE RADAR como app. Essas escolhas também não interferem na análise dos anúncios.</p>

        <div className="onboarding__setup-list">
          <button className={'onboarding__notification '+(notifications?'is-active':'')} onClick={()=>setNotifications(v=>!v)}>
            <span><Bell size={18}/></span>
            <div><strong>Alertas inteligentes</strong><small>Negociações esquecidas, estoque parado, reservas e ações que pedem atenção.</small></div>
            <b>{notifications?'ATIVAR':'AGORA NÃO'}</b>
          </button>

          <div className={'onboarding__install '+(installed?'is-installed':'')}>
            <span><Download size={18}/></span>
            <div><strong>BRIKE RADAR no celular</strong><small>{installed?'Já está instalado neste dispositivo.':'Abra mais rápido e use como um app, sem depender da aba do navegador.'}</small></div>
            <button onClick={installApp} disabled={installed}>{installed?'INSTALADO':installReady?'INSTALAR':'COMO INSTALAR'}</button>
          </div>
        </div>

        {installNote&&<div className="onboarding__install-note">{installNote}</div>}
        <div className="onboarding__summary"><Check size={18}/><div><strong>Pronto. Sem metas artificiais.</strong><p>Lucro mínimo, ROI mínimo, categorias e meta mensal não fazem parte deste primeiro acesso e não serão usados para reprovar uma oportunidade.</p></div></div>
        {error&&<div className="onboarding__error">{error}</div>}
        <div className="onboarding__buttons"><button onClick={()=>setStep(0)}>Voltar</button><button className="is-primary" onClick={finish} disabled={busy}>{busy?'Salvando...':'Entrar no BRIKE RADAR'} <ChevronRight size={17}/></button></div>
      </div>}
    </section>
  </div>
}

function Level({active,title,text,onClick}:{active:boolean;title:string;text:string;onClick:()=>void}){
  return <button onClick={onClick} className={'onboarding__level '+(active?'is-active':'')}>
    <span>{active?<Check size={15}/>:null}</span>
    <strong>{title}</strong>
    <small>{text}</small>
  </button>
}
