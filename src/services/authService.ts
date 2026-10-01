import { supabase } from '../lib/supabase'
import type { AuthMode } from '../components/auth/authCopy'
import { passwordError } from '../utils/password'

const APP_URL =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://radar-do-brique.vercel.app')

function friendlyAuthError(mode:AuthMode,error:unknown){
  const message=error instanceof Error?error.message:String(error||'')
  const lower=message.toLowerCase()

  if(mode==='login'){
    if(lower.includes('invalid login credentials'))return new Error('Senha incorreta. Verifique a senha e tente novamente.')
    if(lower.includes('email not confirmed'))return new Error('Confirme seu e-mail antes de entrar.')
    if(lower.includes('too many requests')||lower.includes('rate limit'))return new Error('Muitas tentativas seguidas. Aguarde um momento e tente novamente.')
  }

  if(lower.includes('user already registered'))return new Error('Este e-mail já possui uma conta. Use a opção Entrar.')
  if(lower.includes('password'))return new Error(message)
  return error instanceof Error?error:new Error('Não foi possível concluir a operação.')
}

export async function runAuthAction(mode:AuthMode,email:string,password:string,confirm:string){
  if(mode==='register'||mode==='reset'){
    const issue=passwordError(password)
    if(issue)throw new Error(issue)
    if(password!==confirm)throw new Error('As senhas precisam ser iguais.')
  }

  if(mode==='register'){
    const {error}=await supabase.auth.signUp({
      email,
      password,
      options:{emailRedirectTo:APP_URL}
    })
    if(error)throw friendlyAuthError(mode,error)
    return 'Conta criada. Confirme seu e-mail e depois entre para escolher seu plano.'
  }

  if(mode==='login'){
    const {error}=await supabase.auth.signInWithPassword({email,password})
    if(error)throw friendlyAuthError(mode,error)
    return ''
  }

  if(mode==='recover'){
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:APP_URL})
    if(error)throw friendlyAuthError(mode,error)
    return 'Link enviado. Confira seu e-mail para continuar a recuperação da conta.'
  }

  const {error}=await supabase.auth.updateUser({password})
  if(error)throw friendlyAuthError(mode,error)
  await supabase.auth.signOut()
  return 'Senha atualizada. Entre novamente com a nova senha.'
}
