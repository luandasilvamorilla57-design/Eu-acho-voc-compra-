import { useEffect,useRef,useState } from 'react'
import { ChevronRight,CreditCard,Download,KeyRound,LayoutDashboard,LogOut,Mail,ShieldCheck,Trash2,UserRound,X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { reportClientError } from '../../lib/errorReporter'
import { PASSWORD_MIN_LENGTH,passwordError } from '../../utils/password'
import { signOutFast } from '../../services/sessionService'

export function AccountMenu({email,onManageSubscription,onOpenAdmin,ownerAccess=false}:{email?:string;onManageSubscription?:()=>void;onOpenAdmin?:()=>void;ownerAccess?:boolean}){
  const [open,setOpen]=useState(false)
  const [passwordOpen,setPasswordOpen]=useState(false)
  const [deleteOpen,setDeleteOpen]=useState(false)
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [deletePassword,setDeletePassword]=useState('')
  const [deleteWord,setDeleteWord]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [installPrompt,setInstallPrompt]=useState<any>(()=>(window as any).__brikeInstallPrompt||null)
  const root=useRef<HTMLDivElement|null>(null)
  const initial=email?.[0]?.toUpperCase()||'U'

  useEffect(()=>{
    const close=(event:MouseEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)}
    const installReady=()=>setInstallPrompt((window as any).__brikeInstallPrompt||null)
    document.addEventListener('mousedown',close)
    window.addEventListener('brike-install-ready',installReady)
    return()=>{document.removeEventListener('mousedown',close);window.removeEventListener('brike-install-ready',installReady)}
  },[])

  const changePassword=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');setMessage('')
    const issue=passwordError(password);if(issue){setError(issue);return}
    if(password!==confirm){setError('As senhas não conferem.');return}
    setBusy(true)
    const {error:e2}=await supabase.auth.updateUser({password})
    setBusy(false)
    if(e2){setError(e2.message);return}
    setMessage('Senha alterada com sucesso.');setPassword('');setConfirm('')
  }

  const install=async()=>{
    if(!installPrompt)return
    try{await installPrompt.prompt();await installPrompt.userChoice}catch(error){reportClientError(error,'pwa.install')}
    ;(window as any).__brikeInstallPrompt=null
    setInstallPrompt(null);setOpen(false)
  }

  const deleteAccount=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');setMessage('')
    if(deleteWord.trim().toUpperCase()!=='EXCLUIR'){setError('Digite EXCLUIR para confirmar.');return}
    if(!email||!deletePassword){setError('Informe sua senha atual.');return}
    setBusy(true)
    const {error:reauthError}=await supabase.auth.signInWithPassword({email,password:deletePassword})
    if(reauthError){setBusy(false);setError('Senha atual incorreta.');return}
    const {data,error}=await supabase.functions.invoke('excluir-conta')
    if(error||data?.error){setBusy(false);const e=error||new Error(data?.error);reportClientError(e,'account.delete');setError(data?.error||error?.message||'Não foi possível excluir a conta.');return}
    await signOutFast()
  }

  const resetModals=()=>{setError('');setMessage('');setPassword('');setConfirm('');setDeletePassword('');setDeleteWord('')}

  return <div ref={root} className="account-menu-root relative">
    <button type="button" onClick={()=>setOpen(v=>!v)} aria-label="Abrir menu da conta" aria-expanded={open} className={'brand-avatar account-avatar transition '+(open?'account-avatar--open':'')}>{initial}</button>

    {open&&<div className="account-popover">
      <div className="account-popover__head"><div className="account-popover__avatar">{initial}</div><div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-emerald-400">CONTA ATIVA</span><strong className="mt-1 block truncate text-sm account-primary-text">Minha conta</strong><span className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-slate-500"><Mail size={11}/>{email||'Usuário'}</span></div></div>
      <div className="account-popover__status"><ShieldCheck size={14}/><div><strong>Sessão protegida</strong><span>Autenticação via Supabase</span></div></div>
      <div className="account-popover__actions">
        {installPrompt&&<button type="button" onClick={install}><span className="account-action-icon"><Download size={15}/></span><span><strong>Instalar BRIKE RADAR</strong><small>Usar como aplicativo no celular</small></span><ChevronRight size={15}/></button>}
        {onManageSubscription&&<button type="button" onClick={()=>{setOpen(false);onManageSubscription()}}><span className="account-action-icon"><CreditCard size={15}/></span><span><strong>{ownerAccess?'Acesso da conta':'Minha assinatura'}</strong><small>{ownerAccess?'Conta proprietária ilimitada':'Plano, consumo, créditos e cobrança'}</small></span><ChevronRight size={15}/></button>}
        {ownerAccess&&onOpenAdmin&&<button type="button" onClick={()=>{setOpen(false);onOpenAdmin()}}><span className="account-action-icon"><LayoutDashboard size={15}/></span><span><strong>Painel proprietário</strong><small>Usuários, receita, consumo e erros</small></span><ChevronRight size={15}/></button>}
        <button type="button" onClick={()=>{resetModals();setPasswordOpen(true);setOpen(false)}}><span className="account-action-icon"><KeyRound size={15}/></span><span><strong>Alterar senha</strong><small>Defina uma nova senha de acesso</small></span><ChevronRight size={15}/></button>
        <button type="button" className="account-action--danger" onClick={()=>{resetModals();setDeleteOpen(true);setOpen(false)}}><span className="account-action-icon"><Trash2 size={15}/></span><span><strong>Excluir conta</strong><small>Apagar conta, dados e fotos privadas</small></span><ChevronRight size={15}/></button>
        <button type="button" className="account-action--danger" onClick={()=>void signOutFast()}><span className="account-action-icon"><LogOut size={15}/></span><span><strong>Sair da conta</strong><small>Encerrar esta sessão</small></span><ChevronRight size={15}/></button>
      </div>
    </div>}

    {passwordOpen&&<div className="account-modal" role="dialog" aria-modal="true" aria-label="Alterar senha"><button type="button" className="account-modal__backdrop" aria-label="Fechar" onClick={()=>setPasswordOpen(false)}/><form onSubmit={changePassword} className="account-modal__card"><div className="flex items-start justify-between gap-4"><div><span className="premium-eyebrow text-emerald-400">SEGURANÇA</span><h3 className="font-display mt-1.5 text-xl font-bold account-primary-text">Alterar senha</h3><p className="mt-2 text-[11px] leading-5 text-slate-500">Atualize a senha usada para entrar no BRIKE RADAR.</p></div><button type="button" onClick={()=>setPasswordOpen(false)} className="account-close"><X size={16}/></button></div><label className="mt-5 block text-xs font-semibold text-slate-500">Nova senha<input type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required value={password} onChange={e=>setPassword(e.target.value)} className="account-input" placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres, com maiúscula, número e símbolo`}/></label><label className="mt-4 block text-xs font-semibold text-slate-500">Confirmar nova senha<input type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required value={confirm} onChange={e=>setConfirm(e.target.value)} className="account-input" placeholder="Repita a nova senha"/></label>{error&&<ErrorBox text={error}/>} {message&&<div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3 text-xs text-emerald-500">{message}</div>}<button disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950 disabled:opacity-50"><UserRound size={16}/>{busy?'Salvando...':'Salvar nova senha'}</button></form></div>}

    {deleteOpen&&<div className="account-modal" role="dialog" aria-modal="true" aria-label="Excluir conta"><button type="button" className="account-modal__backdrop" aria-label="Fechar" onClick={()=>setDeleteOpen(false)}/><form onSubmit={deleteAccount} className="account-modal__card account-delete-card"><div className="flex items-start justify-between gap-4"><div><span className="premium-eyebrow text-red-400">ZONA DE SEGURANÇA</span><h3 className="font-display mt-1.5 text-xl font-bold account-primary-text">Excluir conta definitivamente</h3><p className="mt-2 text-[11px] leading-5 text-slate-500">Análises, compras, configurações e fotos privadas serão apagadas. Esta ação não pode ser desfeita.</p></div><button type="button" onClick={()=>setDeleteOpen(false)} className="account-close"><X size={16}/></button></div><label className="mt-5 block text-xs font-semibold text-slate-500">Senha atual<input type="password" autoComplete="current-password" required value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} className="account-input" placeholder="Confirme sua identidade"/></label><label className="mt-4 block text-xs font-semibold text-slate-500">Digite <b className="text-red-400">EXCLUIR</b><input required value={deleteWord} onChange={e=>setDeleteWord(e.target.value)} className="account-input" placeholder="EXCLUIR"/></label>{error&&<ErrorBox text={error}/>}<button disabled={busy||deleteWord.trim().toUpperCase()!=='EXCLUIR'} className="account-delete-button"><Trash2 size={16}/>{busy?'Excluindo com segurança...':'Excluir minha conta'}</button></form></div>}
  </div>
}
function ErrorBox({text}:{text:string}){return <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs text-red-300">{text}</div>}
