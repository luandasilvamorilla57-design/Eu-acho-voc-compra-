import { ArrowRight,LockKeyhole } from 'lucide-react'
import type { AuthCopy,AuthMode } from './authCopy'
import { AuthFields } from './AuthFields'
import { AuthHints } from './AuthHints'
import { AuthFooter,AuthTabs,Notice } from './AuthPanelParts'

type P={
  mode:AuthMode
  copy:AuthCopy
  email:string
  password:string
  confirmPassword:string
  showPassword:boolean
  showConfirmPassword:boolean
  busy:boolean
  msg:string
  error:string
  setEmail:(v:string)=>void
  setPassword:(v:string)=>void
  setConfirmPassword:(v:string)=>void
  setShowPassword:(v:boolean)=>void
  setShowConfirmPassword:(v:boolean)=>void
  switchMode:(m:AuthMode)=>void
  submit:(e:React.FormEvent)=>void
}

export function AuthPanel(p:P){
  return <section className="auth-panel-section relative flex min-h-screen items-center justify-center p-5 sm:p-8 lg:p-10">
    <div className="auth-orb auth-orb--three"/>
    <div className="auth-panel-grid" aria-hidden="true"/>
    <div className="auth-card relative z-10 w-full max-w-[560px] rounded-[32px] p-5 sm:p-7 lg:p-8">
      <div className="auth-card__radar" aria-hidden="true"><i/><i/><i/><span/></div>

      <div className="auth-card__header">
        <div className="auth-card__eyebrow"><span><LockKeyhole size={15}/></span>{p.copy.eyebrow}</div>
        <h2 className="font-display">{p.copy.title}</h2>
        <p>{p.copy.subtitle}</p>
      </div>

      <AuthTabs mode={p.mode} setMode={p.switchMode}/>

      <form onSubmit={p.submit} className="auth-form grid gap-4">
        <AuthFields {...p}/>
        <AuthHints mode={p.mode} onRecover={()=>p.switchMode('recover')}/>
        {p.error&&<Notice tone="red">{p.error}</Notice>}
        {p.msg&&<Notice tone="green">{p.msg}</Notice>}
        <button disabled={p.busy} className="btn-glow auth-primary-cta mt-1">
          <span>{p.busy?'Aguarde...':p.copy.button}</span>
          <ArrowRight size={18}/>
        </button>
      </form>

      <AuthFooter mode={p.mode} setMode={p.switchMode}/>
    </div>
  </section>
}
