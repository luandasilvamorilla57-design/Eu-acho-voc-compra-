import React from 'react'
import {AlertTriangle,RefreshCw} from 'lucide-react'
import {reportClientError} from '../lib/errorReporter'

type State={failed:boolean}
export class ErrorBoundary extends React.Component<{children:React.ReactNode},State>{
  state:State={failed:false}
  static getDerivedStateFromError(){return{failed:true}}
  componentDidCatch(error:Error,info:React.ErrorInfo){reportClientError(error,'react.error-boundary',{componentStack:info.componentStack?.slice(0,3000)})}
  render(){
    if(!this.state.failed)return this.props.children
    return <div className="cp-fatal">
      <span><AlertTriangle size={24}/></span>
      <strong>O CONTROLE+ encontrou um erro inesperado.</strong>
      <p style={{color:'#777',fontSize:11}}>Seus dados continuam salvos no servidor.</p>
      <button onClick={()=>window.location.reload()}><RefreshCw size={15}/> Recarregar CONTROLE+</button>
    </div>
  }
}
