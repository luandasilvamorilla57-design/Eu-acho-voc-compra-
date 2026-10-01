import { AuthShowcase } from '../components/auth/AuthShowcase'
import { AuthPanel } from '../components/auth/AuthPanel'
import { authCopy,type AuthMode } from '../components/auth/authCopy'
import { useAuthForm } from '../hooks/useAuthForm'

export function AuthPage({initialMode='login'}:{initialMode?:AuthMode}){
  const form=useAuthForm(initialMode)
  const isRegister=form.mode==='register'

  if(isRegister){
    return <div className="auth-screen auth-screen--register min-h-screen text-white lg:grid lg:grid-cols-[1.18fr_.82fr]">
      <AuthShowcase/>
      <AuthPanel {...form} copy={authCopy[form.mode]}/>
    </div>
  }

  return <div className={'auth-screen auth-screen--focus auth-screen--'+form.mode+' min-h-screen text-white'}>
    <AuthPanel {...form} copy={authCopy[form.mode]}/>
  </div>
}
