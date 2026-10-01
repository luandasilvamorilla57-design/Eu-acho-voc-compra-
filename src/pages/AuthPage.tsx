import { AuthShowcase } from '../components/auth/AuthShowcase'
import { AuthPanel } from '../components/auth/AuthPanel'
import { authCopy,type AuthMode } from '../components/auth/authCopy'
import { useAuthForm } from '../hooks/useAuthForm'

export function AuthPage({initialMode='login'}:{initialMode?:AuthMode}){
  const form=useAuthForm(initialMode)
  return <div className="auth-screen min-h-screen text-white lg:grid lg:grid-cols-[1.12fr_.88fr]">
    <AuthShowcase mode={form.mode}/>
    <AuthPanel {...form} copy={authCopy[form.mode]}/>
  </div>
}
