import {useSessionAuth} from './hooks/useSessionAuth'
import {ControlAuth} from './control/ControlAuth'
import {ControlApp} from './control/ControlApp'

export default function App(){
  const {session,ready,reset}=useSessionAuth()

  if(!ready){
    return <div className="cp-loading">
      <div className="cp-brand"><span className="cp-brand-mark">C<span>+</span></span><span className="cp-brand-word">CONTROLE<span>+</span></span></div>
      <div className="cp-loading-line"><span/></div>
      <p>Abrindo seu controle...</p>
    </div>
  }

  if(!session||reset)return <ControlAuth reset={reset}/>

  return <ControlApp userId={session.user.id} email={session.user.email}/>
}
