import { useEffect, useState } from 'react'
import { useSessionAuth } from './hooks/useSessionAuth'
import { useAnalyses } from './hooks/useAnalyses'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { NewAnalysisPage } from './pages/NewAnalysisPage'
import { HistoryPage } from './pages/HistoryPage'
import { AppShell } from './components/AppShell'
import { AnalysisModal } from './components/AnalysisModal'
import { StatusEditor } from './components/StatusEditor'
import type { View } from './components/BottomNav'
import type { AnaliseRow } from './types/database'

const initialDark=()=>{
  if(typeof window==='undefined')return true
  const saved=window.localStorage.getItem('brike-theme')
  if(saved==='light')return false
  if(saved==='dark')return true
  return true
}

export default function App(){
  const {session,ready,reset}=useSessionAuth()
  const [view,setView]=useState<View>('dashboard')
  const [dark,setDark]=useState(initialDark)
  const [selected,setSelected]=useState<AnaliseRow|null>(null)
  const [editing,setEditing]=useState<AnaliseRow|null>(null)
  const {items,load,updateStatus}=useAnalyses(!!session)

  useEffect(()=>{
    window.localStorage.setItem('brike-theme',dark?'dark':'light')
    document.documentElement.style.colorScheme=dark?'dark':'light'
    document.body.style.background=dark?'#06101c':'#eef5f4'
  },[dark])

  if(!ready)return <div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-600">Carregando radar...</div>
  if(!session||reset)return <AuthPage initialMode={reset?'reset':'login'}/>

  const page=view==='dashboard'
    ?<DashboardPage items={items} onNew={()=>setView('new')} onOpen={setSelected}/>
    :view==='new'
      ?<NewAnalysisPage onSaved={()=>{load();setView('dashboard')}}/>
      :<HistoryPage items={items} onOpen={setSelected} onEdit={setEditing}/>

  return <AppShell view={view} setView={setView} dark={dark} setDark={setDark} email={session.user.email}>
    {page}
    <AnalysisModal item={selected} onClose={()=>setSelected(null)}/>
    <StatusEditor item={editing} onClose={()=>setEditing(null)} onSave={async(s,b,v)=>{await updateStatus(editing!.id,s,b,v)}}/>
  </AppShell>
}
