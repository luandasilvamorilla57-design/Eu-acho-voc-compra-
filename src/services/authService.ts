import { supabase } from '../lib/supabase'
import type { AuthMode } from '../components/auth/authCopy'
export async function runAuthAction(mode:AuthMode,email:string,password:string,confirm:string){
 if((mode==='register'||mode==='reset')&&password.length<6)throw new Error('A senha precisa ter pelo menos 6 caracteres.')
 if((mode==='register'||mode==='reset')&&password!==confirm)throw new Error('As senhas não conferem.')
 if(mode==='register'){const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});if(error)throw error;return 'Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.'}
 if(mode==='login'){const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;return ''}
 if(mode==='recover'){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});if(error)throw error;return 'Link enviado. Confira seu e-mail para continuar a recuperação da conta.'}
 const {error}=await supabase.auth.updateUser({password});if(error)throw error;await supabase.auth.signOut();return 'Senha atualizada. Entre novamente com a nova senha.'
}
