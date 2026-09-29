import { useEffect, useRef, useState } from 'react'
import { ChevronRight, KeyRound, LogOut, Mail, ShieldCheck, UserRound, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function AccountMenu({email}:{email?:string}){
  const [open,setOpen]=useState(false)
  const [passwordOpen,setPasswordOpen]=useState(false)
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const root=useRef<HTMLDivElement|null>(null)
  const initial=email?.[0]?.toUpperCase()||'U'

  useEffect(()=>{
    const close=(event:MouseEvent)=>{
      if(root.current&&!root.current.contains(event.target as Node))setOpen(false)
    }
    document.addEventListener('mousedown',close)
    return()=>document.removeEventListener('mousedown',close)
  },[])

  const changePassword=async(e:React.FormEvent)=>{
    e.preventDefault()
    setError('')
    setMessage('')
    if(password.length<6){setError('Use pelo menos 6 caracteres.');return}
    if(password!==confirm){setError('As senhas não conferem.');return}
    setBusy(true)
    const {error:e2}=await supabase.auth.updateUser({password})
    setBusy(false)
    if(e2){setError(e2.message);return}
    setMessage('Senha alterada com sucesso.')
    setPassword('')
    setConfirm('')
  }

  return <div ref={root} className="account-menu-root relative">
    <button
      type="button"
      onClick={()=>setOpen(v=>!v)}
      aria-label="Abrir menu da conta"
      aria-expanded={open}
      className={`brand-avatar account-avatar transition ${open?'account-avatar--open':''}`}
    >{initial}</button>

    {open&&<div className="account-popover">
      <div className="account-popover__head">
        <div className="account-popover__avatar">{initial}</div>
        <div className="min-w-0">
          <span className="block text-[9px] font-bold uppercase tracking-[.18em] text-emerald-400">CONTA ATIVA</span>
          <strong className="mt-1 block truncate text-sm account-primary-text">Minha conta</strong>
          <span className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-slate-500"><Mail size={11}/>{email||'Usuário'}</span>
        </div>
      </div>

      <div className="account-popover__status">
        <ShieldCheck size={14}/>
        <div><strong>Sessão protegida</strong><span>Autenticação via Supabase</span></div>
      </div>

      <div className="account-popover__actions">
        <button type="button" onClick={()=>{setPasswordOpen(true);setOpen(false)}}>
          <span className="account-action-icon"><KeyRound size={15}/></span>
          <span><strong>Alterar senha</strong><small>Defina uma nova senha de acesso</small></span>
          <ChevronRight size={15}/>
        </button>
        <button type="button" className="account-action--danger" onClick={()=>supabase.auth.signOut()}>
          <span className="account-action-icon"><LogOut size={15}/></span>
          <span><strong>Sair da conta</strong><small>Encerrar esta sessão</small></span>
          <ChevronRight size={15}/>
        </button>
      </div>
    </div>}

    {passwordOpen&&<div className="account-modal" role="dialog" aria-modal="true" aria-label="Alterar senha">
      <button type="button" className="account-modal__backdrop" aria-label="Fechar" onClick={()=>setPasswordOpen(false)}/>
      <form onSubmit={changePassword} className="account-modal__card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[.18em] text-emerald-400">SEGURANÇA</span>
            <h3 className="font-display mt-1 text-xl font-bold account-primary-text">Alterar senha</h3>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">Atualize a senha usada para entrar no BRIKE RADAR.</p>
          </div>
          <button type="button" onClick={()=>setPasswordOpen(false)} className="account-close"><X size={16}/></button>
        </div>

        <label className="mt-5 block text-xs font-semibold text-slate-500">
          Nova senha
          <input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} className="account-input" placeholder="Mínimo de 6 caracteres"/>
        </label>
        <label className="mt-4 block text-xs font-semibold text-slate-500">
          Confirmar nova senha
          <input type="password" minLength={6} required value={confirm} onChange={e=>setConfirm(e.target.value)} className="account-input" placeholder="Repita a nova senha"/>
        </label>

        {error&&<div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>}
        {message&&<div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs text-emerald-500">{message}</div>}

        <button disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950 disabled:opacity-50">
          <UserRound size={16}/>{busy?'Salvando...':'Salvar nova senha'}
        </button>
      </form>
    </div>}
  </div>
}
