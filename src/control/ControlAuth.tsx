import {useMemo,useState} from 'react'
import {ArrowLeft,Eye,EyeOff,LockKeyhole,Mail,ShieldCheck} from 'lucide-react'
import {supabase} from '../lib/supabase'

type Mode='login'|'register'|'forgot'|'reset'

export function ControlAuth({reset=false}:{reset?:boolean}){
  const [mode,setMode]=useState<Mode>(reset?'reset':'login')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [show,setShow]=useState(false)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState<string|null>(null)
  const [error,setError]=useState<string|null>(null)

  const title=useMemo(()=>({
    login:'Bem-vindo de volta.',
    register:'Comece a controlar seu negócio.',
    forgot:'Recupere seu acesso.',
    reset:'Crie sua nova senha.'
  })[mode],[mode])

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError(null);setMessage(null)
    try{
      if(mode==='register'){
        if(password.length<8)throw new Error('Use uma senha com pelo menos 8 caracteres.')
        if(password!==confirm)throw new Error('As senhas não são iguais.')
        const result=await supabase.auth.signUp({email,password,options:{data:{full_name:name.trim()}}})
        if(result.error)throw result.error
        if(!result.data.session)setMessage('Conta criada. Confira seu e-mail para confirmar o acesso.')
      }else if(mode==='login'){
        const result=await supabase.auth.signInWithPassword({email,password})
        if(result.error)throw new Error('E-mail ou senha incorretos.')
      }else if(mode==='forgot'){
        const result=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin})
        if(result.error)throw result.error
        setMessage('Enviamos um link de recuperação para seu e-mail.')
      }else{
        if(password.length<8)throw new Error('Use uma senha com pelo menos 8 caracteres.')
        if(password!==confirm)throw new Error('As senhas não são iguais.')
        const result=await supabase.auth.updateUser({password})
        if(result.error)throw result.error
        setMessage('Senha atualizada. Você já pode continuar.')
        window.history.replaceState({},'',window.location.pathname)
      }
    }catch(err:any){setError(err?.message||'Não foi possível concluir agora.')}
    finally{setBusy(false)}
  }

  return <main className="cp-auth">
    <div className="cp-auth-glow cp-auth-glow-a"/>
    <div className="cp-auth-glow cp-auth-glow-b"/>
    <section className="cp-auth-wrap">
      <div className="cp-auth-brand">
        <Brand/>
        <div className="cp-auth-promise">
          <span className="cp-eyebrow">CONTROLE PARA QUEM COMPRA E REVENDE</span>
          <h1>Seu estoque, seu caixa e seu lucro. <em>Sem complicação.</em></h1>
          <p>Registre o que comprou, acompanhe cada produto e saiba exatamente onde seu dinheiro está.</p>
          <div className="cp-auth-points">
            <span><ShieldCheck size={18}/> Seus dados separados e protegidos</span>
            <span><LockKeyhole size={18}/> Sem depender de IA paga para funcionar</span>
          </div>
        </div>
      </div>

      <form className="cp-auth-card" onSubmit={submit}>
        {mode!=='login'&&<button type="button" className="cp-back-link" onClick={()=>{setMode('login');setError(null);setMessage(null)}}><ArrowLeft size={17}/> Voltar</button>}
        <span className="cp-card-kicker">{mode==='register'?'PRIMEIRO PASSO':'ACESSO SEGURO'}</span>
        <h2>{title}</h2>
        <p className="cp-auth-sub">{mode==='login'?'Entre para continuar de onde parou.':mode==='register'?'Leva menos de um minuto. Você organiza o resto no seu ritmo.':mode==='forgot'?'Informe seu e-mail e enviaremos o link.':'Escolha uma senha segura para sua conta.'}</p>

        {mode==='register'&&<label className="cp-field"><span>Seu nome</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Como podemos te chamar?" required/></label>}
        {mode!=='reset'&&<label className="cp-field"><span>E-mail</span><div className="cp-input-icon"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" required/></div></label>}
        {mode!=='forgot'&&<label className="cp-field"><span>Senha</span><div className="cp-input-icon"><LockKeyhole size={18}/><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete={mode==='login'?'current-password':'new-password'} required/><button type="button" className="cp-show" onClick={()=>setShow(v=>!v)} aria-label="Mostrar senha">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
        {(mode==='register'||mode==='reset')&&<label className="cp-field"><span>Confirmar senha</span><input type={show?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repita a senha" required/></label>}

        {error&&<div className="cp-form-error">{error}</div>}
        {message&&<div className="cp-form-success">{message}</div>}

        <button className="cp-primary cp-auth-submit" disabled={busy}>{busy?'Processando...':mode==='login'?'Entrar no CONTROLE+':mode==='register'?'Criar minha conta':mode==='forgot'?'Enviar link':'Salvar nova senha'}</button>

        {mode==='login'&&<div className="cp-auth-links"><button type="button" onClick={()=>setMode('forgot')}>Esqueci minha senha</button><span>•</span><button type="button" onClick={()=>setMode('register')}>Criar conta</button></div>}
      </form>
    </section>
  </main>
}

function Brand(){
  return <div className="cp-brand"><span className="cp-brand-mark">C<span>+</span></span><span className="cp-brand-word">CONTROLE<span>+</span></span></div>
}
