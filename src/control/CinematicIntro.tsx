import {useRef,useState} from 'react'
import {ArrowRight,Play,Volume2} from 'lucide-react'
import {supabase} from '../lib/supabase'
import './intro-video.css'

const VIDEO_SRC='/videos/controle-plus-apresentacao.mp4'

export function CinematicIntro({onDone}:{userId:string;isAdmin:boolean;onDone:()=>void}){
  const videoRef=useRef<HTMLVideoElement>(null)
  const savingRef=useRef(false)
  const [started,setStarted]=useState(false)
  const [starting,setStarting]=useState(false)
  const [ended,setEnded]=useState(false)
  const [error,setError]=useState('')
  const [videoError,setVideoError]=useState(false)

  async function playWithSound(){
    if(starting||videoError||ended)return
    const player=videoRef.current
    if(!player)return
    setStarting(true)
    setError('')
    try{
      player.muted=false
      player.volume=1
      player.currentTime=0
      await player.play()
      setStarted(true)
    }catch{
      setError('Não conseguimos iniciar o áudio. Toque novamente no botão.')
    }finally{setStarting(false)}
  }

  async function finish(){
    if(savingRef.current)return
    savingRef.current=true
    setEnded(true)
    setError('')
    const result=await (supabase as any).rpc('control_mark_intro_watched')
    if(result.error||result.data!==true){
      savingRef.current=false
      setError('Não foi possível concluir sua entrada. Verifique a conexão e tente novamente.')
      return
    }
    onDone()
  }

  return <div className="cp-intro-layer" role="dialog" aria-modal="true" aria-label="Apresentação de boas-vindas do CONTROLE+">
    <video
      ref={videoRef}
      className="cp-intro-video"
      src={VIDEO_SRC}
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      onEnded={()=>void finish()}
      onError={()=>{setVideoError(true);setError('Não foi possível carregar o comercial.')}}/>
    <div className={started?'cp-intro-shade is-playing':'cp-intro-shade'}/>
    {!started&&!ended&&!videoError&&<div className="cp-intro-welcome">
      <button className="cp-intro-start" type="button" disabled={starting} onClick={()=>void playWithSound()}>
        <span className="cp-intro-play-icon"><Play size={24} fill="currentColor"/></span>
        <span>ACESSAR FERRAMENTA</span>
        <ArrowRight size={21}/>
      </button>
      <span className="cp-intro-sound-hint"><Volume2 size={16}/> Toque para iniciar a apresentação com som</span>
    </div>}
    {ended&&<div className="cp-intro-finish"><strong>CONTROLE<span>+</span></strong><p>Preparando sua ferramenta...</p></div>}
    {error&&<div className="cp-intro-error" role="alert"><p>{error}</p>
      {videoError?<button onClick={onDone}>Continuar para a ferramenta</button>:ended?<button onClick={()=>void finish()}>Tentar novamente</button>:null}
    </div>}
  </div>
}
