import { supabase } from '../lib/supabase'
import type { AuthMode } from '../components/auth/authCopy'

const APP_URL =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://radar-do-brique.vercel.app')

export async function runAuthAction(mode:AuthMode,email:string,password:string,confirm:string){
 if((mode==='register'||mode==='reset')&&password.length<6)throw new Error('A senha precisa ter pelo menos 6 caracteres.')
 if((mode==='register'||mode==='reset')&&password!==confirm)throw new Error('As senhas não conferem.')
 if(mode==='register'){
   const {error}=await supabase.auth.signUp({
     email,
     password,
     options:{emailRedirectTo:APP_URL}
   })
   if(error)throw error
   return 'Conta criada. Confirme seu e-mail e depois entre para escolher seu plano.'
 }
 if(mode==='login'){
   const {error}=await supabase.auth.signInWithPassword({email,password})
   if(error)throw error
   return ''
 }
 if(mode==='recover'){
   const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:APP_URL})
   if(error)throw error
   return 'Link enviado. Confira seu e-mail para continuar a recuperação da conta.'
 }
 const {error}=await supabase.auth.updateUser({password})
 if(error)throw error
 await supabase.auth.signOut()
 return 'Senha atualizada. Entre novamente com a nova senha.'
}
