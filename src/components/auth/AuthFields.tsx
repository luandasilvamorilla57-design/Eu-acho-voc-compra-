import { Check,Eye,EyeOff,LockKeyhole,Mail,ShieldCheck,X } from 'lucide-react'
import type { AuthMode } from './authCopy'
import { PASSWORD_MIN_LENGTH,passwordChecks } from '../../utils/password'

type Props={
  mode:AuthMode
  email:string
  password:string
  confirmPassword:string
  showPassword:boolean
  showConfirmPassword:boolean
  setEmail:(v:string)=>void
  setPassword:(v:string)=>void
  setConfirmPassword:(v:string)=>void
  setShowPassword:(v:boolean)=>void
  setShowConfirmPassword:(v:boolean)=>void
}

export function AuthFields(p:Props){
  const needsStrongPassword=p.mode==='register'||p.mode==='reset'
  const checks=passwordChecks(p.password)
  const showConfirmFeedback=needsStrongPassword&&p.confirmPassword.length>0
  const confirmMatches=p.password===p.confirmPassword

  return <>
    {p.mode!=='reset'&&<label className="text-xs font-semibold text-slate-400">
      E-mail
      <div className="input-shell mt-2">
        <Mail size={16} className="text-slate-600"/>
        <input required type="email" autoComplete="email" value={p.email} onChange={e=>p.setEmail(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" placeholder="voce@email.com"/>
      </div>
    </label>}

    {p.mode!=='recover'&&<>
      <Password
        label={p.mode==='reset'?'Nova senha':'Senha'}
        value={p.password}
        setValue={p.setPassword}
        show={p.showPassword}
        setShow={p.setShowPassword}
        icon="lock"
        autoComplete={p.mode==='login'?'current-password':'new-password'}
        invalid={false}
      />

      {needsStrongPassword&&<div className="password-rules" aria-live="polite">
        <Rule ok={checks.length} text={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}/>
        <Rule ok={checks.upper} text="1 letra maiúscula"/>
        <Rule ok={checks.lower} text="1 letra minúscula"/>
        <Rule ok={checks.number} text="1 número"/>
        <Rule ok={checks.symbol} text="1 caractere especial"/>
      </div>}
    </>}

    {needsStrongPassword&&<>
      <Password
        label="Confirmar senha"
        value={p.confirmPassword}
        setValue={p.setConfirmPassword}
        show={p.showConfirmPassword}
        setShow={p.setShowConfirmPassword}
        icon="shield"
        autoComplete="new-password"
        invalid={showConfirmFeedback&&!confirmMatches}
      />
      {showConfirmFeedback&&<div className={'password-match '+(confirmMatches?'is-ok':'is-error')}>
        {confirmMatches?<Check size={14}/>:<X size={14}/>}
        <span>{confirmMatches?'As senhas coincidem.':'As senhas precisam ser iguais.'}</span>
      </div>}
    </>}
  </>
}

function Password({
  label,value,setValue,show,setShow,icon,autoComplete,invalid
}:{
  label:string
  value:string
  setValue:(v:string)=>void
  show:boolean
  setShow:(v:boolean)=>void
  icon:'lock'|'shield'
  autoComplete:'current-password'|'new-password'
  invalid:boolean
}){
  return <label className="text-xs font-semibold text-slate-400">
    {label}
    <div className={'input-shell mt-2 '+(invalid?'is-invalid':'')}>
      {icon==='lock'?<LockKeyhole size={16} className="text-slate-600"/>:<ShieldCheck size={16} className="text-slate-600"/>}
      <input
        required
        autoComplete={autoComplete}
        type={show?'text':'password'}
        value={value}
        onChange={e=>setValue(e.target.value)}
        aria-invalid={invalid||undefined}
        className="w-full bg-transparent text-sm text-white outline-none"
        placeholder="••••••••"
      />
      <button type="button" onClick={()=>setShow(!show)} className="text-slate-500" aria-label={show?'Ocultar senha':'Mostrar senha'}>
        {show?<EyeOff size={17}/>:<Eye size={17}/>}
      </button>
    </div>
  </label>
}

function Rule({ok,text}:{ok:boolean;text:string}){
  return <div className={'password-rule '+(ok?'is-ok':'')}>
    <span>{ok?<Check size={12}/>:<span className="password-rule__dot"/>}</span>
    <b>{text}</b>
  </div>
}
