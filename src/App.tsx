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
import { SubscriptionPage } from './pages/SubscriptionPage'
import { AdminPage } from './pages/AdminPage'
import { AppShell } from './components/AppShell'
import { AnalysisModal } from './components/AnalysisModal'
import { StatusEditor } from './components/StatusEditor'
import { SalePreparationModal } from './components/bought/SalePreparationModal'
import { OnboardingModal } from './components/onboarding/OnboardingModal'
import type { View } from './components/BottomNav'
import type { AnaliseRow,ResaleDraftRow } from './types/database'
import type { BriqueOpportunity } from './data/briqueCatalog'
import { buildRadarAlerts } from './utils/radarAlerts'
import { buildUserIntelligence } from './utils/userIntelligence'

const initialDark=()=>{if(typeof window==='undefined')return true;const saved=window.localStorage.getItem('brike-theme');return saved!=='light'}

export default function App(){
  const {session,ready,reset}=useSessionAuth()
  const [view,setView]=useState<View>('dashboard')
  const [dark,setDark]=useState(initialDark)
  const [selected,setSelected]=useState<AnaliseRow|null>(null)
  const [editing,setEditing]=useState<AnaliseRow|null>(null)
  const [selectedDraft,setSelectedDraft]=useState<ResaleDraftRow|null>(null)
  const [analysisFocus,setAnalysisFocus]=useState<BriqueOpportunity|null>(null)

  const {config,loading:configLoading,save:saveConfig}=useRadarConfig(!!session)
  const {loading:planLoading,checked:planChecked,hasAccess,status:access,refresh:refreshAccess}=usePlanAccess(!!session)
  const appDataActive=!!session&&hasAccess
  const {items,load,updateStatus,resolveNegotiation,addNegotiationLog,reinspect}=useAnalyses(appDataActive)
  const {items:purchases,load:loadPurchases,createPurchase,markSold,updatePurchase,uploadPhotos,removePhoto}=usePurchases(appDataActive)
  const {items:drafts,saveGenerated:saveResaleDraft,updateCopy:updateResaleDraftCopy,setSaleOutcome:setResaleSaleOutcome,remove:removeResaleDraft}=useResaleDrafts(appDataActive)

  const alerts=useMemo(()=>buildRadarAlerts(items,purchases,config),[items,purchases,config])
  const intelligence=useMemo(()=>buildUserIntelligence(purchases,items),[purchases,items])

  useEffect(()=>{if(view!=='new'&&analysisFocus)setAnalysisFocus(null)},[view])

  useEffect(()=>{
    window.localStorage.setItem('brike-theme',dark?'dark':'light')
    document.documentElement.style.colorScheme=dark?'dark':'light'
    document.body.style.background=dark?'#06101c':'#eef5f4'
  },[dark])

  useEffect(()=>{
    if(!session||!hasAccess)return
    const params=new URLSearchParams(window.location.search)
    if(params.get('checkout')==='extra'){
      setView('subscription')
      void refreshAccess()
      window.history.replaceState({},'',window.location.pathname)
    }
  },[session,hasAccess,refreshAccess])

  useEffect(()=>{
    if(!hasAccess||!config.notificacoes_ativas||typeof Notification==='undefined'||Notification.permission!=='granted')return
    const alert=alerts.find(a=>a.severity==='high')||alerts.find(a=>a.severity==='medium')
    if(!alert)return
    const day=new Date().toISOString().slice(0,10)
    const key='brike-notification:'+day+':'+alert.id
    if(localStorage.getItem(key))return

    void (async()=>{
      try{
        const title=alert.severity==='high'?'BRIKE RADAR · ação importante':'BRIKE RADAR · atenção'
        const options={body:alert.title+' — '+alert.recommendation,icon:'/brike-icon.svg',tag:'brike-alert-'+alert.id}
        if('serviceWorker' in navigator){
          const registration=await navigator.serviceWorker.ready
          await registration.showNotification(title,options)
        }else{
          new Notification(title,options)
        }
        localStorage.setItem(key,'1')
      }catch{}
    })()
  },[alerts,config.notificacoes_ativas,hasAccess])

  if(!ready)return <div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-600">Carregando radar...</div>
  if(!session||reset)return <AuthPage initialMode={reset?'reset':'login'}/>
  if(configLoading||!config.user_id||!planChecked)return <div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-500">Validando seu acesso com segurança...</div>
  if(!hasAccess)return <PlansPage email={session.user.email} onRefreshAccess={refreshAccess}/>

  let page:React.ReactNode
  if(view==='dashboard')page=<DashboardPage items={items} purchases={purchases} drafts={drafts} config={config} access={access} onSaveConfig={saveConfig} onManagePlan={()=>setView('subscription')} onNew={()=>{setAnalysisFocus(null);setView('new')}} onAnalyzeOpportunity={opportunity=>{setAnalysisFocus(opportunity);setView('new')}} onOpen={setSelected}/>
  else if(view==='radar')page=<RadarPage analyses={items} purchases={purchases} config={config} alerts={alerts} insights={intelligence.insights} onNavigate={setView} onOpen={setSelected} onSaveConfig={saveConfig}/>
  else if(view==='new')page=<NewAnalysisPage focus={analysisFocus} config={config} userProfile={intelligence.profile} purchases={purchases} onUsageChanged={()=>refreshAccess({silent:true})} onSaved={async destination=>{await load();await refreshAccess();setAnalysisFocus(null);setView(destination)}}/>
  else if(view==='bought')page=<BoughtPage analyses={items} purchases={purchases} drafts={drafts} config={config} onCreate={async input=>{await createPurchase(input);await load()}} onSold={async(id,salePrice)=>{await markSold(id,salePrice);await load()}} onUpdate={updatePurchase} onUploadPhotos={uploadPhotos} onRemovePhoto={removePhoto} onSaveDraft={async input=>{const row=await saveResaleDraft(input);void refreshAccess({silent:true});return row}} onUpdateDraftCopy={updateResaleDraftCopy} onDeleteDraft={removeResaleDraft}/>
  else if(view==='history')page=<HistoryPage items={items} drafts={drafts} config={config} onOpen={setSelected} onOpenAd={setSelectedDraft} onAdSold={async(ad,price)=>{await setResaleSaleOutcome(ad.id,'vendido',price);await loadPurchases();await load()}} onAdNotSold={async ad=>{await setResaleSaleOutcome(ad.id,'nao_vendido');await loadPurchases()}} onEdit={setEditing} onNegotiationBought={async(id,price)=>{await resolveNegotiation(id,'bought',price);await loadPurchases()}} onNegotiationFailed={async id=>{await resolveNegotiation(id,'failed')}} onNegotiationLog={addNegotiationLog} onReinspect={reinspect}/>
  else if(view==='subscription')page=<SubscriptionPage status={access} onBack={()=>setView('dashboard')} onRefresh={refreshAccess}/>
  else page=access.owner_access?<AdminPage onBack={()=>setView('dashboard')}/>:<DashboardPage items={items} purchases={purchases} drafts={drafts} config={config} access={access} onSaveConfig={saveConfig} onManagePlan={()=>setView('subscription')} onNew={()=>{setAnalysisFocus(null);setView('new')}} onAnalyzeOpportunity={opportunity=>{setAnalysisFocus(opportunity);setView('new')}} onOpen={setSelected}/>

  return <AppShell view={view} setView={setView} dark={dark} setDark={setDark} email={session.user.email} radarCount={alerts.length} ownerAccess={access.owner_access} onManageSubscription={()=>setView('subscription')} onOpenAdmin={()=>setView('admin')}>
    {page}
    {!config.onboarding_concluido&&!access.owner_access&&<OnboardingModal config={config} onSave={saveConfig}/>}
    <AnalysisModal item={selected} onClose={()=>setSelected(null)} config={config}/>
    {selectedDraft&&<SalePreparationModal purchases={purchases} analyses={items} initialDraft={selectedDraft} onClose={()=>setSelectedDraft(null)} onSaveDraft={async input=>{const row=await saveResaleDraft(input);setSelectedDraft(row);void refreshAccess({silent:true});return row}} onUpdateCopy={async(id,title,description)=>{await updateResaleDraftCopy(id,title,description);const latest=drafts.find(d=>d.id===id);if(latest)setSelectedDraft({...latest,titulo:title,descricao:description} as ResaleDraftRow)}}/>}
    <StatusEditor item={editing} onClose={()=>setEditing(null)} onSave={async(s,b,v)=>{const err=await updateStatus(editing!.id,s,b,v);if(!err)await loadPurchases()}}/>
  </AppShell>
}
