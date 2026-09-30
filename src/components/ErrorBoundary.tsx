import React from 'react'
import { AlertTriangle,RefreshCw } from 'lucide-react'
import { reportClientError } from '../lib/errorReporter'

type State={failed:boolean}
export class ErrorBoundary extends React.Component<{children:React.ReactNode},State>{
  state:State={failed:false}
  static getDerivedStateFromError(){return{failed:true}}
  componentDidCatch(error:Error,info:React.ErrorInfo){reportClientError(error,'react.error-boundary',{componentStack:info.componentStack?.slice(0,3000)})}
  render(){
    if(!this.state.failed)return this.props.children
    return <div className="fatal-screen"><div className="fatal-card"><span><AlertTriangle size={22}/></span><strong>O Radar encontrou um erro inesperado.</strong><p>Seus dados continuam salvos. Recarregue a aplicação para retomar de onde parou.</p><button onClick={()=>window.location.reload()}><RefreshCw size={15}/> Recarregar BRIKE RADAR</button></div></div>
  }
}
