import {useEffect,useRef,useState} from 'react'
import {Film,Play,Volume2,UploadCloud} from 'lucide-react'
import {supabase} from '../lib/supabase'
import './intro-video.css'

const bucket='controle-intro'
const path='boas-vindas.mp4'
const db=supabase as any

export function CinematicIntro({userId,isAdmin,onDone}:{userId:string;isAdmin:boolean;onDone:()=>void}){
  const [ready,setReady]=useState(false)
  const [started,setStarted]=useState(false)
  const [finished,setFinished]=useState(false)
  const [saving,setSaving]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [problem,setProblem]=useState('')
  const video=useRef<HTMLVideoElement>(null)
  const url=supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl

  async function verify(){
    try{
      const response=await fetch(url+'?t='+Date.now(),{method:'HEAD',cache:'no-store'})
      setReady(response.ok)
    }catch{setReady(false)}
  }
  useEffect(()=>{void verify()},[])
  async function upload(file:File){
    if(!isAdmin)return
    if(file.type!=='video/mp4'||file.size>30*1024*1024){setProblem('Escolha um MP4 de até 30 MB.');return}
    setUploading(true);setProblem('')
    try{
      const result=await supabase.storage.from(bucket).upload(path,file,{contentType:'video/mp4',upsert:true,cacheControl:'3600'})
      if(result.error)throw result.error
      setReady(true)
    }catch(error:any){setProblem(error?.message||'Falha ao publicar o vídeo.')}
    finally{setUploading(false)}
  }
  async function start(){
    setProblem('')
    try{await video.current?.play();setStarted(true)}
    catch{setProblem('Toque em Iniciar experiência para liberar o áudio.')}
  }
  async function complete(){
    if(saving||!finished)return
    setSaving(true);setProblem('')
    const result=await db.from('control_settings').update({intro_video_watched_at:new Date().toISOString()}).eq('user_id',userId)
    if(result.error){setProblem('Não foi possível confirmar a apresentação. Tente novamente.');setSaving(false);return}
    onDone()
  }
  // A ausência do arquivo nunca prende o usuário: a estreia passa a funcionar assim que o vídeo é publicado.
  if(!ready){
    if(!isAdmin){onDone();return null}
    return <div className="cp-intro-layer"><div className="cp-intro-setup"><Film size={36}/><h2>Estreia cinematográfica</h2><p>O vídeo está preparado para o primeiro acesso. Publique o MP4 de boas-vindas para ativar a apresentação.</p><label className="cp-intro-upload"><UploadCloud size={18}/>{uploading?'Enviando vídeo...':'Publicar vídeo MP4'}<input type="file" accept="video/mp4" disabled={uploading} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file)}}/></label>{problem&&<p role="alert">{problem}</p>}<button onClick={onDone}>Entrar sem apresentação</button></div></div>
  }
  return <div className="cp-intro-layer" role="dialog" aria-modal="true" aria-label="Boas-vindas ao CONTROLE+">
    <video ref={video} className="cp-intro-video" src={url} playsInline preload="auto" disablePictureInPicture controls={false} onEnded={()=>{setFinished(true);setStarted(false)}} onError={()=>setProblem('Vídeo indisponível no momento.')} onSeeking={event=>{if(!finished && event.currentTarget.currentTime>0)event.currentTarget.currentTime=0}}/>
    <div className="cp-intro-shade"/>
    {!started&&!finished&&<div className="cp-intro-welcome"><strong>CONTROLE<span>+</span></strong><p>Sua nova experiência começa aqui.</p><button onClick={()=>void start()}><Play size={18} fill="currentColor"/> Iniciar experiência com som <Volume2 size={18}/></button></div>}
    {finished&&<div className="cp-intro-finish"><strong>CONTROLE<span>+</span></strong><h2>Seu próximo nível começa agora.</h2><button onClick={()=>void complete()} disabled={saving}>{saving?'Preparando sua conta...':'Entrar na ferramenta'}</button></div>}
    {problem&&<div className="cp-intro-error"><p>{problem}</p>{isAdmin&&<button onClick={onDone}>Entrar sem apresentação</button>}{!isAdmin&&<button onClick={onDone}>Continuar para a ferramenta</button>}</div>}
  </div>
}
