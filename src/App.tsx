import { useEffect,useMemo,useState } from 'react'
import { useSessionAuth } from './hooks/useSessionAuth'
import { useAnalyses } from './hooks/useAnalyses'
import { usePurchases } from './hooks/usePurchases'
import { useRadarConfig } from './hooks/useRadarConfig'
import { usePlanAccess } from './hooks/usePlanAccess'
import { useResaleDrafts } from './hooks/useResaleDrafts'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { RadarPage } from './pages/RadarPage'
import { NewAnalysisPage } from './pages/NewAnalysisPage'
import { BoughtPage } from './pages/BoughtPage'
import { HistoryPage } from './pages/HistoryPage'
import { PlansPage } from './pages/PlansPage'
import { AppShell } from './components/AppShell'
import { AnalysisModal } from './components/AnalysisModal'
import { StatusEditor } from './components/StatusEditor'
import type { View } from './components/BottomNav'
import type { AnaliseRow } from './types/database'
import { buildRadarAlerts } from './utils/radarAlerts'
import { buildUserIntelligence } from './utils/userIntelligence'

const initialDark=()=>{if(typeof window==='undefined')return true;const saved=window.localStorage.getItem('brike-theme');return saved!=='light'}

export default function App(){
  const {session,ready,reset}=useSessionAuth()
  const [view,setView]=useState<View>('dashboard')
  const [dark,setDark]=useState(initialDark)
  const [selected,setSelected]=useState<AnaliseRow|null>(null)
  const [editing,setEditing]=useState<AnaliseRow|null>(null)

  const {config,loading:configLoading,save:saveConfig}=useRadarConfig(!!session)
  const {loading:planLoading,checked:planChecked,hasAccess,refresh:refreshAccess}=usePlanAccess(!!session)
  const appDataActive=!!session&&hasAccess
  const {items,load,updateStatus,resolveNegotiation,addNegotiationLog,reinspect}=useAnalyses(appDataActive)
  const {items:purchases,load:loadPurchases,createPurchase,markSold,updatePurchase,uploadPhotos,removePhoto}=usePurchases(appDataActive)
  const {items:drafts,saveGenerated:saveResaleDraft,updateCopy:updateResaleDraftCopy,remove:removeResaleDraft}=useResaleDrafts(appDataActive)

  const alerts=useMemo(()=>buildRadarAlerts(items,purchases,config),[items,purchases,config])
  const intelligence=useMemo(()=>buildUserIntelligence(purchases,items),[purchases,items])

  useEffect(()=>{window.localStorage.setItem('brike-theme',dark?'dark':'light');document.documentElement.style.colorScheme=dark?'dark':'light';document.body.style.background=dark?'#06101c':'#eef5f4'},[dark])

  if(!ready)return <div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-600">Carregando radar...</div>
  if(!session||reset)return <AuthPage initialMode={reset?'reset':'login'}/>
  if(configLoading||!config.user_id||planLoading||!planChecked)return <div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-500">Validando seu acesso com segurança...</div>
  if(!hasAccess)return <PlansPage email={session.user.email} onRefreshAccess={refreshAccess}/>

  let page:React.ReactNode
  if(view==='dashboard')page=<DashboardPage items={items} purchases={purchases} config={config} onSaveConfig={saveConfig} onNew={()=>setView('new')} onOpen={setSelected}/>
  else if(view==='radar')page=<RadarPage analyses={items} purchases={purchases} config={config} alerts={alerts} insights={intelligence.insights} onNavigate={setView} onOpen={setSelected}/>
  else if(view==='new')page=<NewAnalysisPage config={config} userProfile={intelligence.profile} onSaved={async destination=>{await load();setView(destination)}}/>
  else if(view==='bought')page=<BoughtPage analyses={items} purchases={purchases} drafts={drafts} config={config} onCreate={async input=>{await createPurchase(input);await load()}} onSold={async(id,salePrice)=>{await markSold(id,salePrice);await load()}} onUpdate={updatePurchase} onUploadPhotos={uploadPhotos} onRemovePhoto={removePhoto} onSaveDraft={saveResaleDraft} onUpdateDraftCopy={updateResaleDraftCopy} onDeleteDraft={removeResaleDraft}/>
  else page=<HistoryPage items={items} config={config} onOpen={setSelected} onEdit={setEditing} onNegotiationBought={async(id,price)=>{await resolveNegotiation(id,'bought',price);await loadPurchases()}} onNegotiationFailed={async id=>{await resolveNegotiation(id,'failed')}} onNegotiationLog={addNegotiationLog} onReinspect={reinspect}/>

  return <AppShell view={view} setView={setView} dark={dark} setDark={setDark} email={session.user.email} radarCount={alerts.length}>
    {page}
    <AnalysisModal item={selected} onClose={()=>setSelected(null)} config={config}/>
    <StatusEditor item={editing} onClose={()=>setEditing(null)} onSave={async(s,b,v)=>{const err=await updateStatus(editing!.id,s,b,v);if(!err)await loadPurchases()}}/>
  </AppShell>
}
