import { useEffect, useState } from 'react'
import { useSessionAuth } from './hooks/useSessionAuth'
import { useAnalyses } from './hooks/useAnalyses'
import { usePurchases } from './hooks/usePurchases'
import { useRadarConfig } from './hooks/useRadarConfig'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { NewAnalysisPage } from './pages/NewAnalysisPage'
import { BoughtPage } from './pages/BoughtPage'
import { HistoryPage } from './pages/HistoryPage'
import { AppShell } from './components/AppShell'
import { AnalysisModal } from './components/AnalysisModal'
import { StatusEditor } from './components/StatusEditor'
import type { View } from './components/BottomNav'
import type { AnaliseRow } from './types/database'

const initialDark=()=>{if(typeof window==='undefined')return true;const saved=window.localStorage.getItem('brike-theme');return saved!=='light'}

export default function App(){
  const {session,ready,reset}=useSessionAuth()
  const [view,setView]=useState<View>('dashboard')
  const [dark,setDark]=useState(initialDark)
  const [selected,setSelected]=useState<AnaliseRow|null>(null)
  const [editing,setEditing]=useState<AnaliseRow|null>(null)

  const {items,load,updateStatus,resolveNegotiation,addNegotiationLog,reinspect}=useAnalyses(!!session)
  const {items:purchases,load:loadPurchases,createPurchase,markSold,updatePurchase}=usePurchases(!!session)
  const {config,save:saveConfig}=useRadarConfig(!!session)

  useEffect(()=>{window.localStorage.setItem('brike-theme',dark?'dark':'light');document.documentElement.style.colorScheme=dark?'dark':'light';document.body.style.background=dark?'#06101c':'#eef5f4'},[dark])

  if(!ready)return <div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-600">Carregando radar...</div>
  if(!session||reset)return <AuthPage initialMode={reset?'reset':'login'}/>

  const page=view==='dashboard'
    ?<DashboardPage items={items} purchases={purchases} config={config} onSaveConfig={saveConfig} onNew={()=>setView('new')} onOpen={setSelected}/>
    :view==='new'
      ?<NewAnalysisPage config={config} onSaved={async destination=>{await load();setView(destination)}}/>
      :view==='bought'
        ?<BoughtPage analyses={items} purchases={purchases} config={config} onCreate={async input=>{await createPurchase(input);await load()}} onSold={async(id,salePrice)=>{await markSold(id,salePrice);await load()}} onUpdate={updatePurchase}/>
        :<HistoryPage
            items={items}
            onOpen={setSelected}
            onEdit={setEditing}
            onNegotiationBought={async(id,price)=>{await resolveNegotiation(id,'bought',price);await loadPurchases()}}
            onNegotiationFailed={async id=>{await resolveNegotiation(id,'failed')}}
            onNegotiationLog={addNegotiationLog}
            onReinspect={reinspect}
          />

  return <AppShell view={view} setView={setView} dark={dark} setDark={setDark} email={session.user.email}>
    {page}
    <AnalysisModal item={selected} onClose={()=>setSelected(null)} config={config}/>
    <StatusEditor item={editing} onClose={()=>setEditing(null)} onSave={async(s,b,v)=>{const err=await updateStatus(editing!.id,s,b,v);if(!err)await loadPurchases()}}/>
  </AppShell>
}
