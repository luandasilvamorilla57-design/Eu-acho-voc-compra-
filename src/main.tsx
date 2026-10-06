import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import {ErrorBoundary} from './components/ErrorBoundary'
import {reportClientError} from './lib/errorReporter'
import './styles.css'

window.addEventListener('beforeinstallprompt',(event:any)=>{
  event.preventDefault()
  ;(window as any).__controlPlusInstallPrompt=event
  window.dispatchEvent(new Event('control-plus-install-ready'))
})
window.addEventListener('unhandledrejection',event=>{reportClientError(event.reason,'window.unhandledrejection')})
window.addEventListener('error',event=>{if(event.error)reportClientError(event.error,'window.error')})

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(error=>reportClientError(error,'pwa.service-worker'))
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>)
