import { Layers3 } from 'lucide-react'
import type { AuthMode } from './authCopy'

export function AuthTabs({mode,setMode}:{mode:AuthMode;setMode:(m:AuthMode)=>void}){
  return <div className="auth-tabs mb-6 grid grid-cols-3 gap-2 rounded-[18px] p-1.5">
    {(['login','register','recover'] as AuthMode[]).map(m=><button
      type="button"
      key={m}
      onClick={()=>setMode(m)}
      className={`auth-tab ${mode===m||(m==='recover'&&mode==='reset')?'auth-tab--active':''}`}
    >{m==='login'?'Entrar':m==='register'?'Criar conta':'Recuperar'}</button>)}
  </div>
}

export function AuthFooter({mode,setMode}:{mode:AuthMode;setMode:(m:AuthMode)=>void}){
  const isLogin=mode==='login'
  return <div className="auth-footer">
    <div className="auth-footer__brand"><Layers3 size={14}/> <span>BRIKE RADAR</span><i/> Supabase Auth</div>
    <button type="button" onClick={()=>setMode(isLogin?'register':'login')}>
      {isLogin?'Ainda não tem conta?':'Já tem uma conta?'} <strong>{isLogin?'Criar conta':'Voltar para login'}</strong>
    </button>
  </div>
}

export function Notice({tone,children}:{tone:'red'|'green';children:React.ReactNode}){
  return <div className={`auth-notice is-${tone}`}>{children}</div>
}
