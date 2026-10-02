import { useEffect,useRef,useState } from 'react'
import type { AuthMode } from '../components/auth/authCopy'
import { runAuthAction } from '../services/authService'

export function useAuthForm(initialMode:AuthMode){
  const [mode,setMode]=useState<AuthMode>(initialMode)
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [showConfirmPassword,setShowConfirmPassword]=useState(false)
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')
  const [error,setError]=useState('')
  const submitting=useRef(false)

  useEffect(()=>{
    setMode(initialMode)
    setMsg('')
    setError('')
  },[initialMode])

  const switchMode=(next:AuthMode)=>{
    if(submitting.current)return
    setMode(next)
    setPassword('')
    setConfirmPassword('')
    setMsg('')
    setError('')
  }

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(submitting.current)return

    submitting.current=true
    setBusy(true)
    setMsg('')
    setError('')

    try{
      const m=await runAuthAction(mode,email.trim(),password,confirmPassword)

      if(mode==='login'){
        // Supabase has already persisted the session when signIn resolves.
        // A clean navigation also removes stale checkout/recovery query strings.
        window.location.replace('/')
        return
      }

      setMsg(m)
      if(mode==='reset'){
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setMode('login')
      }
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível concluir a operação.')
    }finally{
      submitting.current=false
      setBusy(false)
    }
  }

  return{
    mode,email,password,confirmPassword,showPassword,showConfirmPassword,busy,msg,error,
    setEmail,setPassword,setConfirmPassword,setShowPassword,setShowConfirmPassword,switchMode,submit
  }
}
