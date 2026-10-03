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
import { NegotiationAssistantPage } from './pages/NegotiationAssistantPage'
import type { NegotiationPrefill } from './hooks/useNegotiationAssistant'
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
  const [negotiationPrefill,setNegotiationPrefill]=useState<NegotiationPrefill|null>(null)
  const [negotiationSessionId,setNegotiationSessionId]=useState<string|null>(null)
  const [negotiationReturnView,setNegotiationReturnView]=useState<View>('radar')

  const {config,loading:configLoading,checked:configChecked,error:configError,save:saveConfig,load:reloadConfig}=useRadarConfig(!!session)
  const {loading:planLoading,checked:planChecked,hasAccess,status:access,refresh:refreshAccess}=usePlanAccess(!!session)
  const appDataActive=!!session&&hasAccess
  const {items,load,updateStatus,resolveNegotiation,addNegotiationLog,reinspect}=useAnalyses(appDataActive)
  const {items:purchases,load:loadPurchases,createPurchase,markSold,updatePurchase,uploadPhotos,removePhoto}=usePurchases(appDataActive)
  const {items:drafts,saveGenerated:saveResaleDraft,updateCopy:updateResaleDraftCopy,setSaleOutcome:setResaleSaleOutcome,remove:removeResaleDraft}=useResaleDrafts(appDataActive)
  const [bootStalled,setBootStalled]=useState(false)

  useEffect(()=>{
    const waiting=!ready || (!!session&&!reset&&(configLoading||!configChecked||!planChecked))
    if(!waiting){setBootStalled(false);return}
    const timer=window.setTimeout(()=>setBootStalled(true),10000)
    return()=>window.clearTimeout(timer)
  },[ready,session,reset,configLoading,configChecked,planChecked])

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
    const checkout=params.get('checkout')
    if(checkout==='extra'||checkout==='upgrade'){
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

  if(!ready)return bootStalled?<BootRecovery/>:<div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-600">Carregando radar...</div>
  if(!session||reset)return <AuthPage initialMode={reset?'reset':'login'}/>
  if(configLoading||!configChecked||!planChecked)return bootStalled?<BootRecovery/>:<div className="grid min-h-screen place-items-center bg-[#06101c] text-xs text-slate-500">Validando seu acesso com segurança...</div>
  if(configError||!config.user_id)return <div className="grid min-h-screen place-items-center bg-[#06101c] px-5 text-slate-300">
    <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-center">
      <strong className="block text-sm text-white">Não conseguimos carregar sua conta agora.</strong>
      <p className="mt-2 text-xs leading-5 text-slate-500">Sua sessão continua protegida. Tente novamente em alguns segundos.</p>
      <button onClick={()=>void reloadConfig()} className="mt-4 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950">Tentar novamente</button>
    </div>
  </div>
  if(!hasAccess)return <PlansPage email={session.user.email} onRefreshAccess={refreshAccess}/>

  let page:React.ReactNode
  if(view==='dashboard')page=<DashboardPage items={items} purchases={purchases} drafts={drafts} config={config} access={access} onSaveConfig={saveConfig} onManagePlan={()=>setView('subscription')} onNew={()=>{setAnalysisFocus(null);setView('new')}} onAnalyzeOpportunity={opportunity=>{setAnalysisFocus(opportunity);setView('new')}} onOpen={setSelected}/>
  else if(view==='radar')page=<RadarPage analyses={items} purchases={purchases} config={config} alerts={alerts} insights={intelligence.insights} onNavigate={setView} onOpen={setSelected} onSaveConfig={saveConfig}/>
  else if(view==='negotiate')page=<NegotiationAssistantPage prefill={negotiationPrefill} onPrefillConsumed={()=>setNegotiationPrefill(null)} initialSessionId={negotiationSessionId} onInitialSessionConsumed={()=>setNegotiationSessionId(null)} onBack={()=>setView(negotiationReturnView)} onUsageChanged={async()=>{await refreshAccess({silent:true})}}/>
  else if(view==='new')page=<NewAnalysisPage focus={analysisFocus} config={config} userProfile={intelligence.profile} purchases={purchases} onUsageChanged={()=>refreshAccess({silent:true})} onOpenNegotiation={()=>{setNegotiationReturnView('new');setNegotiationSessionId(null);setNegotiationPrefill(null);setView('negotiate')}} onNegotiate={prefill=>{setNegotiationReturnView('new');setNegotiationSessionId(null);setNegotiationPrefill(prefill);setAnalysisFocus(null);setView('negotiate')}} onSaved={async destination=>{await load();await refreshAccess();setAnalysisFocus(null);setView(destination)}}/>
  else if(view==='bought')page=<BoughtPage analyses={items} purchases={purchases} drafts={drafts} config={config} onCreate={async input=>{await createPurchase(input);await load()}} onSold={async(id,salePrice)=>{await markSold(id,salePrice);await load()}} onUpdate={updatePurchase} onUploadPhotos={uploadPhotos} onRemovePhoto={removePhoto} onSaveDraft={async input=>{const row=await saveResaleDraft(input);void refreshAccess({silent:true});return row}} onUpdateDraftCopy={updateResaleDraftCopy} onDeleteDraft={removeResaleDraft} onUpgradePlan={()=>setView('subscription')}/>
  else if(view==='history')page=<HistoryPage items={items} drafts={drafts} config={config} onOpen={setSelected} onOpenAd={setSelectedDraft} onOpenAssistant={id=>{setNegotiationReturnView('history');setNegotiationSessionId(id);setNegotiationPrefill(null);setView('negotiate')}} onAdSold={async(ad,price)=>{await setResaleSaleOutcome(ad.id,'vendido',price);await loadPurchases();await load()}} onAdNotSold={async ad=>{await setResaleSaleOutcome(ad.id,'nao_vendido');await loadPurchases()}} onEdit={setEditing} onNegotiationBought={async(id,price)=>{await resolveNegotiation(id,'bought',price);await loadPurchases()}} onNegotiationFailed={async id=>{await resolveNegotiation(id,'failed')}} onNegotiationLog={addNegotiationLog} onReinspect={reinspect}/>
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


function BootRecovery(){
  const repair=async()=>{
    try{
      if('serviceWorker' in navigator){
        const registrations=await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(registration=>registration.unregister()))
      }
      if('caches' in window){
        const keys=await caches.keys()
        await Promise.all(keys.filter(key=>key.startsWith('brike-radar-')).map(key=>caches.delete(key)))
      }
    }catch{}
    window.location.reload()
  }

  return <div className="grid min-h-screen place-items-center bg-[#06101c] px-5 text-slate-300">
    <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-center">
      <strong className="block text-sm text-white">O Radar demorou mais que o normal para iniciar.</strong>
      <p className="mt-2 text-xs leading-5 text-slate-500">Seus dados estão no servidor. Este reparo limpa apenas o cache local do aplicativo e tenta carregar a versão atual novamente.</p>
      <button onClick={()=>void repair()} className="mt-4 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950">Reparar carregamento</button>
    </div>
  </div>
}
