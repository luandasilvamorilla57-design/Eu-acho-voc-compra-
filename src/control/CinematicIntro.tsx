import {useEffect,useRef,useState} from 'react'
import {Play,Volume2} from 'lucide-react'
import {supabase} from '../lib/supabase'
import './intro-video.css'

const db=supabase as any

export function CinematicIntro({userId,isAdmin,onDone}:{userId:string;isAdmin:boolean;onDone:()=>void}){
  const [started,setStarted]=useState(false)
  const [finished,setFinished]=useState(false)
  const [saving,setSaving]=useState(false)
  const [problem,setProblem]=useState('')
  const video=useRef<HTMLVideoElement>(null)
  const url='/videos/controle-plus-apresentacao.mp4'

  async function start(){
    setProblem('')
    try{await video.current?.play();setStarted(true)}
    catch{setProblem('Toque em Iniciar experiência para liberar o áudio.')}
  }
  async function complete(){
    if(saving||!finished)return
    setSaving(true);setProblem('')
    const result=await db.rpc('control_mark_intro_watched')
    if(result.error||result.data!==true){setProblem('Não foi possível confirmar a apresentação. Tente novamente.');setSaving(false);return}
    onDone()
  }
  return <div className="cp-intro-layer" role="dialog" aria-modal="true" aria-label="Boas-vindas ao CONTROLE+">
    <video ref={video} className="cp-intro-video" src={url} playsInline preload="auto" disablePictureInPicture controls={false} onEnded={()=>{setFinished(true);setStarted(false)}} onError={()=>setProblem('Vídeo indisponível no momento.')} />
    <div className="cp-intro-shade"/>
    {!started&&!finished&&<div className="cp-intro-welcome"><strong>CONTROLE<span>+</span></strong><p>Sua nova experiência começa aqui.</p><button onClick={()=>void start()}><Play size={18} fill="currentColor"/> Iniciar experiência com som <Volume2 size={18}/></button></div>}
    {finished&&<div className="cp-intro-finish"><strong>CONTROLE<span>+</span></strong><h2>Seu próximo nível começa agora.</h2><button onClick={()=>void complete()} disabled={saving}>{saving?'Preparando sua conta...':'Entrar na ferramenta'}</button></div>}
    {problem&&<div className="cp-intro-error"><p>{problem}</p>{isAdmin&&<button onClick={onDone}>Entrar sem apresentação</button>}{!isAdmin&&<button onClick={onDone}>Continuar para a ferramenta</button>}</div>}
  </div>
}
