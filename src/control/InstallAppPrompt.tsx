import {useEffect,useState} from 'react'
import {Download,MoreVertical,PlusSquare,Smartphone,X} from 'lucide-react'

type InstallPromptEvent=Event&{
  prompt:()=>Promise<void>
  userChoice:Promise<{outcome:'accepted'|'dismissed';platform:string}>
}

function isStandalone(){
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (window.navigator as any).standalone===true
}

export function InstallAppPrompt({userId}:{userId:string}){
  const storageKey='controle-plus-install-offer:'+userId
  const [visible,setVisible]=useState(false)
  const [promptEvent,setPromptEvent]=useState<InstallPromptEvent|null>(null)
  const [showHelp,setShowHelp]=useState(false)

  useEffect(()=>{
    if(isStandalone())return
    if(window.localStorage.getItem(storageKey))return

    let timer:number|undefined
    const sync=()=>{
      const deferred=(window as any).__controlPlusInstallPrompt as InstallPromptEvent|undefined
      if(deferred)setPromptEvent(deferred)
      setVisible(true)
    }

    if((window as any).__controlPlusInstallPrompt)sync()
    else timer=window.setTimeout(sync,1800)

    window.addEventListener('control-plus-install-ready',sync)
    const installed=()=>{
      window.localStorage.setItem(storageKey,'installed')
      setVisible(false)
      setPromptEvent(null)
    }
    window.addEventListener('appinstalled',installed)

    return()=>{
      if(timer)window.clearTimeout(timer)
      window.removeEventListener('control-plus-install-ready',sync)
      window.removeEventListener('appinstalled',installed)
    }
  },[storageKey])

  async function install(){
    if(!promptEvent){
      setShowHelp(true)
      return
    }
    await promptEvent.prompt()
    const choice=await promptEvent.userChoice
    if(choice.outcome==='accepted'){
      window.localStorage.setItem(storageKey,'installed')
      setVisible(false)
      ;(window as any).__controlPlusInstallPrompt=null
    }else{
      setShowHelp(true)
    }
  }

  function dismiss(){
    window.localStorage.setItem(storageKey,'dismissed')
    setVisible(false)
  }

  if(!visible)return null

  return <div className="cp-install-layer">
    <button className="cp-install-backdrop" onClick={dismiss} aria-label="Fechar"/>
    <section className="cp-install-card">
      <button className="cp-install-close" onClick={dismiss} aria-label="Agora não"><X/></button>
      <span className="cp-install-app-icon">C<small>+</small></span>
      <div className="cp-install-copy">
        <span>CONTROLE+ NO SEU CELULAR</span>
        <h2>Instale o app e abra direto pela tela inicial.</h2>
        <p>Fica com ícone próprio, abre em tela cheia e você não precisa procurar o link toda vez.</p>
      </div>

      {!showHelp?<div className="cp-install-actions">
        <button className="cp-install-primary" onClick={()=>void install()}><Download/> Instalar CONTROLE+</button>
        <button className="cp-install-later" onClick={dismiss}>Agora não</button>
      </div>:<div className="cp-install-help">
        <div><Smartphone/><div><b>Adicionar à tela inicial</b><p>No Chrome, toque no menu <MoreVertical/> e escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p></div></div>
        <div><PlusSquare/><div><b>Depois é só tocar no ícone</b><p>O CONTROLE+ abre como aplicativo, sem precisar entrar pelo navegador.</p></div></div>
        <button className="cp-install-primary" onClick={dismiss}>Entendi</button>
      </div>}
    </section>
  </div>
}
