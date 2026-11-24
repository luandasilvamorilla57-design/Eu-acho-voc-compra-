import {useEffect,useMemo,useState} from 'react'
import {
  AlertTriangle,ArrowDownRight,ArrowUpRight,BadgeDollarSign,Banknote,BarChart3,Box,
  Check,ChevronRight,CircleDollarSign,Clock3,Home,ImagePlus,LogOut,Package,Plus,
  ReceiptText,Search,Settings2,ShoppingBag,Tag,WalletCards,X,Moon,Sun,Megaphone,RefreshCw,TrendingDown,Trash2,Download,Pencil,ShieldCheck,Sparkles
} from 'lucide-react'
import {supabase} from '../lib/supabase'
import {useControlData} from './useControlData'
import {BackupPage,ClosuresPage,GoalsPage,ManagePage,PeoplePage,ReceivablesPage,ReportsPage} from './BusinessCenter'
import {AdminCenter} from './AdminCenter'
import {InstallAppPrompt} from './InstallAppPrompt'
import {useControlAccess} from './useControlAccess'
import {ActivePlanCard,SubscriptionGate,TrialBanner,TrialInfoModal} from './BillingUI'
import {ExpiredAccessModal} from './ExpiredAccessModal'
import {CinematicIntro} from './CinematicIntro'
import {OneDayTrialModal} from './OneDayTrialModal'
import {OpportunitiesPage} from './OpportunitiesPage'
import {BriqueGuidePage} from './BriqueGuidePage'
import {PersonalRankingCard,PersonalRankingPage} from './PersonalRanking'
import {ProfitSimulatorPage} from './ProfitSimulatorPage'
import {MonthlyGoalCard} from './MonthlyGoalCard'
import {FeedbackPrompt} from './FeedbackPrompt'
import {PremiumAreaChart,recentDailyValues} from './PremiumCharts'
import './control-home-refinement.css'
import './next-premium.css'
import './reference-light.css'
import './selection-navy.css'
import './mobile-refinement.css'
import './app-native-refinement.css'
import type {CashEntry,ControlView,Product,ProductPhoto,Sale} from './types'

type Data=ReturnType<typeof useControlData>
type Metrics=ReturnType<typeof buildMetrics>
type Modal='actions'|'stockAdd'|'purchase'|'inventory'|'sale'|'expense'|'cash'|'settings'|'listingCheckin'|null

const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})
const number=new Intl.NumberFormat('pt-BR')

function localDate(){
  const d=new Date()
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
}
function daysSince(date:string){
  return Math.max(0,Math.floor((Date.now()-new Date(date+'T12:00:00').getTime())/86400000))
}
function addDays(date:string,days:number){
  const d=new Date(date+'T12:00:00')
  d.setDate(d.getDate()+days)
  return d.toISOString().slice(0,10)
}
const LISTING_CHANNELS=['Facebook Marketplace','OLX','Mercado Livre','WhatsApp','Instagram','Outro']
const SALE_CHANNELS=[['boca_a_boca','Boca a boca'],['whatsapp','WhatsApp'],['marketplace','Facebook Marketplace'],['olx','OLX'],['instagram','Instagram'],['conhecido','Conhecido'],['loja_fisica','Loja física'],['indicacao','Indicação'],['other','Outro']] as const
function saleChannelLabel(value:string|null,other?:string|null){return value==='other'?other||'Outro':SALE_CHANNELS.find(([key])=>key===value)?.[1]||'Não informado'}

export function ControlApp({userId,email}:{userId:string;email?:string}){
  const data=useControlData(userId)
  const billing=useControlAccess(userId)
  const [view,setView]=useState<ControlView>('home')
  const [modal,setModal]=useState<Modal>(null)
  const [selected,setSelected]=useState<Product|null>(null)
  const [toast,setToast]=useState<string|null>(null)
  const [readOnlyMode,setReadOnlyMode]=useState(true)
  const [trialInfoOpen,setTrialInfoOpen]=useState(false)
  const [expiredModalOpen,setExpiredModalOpen]=useState(false)
  const [expiredTriggeredByAction,setExpiredTriggeredByAction]=useState(false)
  const [expiredModalShown,setExpiredModalShown]=useState(false)
  const [introDismissed,setIntroDismissed]=useState(false)
  const [trialWelcomeDismissed,setTrialWelcomeDismissed]=useState(false)
  const [theme,setTheme]=useState<'dark'|'light'>(()=>{
    const saved=window.localStorage.getItem('controle-plus-theme')
    return saved==='dark'?'dark':'light'
  })
  useEffect(()=>{
    window.localStorage.setItem('controle-plus-theme',theme)
    document.documentElement.dataset.theme=theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#092543':'#081321')
  },[theme])
  const calc=useMemo(()=>buildMetrics(data),[data.settings,data.products,data.expenses,data.sales,data.saleItems,data.cashEntries])

  function notify(text:string){
    setToast(text)
    window.setTimeout(()=>setToast(null),2600)
  }
  const access=billing.access
  const canWrite=Boolean(access?.can_write)

  useEffect(()=>{
    setReadOnlyMode(!canWrite)
    if(access&&!canWrite&&!expiredModalShown){
      setExpiredTriggeredByAction(false)
      setExpiredModalOpen(true)
      setExpiredModalShown(true)
    }
    if(canWrite)setExpiredModalOpen(false)
  },[access,canWrite,expiredModalShown])

  function showBlocked(){
    setExpiredTriggeredByAction(true)
    setExpiredModalOpen(true)
  }
  function requireWrite(action:()=>void){
    if(canWrite){action();return}
    setReadOnlyMode(true)
    showBlocked()
  }
  function openModal(next:Modal){
    if(next==='settings'||next===null){setModal(next);return}
    requireWrite(()=>setModal(next))
  }
  function openView(next:ControlView){
    if(canWrite||['home','stock','sales','cash','reports','backup','guide','ranking','opportunities','simulator','admin'].includes(next)){
      setView(next)
      return
    }
    setReadOnlyMode(true)
    showBlocked()
  }
  function openListingCheckin(product:Product){
    requireWrite(()=>{
      setSelected(product)
      setModal('listingCheckin')
    })
  }

  if(data.loading||billing.loading)return <LoadingScreen/>
  if(!data.settings)return <div className="cp-fatal"><strong>Não conseguimos abrir o CONTROLE+.</strong><button onClick={()=>void data.load()}>Tentar novamente</button></div>
  if(!access)return <div className="cp-fatal"><strong>Não conseguimos validar o acesso da conta.</strong><button onClick={()=>void billing.refresh(true)}>Tentar novamente</button></div>
  if(!introDismissed&&!data.settings.intro_video_watched_at&&(data.isAdmin||Date.parse(data.settings.created_at)>=Date.parse('2026-10-15T19:00:00Z')))return <CinematicIntro userId={userId} isAdmin={data.isAdmin} onDone={()=>{setIntroDismissed(true);void data.load()}}/>
  if(access.access_state==='trial'&&!access.is_admin&&canWrite&&!data.settings.trial_welcome_seen_at&&!trialWelcomeDismissed)return <OneDayTrialModal access={access} onDone={()=>{setTrialWelcomeDismissed(true);void data.load()}}/>
  if(!data.settings.onboarding_completed&&canWrite)return <FirstRun data={data} email={email} theme={theme} onTheme={()=>setTheme(v=>v==='dark'?'light':'dark')}/>

  return <div className="cp-app" data-theme={theme}>
    <div className="cp-noise"/>
    <TopBar business={data.settings.business_name} email={email} theme={theme} isAdmin={data.isAdmin} adminActive={view==='admin'} onTheme={()=>setTheme(v=>v==='dark'?'light':'dark')} onSettings={()=>setModal('settings')} onManage={()=>canWrite?setView('manage'):showBlocked()} onAdmin={()=>setView('admin')}/>
    {(!data.isAdmin||!canWrite)&&<TrialBanner access={access} onSubscribe={()=>void billing.subscribe()} onOpen={()=>canWrite?setTrialInfoOpen(true):setExpiredModalOpen(true)}/>}
    <main className="cp-main">
      {!canWrite&&!readOnlyMode?<SubscriptionGate access={access} products={data.products.length} sales={data.sales.length} stockValue={calc.stockCapital} onSubscribe={()=>void billing.subscribe()} onRefresh={()=>void billing.refresh(true)} onReadOnly={()=>{setReadOnlyMode(true);setView('home')}} busy={billing.busy} error={billing.error}/>:<>
        {view==='home'&&<HomePage data={data} calc={calc} canWrite={canWrite} onBlocked={showBlocked} onOpenProduct={setSelected} onView={openView} onAction={openModal} onCheckListing={openListingCheckin}/>}
        {view==='stock'&&<StockPage data={data} calc={calc} onOpenProduct={setSelected} onAdd={()=>openModal('stockAdd')}/>}
        {view==='sales'&&<SalesPage data={data} calc={calc} onSale={()=>openModal('sale')} onOpenProduct={setSelected}/>}
        {view==='cash'&&<CashPage data={data} calc={calc} onCash={()=>openModal('cash')} onSettings={()=>setModal('settings')}/>}
        {canWrite&&view==='manage'&&<ManagePage data={data} onView={openView} onBack={()=>setView('home')}/>}
        {canWrite&&view==='receivables'&&<ReceivablesPage data={data} onBack={()=>setView('manage')}/>}
        {view==='reports'&&<ReportsPage data={data} onBack={()=>setView('home')}/>}
        {canWrite&&view==='people'&&<PeoplePage data={data} onBack={()=>setView('manage')}/>}
        {canWrite&&view==='goals'&&<GoalsPage data={data} onBack={()=>setView('manage')}/>}
        {canWrite&&view==='closures'&&<ClosuresPage data={data} onBack={()=>setView('manage')}/>}
        {view==='backup'&&<BackupPage data={data} onBack={()=>setView('home')}/>}
        {view==='guide'&&<BriqueGuidePage onBack={()=>setView(canWrite?'manage':'home')}/>}
        {view==='simulator'&&<ProfitSimulatorPage onBack={()=>setView('home')}/>}
        {view==='opportunities'&&<OpportunitiesPage isAdmin={data.isAdmin} onBack={()=>setView('home')}/>}
        {view==='ranking'&&<PersonalRankingPage products={data.products} sales={data.sales} saleItems={data.saleItems} onBack={()=>setView('home')}/>}
        {view==='admin'&&data.isAdmin&&<AdminCenter onBack={()=>setView('home')}/>}
      </>}
    </main>
    {view!=='admin'&&(canWrite||readOnlyMode)&&<BottomNav view={view} onView={openView} onAdd={()=>openModal('actions')}/>}
    <InstallAppPrompt userId={userId}/>
    {!data.isAdmin&&<FeedbackPrompt userId={userId} enabled={modal===null&&!trialInfoOpen&&selected===null&&view!=='admin'}/>} 
    {trialInfoOpen&&!data.isAdmin&&canWrite&&<TrialInfoModal access={access} busy={billing.busy} error={billing.error} onClose={()=>setTrialInfoOpen(false)} onSubscribe={()=>void billing.subscribe()}/>} 
    {expiredModalOpen&&!canWrite&&<ExpiredAccessModal access={access} busy={billing.busy} error={billing.error} onClose={()=>setExpiredModalOpen(false)} onSubscribe={()=>void billing.subscribe()} blockedAction={expiredTriggeredByAction}/>} 

    {modal==='actions'&&<ActionSheet onClose={()=>setModal(null)} onChoose={openModal}/>}
    {modal==='stockAdd'&&<StockAddSheet data={data} onClose={()=>setModal(null)} onOwn={()=>setModal('inventory')} onRegisterPurchase={()=>setModal('purchase')} onOpenPurchased={product=>{setModal(null);setSelected(product)}}/>}
    {modal==='purchase'&&<PurchaseModal data={data} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Compra salva e adicionada ao estoque.')}}/>}
    {modal==='inventory'&&<InventoryModal data={data} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Produto adicionado ao estoque sem movimentar o caixa.')}}/>}
    {modal==='sale'&&<SaleModal data={data} initialProduct={selected} onClose={()=>setModal(null)} onDone={()=>{setModal(null);setSelected(null);notify('Venda registrada. Caixa e estoque atualizados.')}} onTradeDone={()=>{setModal(null);setSelected(null);setView('stock');notify('Troca registrada. O recebido está no estoque.')}}/>}
    {modal==='expense'&&<ExpenseModal data={data} initialProduct={selected} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Gasto somado ao custo real do produto.')}}/>}
    {modal==='cash'&&<CashModal data={data} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Movimentação adicionada ao caixa.')}}/>}
    {modal==='settings'&&<SettingsModal data={data} email={email} access={access} billingBusy={billing.busy} onSubscribe={()=>void billing.subscribe()} onCancel={()=>void billing.cancel()} readOnly={!canWrite} onClose={()=>setModal(null)} onDone={notify}/>} 
    {selected&&modal==='listingCheckin'&&<ListingCheckinModal product={selected} data={data} onClose={()=>{setModal(null);setSelected(null)}} onSold={()=>setModal('sale')} onDone={(text)=>{setModal(null);setSelected(null);notify(text)}}/>}
    {selected&&modal===null&&<ProductDetail product={selected} data={data} calc={calc} readOnly={!canWrite} onClose={()=>setSelected(null)} onSale={()=>openModal('sale')} onExpense={()=>openModal('expense')} onSaved={()=>notify('Produto atualizado.')} onDeleted={()=>{setSelected(null);notify('Produto removido do estoque.')}} onBlocked={showBlocked}/>}
    {toast&&<div className="cp-toast"><Check size={18}/>{toast}</div>}
    {data.error&&<div className="cp-error-bar"><AlertTriangle size={17}/>{data.error}</div>}
    {billing.error&&canWrite&&<div className="cp-error-bar"><AlertTriangle size={17}/>{billing.error}</div>}
  </div>
}

function FirstRun({data,email,theme,onTheme}:{data:Data;email?:string;theme:'dark'|'light';onTheme:()=>void}){
  const [business,setBusiness]=useState('')
  const [cash,setCash]=useState('')
  const [step,setStep]=useState(1)
  const [error,setError]=useState<string|null>(null)

  async function finish(){
    setError(null)
    try{
      await data.updateSettings({
        business_name:business.trim()||'Meu negócio',
        initial_cash:Math.max(0,Number(cash.replace(',','.'))||0),
        stock_alert_days:21,
        onboarding_completed:true
      })
    }catch(err:any){setError(err?.message||'Não foi possível concluir a configuração.')}
  }

  return <main className="cp-onboarding" data-theme={theme}>
    <button type="button" className="cp-onboarding-theme" onClick={onTheme} aria-label={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
    <div className="cp-onboarding-glow"/>
    <section className="cp-onboarding-card">
      <div className="cp-onboarding-top"><Brand/><span>{step} de 3</span></div>
      <div className="cp-onboarding-progress"><i style={{width:(step/3*100)+'%'}}/></div>

      {step===1&&<div className="cp-onboarding-body">
        <span className="cp-eyebrow">24 HORAS GRÁTIS · SEM CARTÃO</span>
        <h1>Vamos colocar seu negócio em ordem.</h1>
        <p>Experimente o CONTROLE+ completo durante 24 horas a partir do cadastro, sem cartão. Depois, assine por R$ 18,90/mês se quiser continuar registrando compras e vendas. Seus dados permanecem salvos.</p>
        <div className="cp-onboarding-example"><span><ShoppingBag/></span><div><b>Comprou</b><small>entra no estoque e sai do caixa</small></div><ChevronRight/><span><Banknote/></span><div><b>Vendeu</b><small>sai do estoque e volta para o caixa</small></div></div>
      </div>}

      {step===2&&<div className="cp-onboarding-body">
        <span className="cp-eyebrow">SEU NEGÓCIO</span>
        <h1>Como você quer chamar seu controle?</h1>
        <p>Pode ser o nome da sua loja, do seu brique ou simplesmente seu nome.</p>
        <Field label="Nome do negócio" full><input autoFocus value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Ex.: Brique do Luan"/></Field>
      </div>}

      {step===3&&<div className="cp-onboarding-body">
        <span className="cp-eyebrow">PONTO DE PARTIDA</span>
        <h1>Quanto você tem livre para comprar mercadoria hoje?</h1>
        <p>Não é seu faturamento. É o dinheiro disponível agora. A partir daqui, cada compra e venda movimenta esse saldo automaticamente.</p>
        <Field label="Dinheiro disponível" full><MoneyInput value={cash} setValue={setCash} placeholder="0,00"/></Field>
        <div className="cp-onboarding-note"><CircleDollarSign/><div><b>Você pode mudar depois.</b><small>Se não quiser informar agora, deixe em R$ 0,00.</small></div></div>
      </div>}

      {error&&<div className="cp-form-error">{error}</div>}
      <div className="cp-onboarding-actions">
        {step>1&&<button className="cp-secondary" onClick={()=>setStep(v=>v-1)}>Voltar</button>}
        <button className="cp-primary" disabled={data.busy} onClick={()=>step<3?setStep(v=>v+1):void finish()}>{data.busy?'Preparando...':step<3?'Continuar':'Entrar no CONTROLE+'}</button>
      </div>
      <small className="cp-onboarding-account">{email||'Sua conta'} · seus dados ficam separados por usuário</small>
    </section>
  </main>
}

function buildMetrics(data:Data){
  const expenseByProduct=new Map<string,number>()
  for(const e of data.expenses)expenseByProduct.set(e.product_id,(expenseByProduct.get(e.product_id)||0)+e.amount)
  const productMap=new Map(data.products.map(p=>[p.id,p]))
  const unitCost=(p:Product)=>p.purchase_unit_cost+(expenseByProduct.get(p.id)||0)/Math.max(1,p.quantity_initial)
  const stockCapital=data.products.reduce((sum,p)=>sum+(p.quantity_available>0?unitCost(p)*p.quantity_available:0),0)
  const income=data.cashEntries.filter(x=>x.kind==='income').reduce((s,x)=>s+x.amount,0)
  const outflow=data.cashEntries.filter(x=>x.kind==='expense').reduce((s,x)=>s+x.amount,0)
  const cash=(data.settings?.initial_cash||0)+income-outflow
  const currentMonth=localDate().slice(0,7)
  const monthSales=data.sales.filter(s=>s.status==='completed'&&s.sale_date.slice(0,7)===currentMonth)
  const saleStats=(sale:Sale)=>{
    const items=data.grouped.itemsBySale.get(sale.id)||[]
    let revenue=0,cost=0
    for(const item of items){
      revenue+=item.unit_price*item.quantity
      const product=productMap.get(item.product_id)
      const snapshot=Number(item.unit_cost_snapshot||0)
      if(snapshot>0)cost+=snapshot*item.quantity
      else if(product)cost+=unitCost(product)*item.quantity
    }
    return{revenue,cost,profit:revenue-cost}
  }
  const monthRevenue=monthSales.reduce((s,x)=>s+saleStats(x).revenue,0)
  const monthProfit=monthSales.reduce((s,x)=>s+saleStats(x).profit,0)
  const monthSaleIds=new Set(monthSales.map(s=>s.id))
  const monthSaleItems=data.saleItems.filter(item=>monthSaleIds.has(item.sale_id))
  const monthUnitsSold=monthSaleItems.reduce((sum,item)=>sum+item.quantity,0)
  const monthOrders=monthSales.length
  const stockUnits=data.products.reduce((s,p)=>s+p.quantity_available,0)
  const alertDays=data.settings?.stock_alert_days||21
  const agedProducts=data.products.filter(p=>p.quantity_available>0&&daysSince(p.purchase_date)>=alertDays)
  const agedCapital=agedProducts.reduce((s,p)=>s+unitCost(p)*p.quantity_available,0)
  const potentialProfit=data.products.reduce((s,p)=>p.quantity_available>0&&p.listed_price!==null?s+(p.listed_price-unitCost(p))*p.quantity_available:s,0)
  return{unitCost,productMap,stockCapital,cash,monthSales,monthSaleItems,monthUnitsSold,monthOrders,monthRevenue,monthProfit,stockUnits,alertDays,agedProducts,agedCapital,potentialProfit,saleStats}
}

function TopBar({business,email,theme,isAdmin,adminActive,onTheme,onSettings,onManage,onAdmin}:{business:string;email?:string;theme:'dark'|'light';isAdmin:boolean;adminActive:boolean;onTheme:()=>void;onSettings:()=>void;onManage:()=>void;onAdmin:()=>void}){
  return <header className="cp-topbar"><div className="cp-top-inner">
    <Brand/>
    <div className="cp-top-business"><span>{business}</span><small>CONTROLE DO NEGÓCIO</small></div>
    <div className="cp-top-actions">
      {isAdmin&&<button className={adminActive?'cp-admin-top active':'cp-admin-top'} onClick={onAdmin} aria-label="Abrir painel administrador" title="Administrador geral"><ShieldCheck size={16}/><span>Admin</span></button>}
      <button className="cp-theme-toggle" onClick={onTheme} aria-label={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button>
      <button className="cp-manage-top" onClick={onManage}><BarChart3 size={16}/><span>Gestão</span></button>
      <button className="cp-user-btn" onClick={onSettings}><span>{(email?.[0]||'C').toUpperCase()}</span><Settings2 size={16}/></button>
    </div>
  </div></header>
}
function Brand(){return <div className="cp-brand"><span className="cp-brand-mark">C<span>+</span></span><span className="cp-brand-word">CONTROLE<span>+</span></span></div>}

function HomePage({data,calc,canWrite,onBlocked,onOpenProduct,onView,onAction,onCheckListing}:{data:Data;calc:Metrics;canWrite:boolean;onBlocked:()=>void;onOpenProduct:(p:Product)=>void;onView:(v:ControlView)=>void;onAction:(m:Modal)=>void;onCheckListing:(p:Product)=>void}){
  const recent=data.products.slice(0,4)
  const totalCapital=Math.max(0,calc.cash)+calc.stockCapital
  const cashPct=totalCapital>0?Math.max(0,Math.min(100,calc.cash/totalCapital*100)):0
  const stockPct=100-cashPct
  const now=new Date()
  const dateLabel=now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short'})
  const todayKey=localDate()
  const todaySales=data.sales.filter(s=>s.status==='completed'&&s.sale_date===todayKey)
  const todaySaleIds=new Set(todaySales.map(s=>s.id))
  const todayItems=data.saleItems.filter(item=>todaySaleIds.has(item.sale_id))
  const todayRevenue=todayItems.reduce((sum,item)=>sum+item.unit_price*item.quantity,0)
  const todayCost=todayItems.reduce((sum,item)=>sum+item.unit_cost_snapshot*item.quantity,0)
  const todayProfit=todayRevenue-todayCost
  const todayUnits=todayItems.reduce((sum,item)=>sum+item.quantity,0)
  const todayProductMap=new Map<string,{name:string;qty:number;revenue:number;cost:number}>()
  for(const item of todayItems){
    const product=calc.productMap.get(item.product_id)
    const current=todayProductMap.get(item.product_id)||{
      name:product?.name||'Produto',
      qty:0,
      revenue:0,
      cost:0
    }
    current.qty+=item.quantity
    current.revenue+=item.unit_price*item.quantity
    current.cost+=item.unit_cost_snapshot*item.quantity
    todayProductMap.set(item.product_id,current)
  }
  const todayProducts=[...todayProductMap.values()].sort((a,b)=>b.revenue-a.revenue)
  const dueListings=data.products
    .filter(p=>p.quantity_available>0&&p.listing_status==='listed'&&!!p.listing_next_checkin_at&&p.listing_next_checkin_at<=localDate())
    .sort((a,b)=>(a.listing_next_checkin_at||'').localeCompare(b.listing_next_checkin_at||''))
  const dueListing=dueListings[0]
  const openInstallments=data.installments.filter(item=>item.status==='open')
  const amountToReceive=openInstallments.reduce((total,item)=>total+item.amount,0)
  const overdueInstallments=openInstallments.filter(item=>item.due_date<todayKey)

  let guide={
    tone:'good',
    title:'Tudo em ordem por aqui',
    text:'Continue registrando cada movimento para manter os números reais.',
    button:'Ver caixa',
    action:()=>onView('cash')
  }
  if(data.products.length===0)guide={
    tone:'brand',title:'Coloque o primeiro produto no estoque',
    text:'Pode ser uma compra para revenda ou algo que você já tem em casa.',
    button:'Adicionar produto',action:()=>onAction('actions')
  }
  else if(dueListing)guide={
    tone:'brand',
    title:'Como está o anúncio de '+dueListing.name+'?',
    text:(dueListings.length>1?dueListings.length+' anúncios precisam de revisão. ':'')+'Esse produto está anunciado há '+daysSince(dueListing.listing_started_at||dueListing.purchase_date)+' dia(s). Já vendeu ou está com pouca procura?',
    button:'Responder agora',action:()=>onCheckListing(dueListing)
  }
  else if(calc.agedProducts.length>0)guide={
    tone:'warn',title:calc.agedProducts.length+' produto(s) com capital parado',
    text:money.format(calc.agedCapital)+' estão presos em estoque há '+calc.alertDays+' dias ou mais.',
    button:'Revisar',action:()=>onView('stock')
  }
  else if(data.sales.length===0)guide={
    tone:'soft',title:'Pronto para registrar a primeira venda',
    text:'Ao vender, o CONTROLE+ baixa o estoque e calcula o lucro real.',
    button:'Registrar venda',action:()=>onAction('sale')
  }

  return <div className="cp-page cp-home cp-home-app">
    <section className="cp-app-greeting">
      <div><span>{dateLabel}</span><h1>Visão geral</h1><p>{data.settings?.business_name||'Meu negócio'}</p></div>
      <button className="cp-register-main" onClick={()=>onAction('actions')}><Plus size={19}/><span>Registrar</span></button>
    </section>

    <section className="cp-balance-app">
      <div className="cp-balance-app-top">
        <div className="cp-vision-balance-title"><span className="cp-vision-balance-symbol"><WalletCards size={26}/></span><div><span>Saldo disponível</span><strong>{money.format(calc.cash)}</strong></div></div>
        <span className="cp-balance-app-badge">CAIXA</span>
      </div>

      <section className={todaySales.length?'cp-today-sales has-sales':'cp-today-sales is-empty'}>
        <div className="cp-today-sales-head">
          <div>
            <span>VENDAS DE HOJE</span>
            <b>{todaySales.length?money.format(todayRevenue):'Nenhuma venda ainda'}</b>
            <small>{todaySales.length?todayUnits+' item(ns) vendido(s) em '+todaySales.length+' pedido(s)':'Quando vender, o resumo do dia aparece aqui.'}</small>
          </div>
          {todaySales.length?<button onClick={()=>onView('sales')}>Ver vendas <ChevronRight/></button>:<button onClick={()=>onAction('sale')}>Registrar venda <Plus/></button>}
        </div>

        {todaySales.length>0&&<>
          <div className="cp-today-sales-metrics">
            <div><span>Entrou</span><strong>{money.format(todayRevenue)}</strong></div>
            <div><span>Custo vendido</span><strong>{money.format(todayCost)}</strong></div>
            <div><span>Lucro de hoje</span><strong className={todayProfit>=0?'positive':'negative'}>{money.format(todayProfit)}</strong></div>
          </div>
          <div className="cp-today-sales-products">
            {todayProducts.slice(0,3).map((item,i)=><div key={item.name+'-'+i}>
              <span className="cp-today-product-qty">{item.qty}×</span>
              <div><b>{item.name}</b><small>Venda {money.format(item.revenue)} · custo {money.format(item.cost)}</small></div>
              <strong className={item.revenue-item.cost>=0?'positive':'negative'}>{money.format(item.revenue-item.cost)}</strong>
            </div>)}
            {todayProducts.length>3&&<button onClick={()=>onView('sales')}>+{todayProducts.length-3} produto(s) vendidos hoje</button>}
          </div>
        </>}
      </section>
    </section>

    <MonthlyGoalCard
      goal={data.goals.find(item=>item.period_month.slice(0,7)===todayKey.slice(0,7))}
      month={todayKey.slice(0,7)}
      revenue={calc.monthRevenue}
      canWrite={canWrite}
      onBlocked={onBlocked}
      onSave={data.saveGoal}
    />

    <section className="cp-reference-metrics" aria-label="Indicadores de desempenho">
      <div className="cp-reference-metric">
        <span className="cp-reference-metric-icon"><Box size={22}/></span>
        <div><span>Capital em estoque</span><b>{money.format(calc.stockCapital)}</b></div>
      </div>
      <div className="cp-reference-metric">
        <span className="cp-reference-metric-icon"><ArrowUpRight size={22}/></span>
        <div><span>Lucro no mês</span><b className={calc.monthProfit>=0?'positive':'negative'}>{money.format(calc.monthProfit)}</b></div>
      </div>
      <div className="cp-reference-metric">
        <span className="cp-reference-metric-icon"><ShoppingBag size={22}/></span>
        <div><span>Itens vendidos</span><b>{calc.monthUnitsSold} un.</b></div>
      </div>
      <div className="cp-reference-metric">
        <span className="cp-reference-metric-icon" data-premium-icon={calc.monthOrders>0?"verified":undefined}><Package size={22}/></span>
        <div><span>Pedidos fechados</span><b>{calc.monthOrders}</b></div>
      </div>
    </section>
    <section className="cp-reference-capital" aria-label="Distribuição do capital">
      <div className="cp-capital-track"><i style={{width:cashPct+'%'}}/><em style={{width:stockPct+'%'}}/></div>
      <div className="cp-capital-track-labels"><span>{cashPct.toFixed(0)}% livre</span><span>{stockPct.toFixed(0)}% em produtos</span></div>
    </section>

    <section className="cp-v3-insights" aria-label="Resumo de gestão">
      <button onClick={()=>onView('receivables')}><span className="cp-v3-insight-icon"><ReceiptText size={20}/></span><span><small>A RECEBER</small><strong>{money.format(amountToReceive)}</strong><em>{overdueInstallments.length?overdueInstallments.length+' parcela(s) atrasada(s)':'Parcelas sob controle'}</em></span><ChevronRight size={16}/></button>
      <button onClick={()=>onView('stock')}><span className="cp-v3-insight-icon"><Package size={20}/></span><span><small>CAPITAL PARADO</small><strong>{money.format(calc.agedCapital)}</strong><em>{calc.agedProducts.length?calc.agedProducts.length+' produto(s) aguardando venda':'Sem produtos parados'}</em></span><ChevronRight size={16}/></button>
    </section>

    <button type="button" className="cp-v3-sim-shortcut" onClick={()=>onView('simulator')}><span className="cp-v3-sim-shortcut-icon"><BadgeDollarSign size={28}/></span><span><small>NOVA FERRAMENTA</small><strong>Simulador de lucro</strong><em>Descubra se vale a pena comprar antes de investir.</em></span><ChevronRight size={22}/></button>

    <section className="cp-quick-app">
      <button onClick={()=>onAction('purchase')}><span><ShoppingBag/></span><b>Registrar compra</b><small>Produto entra no estoque</small></button>
      <button onClick={()=>onAction('sale')}><span><Banknote/></span><b>Registrar venda</b><small>Baixa estoque e calcula lucro</small></button>
      <button onClick={()=>onAction('expense')}><span><ArrowDownRight/></span><b>Adicionar gasto</b><small>Reparo, taxa ou transporte</small></button>
      <button onClick={()=>onView('receivables')}><span><ReceiptText/></span><b>A receber</b><small>Parcelas e valores pendentes</small></button>
    </section>

    <button className="cp-opp-home-link" type="button" onClick={()=>onView('opportunities')}><span className="cp-opp-home-icon" data-premium-icon="featured"><Sparkles size={24}/></span><span className="cp-opp-home-copy"><small>SELEÇÃO CONTROLE+</small><b>Oportunidades para revender</b><em>Ideias de produtos para começar com pouco e avaliar novos negócios.</em></span><ChevronRight size={22}/></button>

    <section className={'cp-smart-card cp-smart-card--'+guide.tone}>
      <div className="cp-smart-icon">{guide.tone==='warn'?<AlertTriangle/>:guide.tone==='brand'?<Package/>:<Check/>}</div>
      <div><span>AGORA</span><h2>{guide.title}</h2><p>{guide.text}</p></div>
      <button onClick={guide.action}>{guide.button}<ChevronRight size={16}/></button>
    </section>

    <PersonalRankingCard products={data.products} sales={data.sales} saleItems={data.saleItems} onOpen={()=>onView('ranking')}/>

    <button className="cp-brique-shortcut" onClick={()=>onView('guide')}>
      <span className="cp-brique-shortcut-icon"><BadgeDollarSign/></span>
      <div><span>GUIA DO BRIQUE</span><b>Compra x venda + como valorizar o produto</b><p>Referências de preço, testes antes da compra, limpeza, fotos e negociação.</p></div>
      <ChevronRight/>
    </button>

    <section className="cp-app-section">
      <div className="cp-app-section-head"><div><span>ESTOQUE</span><h2>{recent.length?'Produtos recentes':'Seu estoque está vazio'}</h2></div>{recent.length>0&&<button onClick={()=>onView('stock')}>Ver todos</button>}</div>
      {recent.length?<div className="cp-product-row">{recent.map(p=><ProductCard key={p.id} product={p} data={data} calc={calc} onClick={()=>onOpenProduct(p)}/>)}</div>:<Empty icon={<Package/>} title="Comece pelo primeiro produto" text="Adicione uma compra para visualizar estoque, custo e lucro possível." action="Adicionar compra" onAction={()=>onAction('purchase')}/>}
    </section>

    <section className="cp-month-app">
      <div className="cp-app-section-head"><div><span>ESTE MÊS</span><h2>Desempenho</h2></div><button onClick={()=>onView('reports')}>Relatórios</button></div>
      <div className="cp-month-app-grid cp-month-app-grid--four">
        <div><span>Faturamento</span><b>{money.format(calc.monthRevenue)}</b><small>dinheiro das vendas do mês</small></div>
        <div><span>Itens vendidos</span><b>{calc.monthUnitsSold} un.</b><small>{calc.monthOrders} pedido(s) fechado(s)</small></div>
        <div><span>Lucro real</span><b className={calc.monthProfit>=0?'positive':'negative'}>{money.format(calc.monthProfit)}</b><small>depois do custo dos produtos</small></div>
        <div><span>Lucro possível</span><b>{money.format(calc.potentialProfit)}</b><small>se vender o estoque anunciado</small></div>
      </div>
    </section>
  </div>
}

function ProductCard({product,data,calc,onClick}:{product:Product;data:Data;calc:Metrics;onClick:()=>void}){
  const photo=(data.grouped.photosByProduct.get(product.id)||[])[0]?.signed_url
  const cost=calc.unitCost(product)
  const price=product.listed_price
  const margin=price!==null&&product.cost_basis_known?price-cost:null
  const days=daysSince(product.purchase_date)
  const listingDue=product.listing_status==='listed'&&!!product.listing_next_checkin_at&&product.listing_next_checkin_at<=localDate()
  const isSold=product.quantity_available===0
  const tradeOut=data.grouped.tradeByOutgoingProduct.get(product.id)
  const tradeIn=data.grouped.tradeByIncomingProduct.get(product.id)
  const linkedOut=tradeOut?calc.productMap.get(tradeOut.incoming_product_id):null
  const linkedIn=tradeIn?calc.productMap.get(tradeIn.outgoing_product_id):null
  const lowStock=!isSold&&product.inventory_mode==='stock'&&product.quantity_available<=3
  const alert=!isSold&&days>=calc.alertDays
  const status=isSold?'':listingDue?'Revisar anúncio':product.listing_status==='listed'?'Anunciado':alert?'Atenção':''
  return <button type="button" className={'cp-product-card cp-vision-product'+(isSold?' cp-vision-product--sold':'')} onClick={onClick} aria-label={'Ver detalhes de '+product.name+(isSold?', vendido':'')}>
    <div className="cp-vision-product-top">
      <span className="cp-vision-product-image">
        {photo?<img src={photo} alt={'Foto de '+product.name}/>:<Box size={38}/>}
      </span>
      <div className="cp-vision-product-info">
        {tradeOut?<span className="cp-vision-traded-ribbon" title={'Trocado por '+(linkedOut?.name||'outro item')}>TROCADO</span>:isSold&&<span className="cp-vision-sold-ribbon"><img src="/selo-vendido.webp" alt="Vendido" width="122" height="40" loading="lazy" decoding="async"/></span>}
        <div className="cp-vision-product-flags">
          {tradeIn&&<span className="cp-vision-trade-in"><RefreshCw size={13}/> Recebido em troca</span>}
          {!isSold&&product.inventory_mode==='single'&&<span className="cp-vision-unique"><Tag size={13}/> Item único</span>}
          {lowStock&&<span className="cp-vision-low"><AlertTriangle size={13}/> Baixo estoque</span>}
          {status&&<span className="cp-vision-status">{status}</span>}
        </div>
        <h3>{product.name}</h3>
        <p>{tradeOut?'Trocado pelo '+(linkedOut?.name||'item recebido'):tradeIn?'Veio na troca do '+(linkedIn?.name||'item entregue'):product.acquisition_type==='owned'?'Produto próprio':product.category||'Produto'}</p>
        {product.inventory_mode==='stock'?<span className="cp-vision-stock-count"><Package size={14}/> Estoque: <b>{product.quantity_available} un.</b></span>:<span className="cp-vision-stock-count cp-vision-single-count"><Tag size={14}/>{tradeOut?'Item trocado':isSold?'Item vendido':'Peça disponível'}</span>}
      </div>
      <span className="cp-vision-dots" aria-hidden="true">•••</span>
    </div>
    <div className="cp-vision-product-prices">
      <div><span>Custo</span><strong>{product.cost_basis_known?money.format(cost):'Não informado'}</strong></div>
      <div><span>Venda</span><strong>{price!==null?money.format(price):'Não definido'}</strong></div>
    </div>
    <div className="cp-vision-profit" data-tone={margin!==null&&margin<0?'negative':'positive'}>
      <span><ArrowUpRight size={16}/> {product.inventory_mode==='single'?'Lucro da venda':'Lucro por unidade'}</span>
      <strong>{margin===null?'—':money.format(margin)}</strong>
    </div>
  </button>
}

function StockPage({data,calc,onOpenProduct,onAdd}:{data:Data;calc:Metrics;onOpenProduct:(p:Product)=>void;onAdd:()=>void}){
  const [q,setQ]=useState('')
  const [filter,setFilter]=useState<'all'|'stock'|'low'|'listed'|'attention'|'sold'>('all')
  const active=data.products.filter(p=>p.quantity_available>0)
  const lowCount=active.filter(p=>p.inventory_mode==='stock'&&p.quantity_available<=3).length
  const listedCount=active.filter(p=>p.listing_status==='listed').length
  const reviewCount=active.filter(p=>p.listing_status==='listed'&&!!p.listing_next_checkin_at&&p.listing_next_checkin_at<=localDate()).length
  const list=data.products.filter(p=>{
    if(!(p.name+' '+(p.category||'')).toLowerCase().includes(q.toLowerCase()))return false
    if(filter==='stock')return p.quantity_available>0
    if(filter==='low')return p.inventory_mode==='stock'&&p.quantity_available>0&&p.quantity_available<=3
    if(filter==='listed')return p.quantity_available>0&&p.listing_status==='listed'
    if(filter==='attention')return p.quantity_available>0&&(daysSince(p.purchase_date)>=calc.alertDays||(p.listing_status==='listed'&&!!p.listing_next_checkin_at&&p.listing_next_checkin_at<=localDate()))
    if(filter==='sold')return p.quantity_available===0
    return true
  }).sort((a,b)=>Number(b.quantity_available>0)-Number(a.quantity_available>0))
  return <div className="cp-page cp-vision-stock-page">
    <PageTitle eyebrow={new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'short'})} title="Estoque" text="Controle completo do seu inventário." action={<button className="cp-primary cp-small" onClick={onAdd}><Plus size={18}/> Adicionar item</button>}/>
    <div className="cp-vision-stock-toolbar">
      <label className="cp-search cp-vision-stock-search"><Search size={21}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar produto por nome, modelo ou referência..."/></label>
      <div className="cp-filter-tabs cp-vision-filters" role="group" aria-label="Filtrar estoque">
        {([['all','Todos'],['stock','Disponível'],['low','Baixo estoque'],['listed','Anúncios'],['attention','Atenção'],['sold','Vendidos']] as const).map(([key,label])=><button type="button" key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}
      </div>
    </div>
    <section className="cp-vision-stock-stats" aria-label="Resumo do estoque">
      <div><span className="cp-vision-stat-icon"><Box/></span><small>Capital em estoque</small><strong>{money.format(calc.stockCapital)}</strong></div>
      <div><span className="cp-vision-stat-icon"><Tag/></span><small>Produtos ativos</small><strong>{number.format(active.length)}</strong></div>
      <div><span className="cp-vision-stat-icon cp-vision-stat-alert" data-premium-icon={lowCount>0?"low-stock":undefined}><AlertTriangle/></span><small>Baixo estoque</small><strong>{number.format(lowCount)}</strong></div>
    </section>
    <div className="cp-vision-stock-note"><span><Package size={15}/> {calc.stockUnits} unidades disponíveis</span><span>{listedCount} anúncios ativos · {reviewCount} revisão(ões)</span></div>
    {list.length?<div className="cp-stock-grid cp-vision-stock-grid">{list.map(p=><ProductCard key={p.id} product={p} data={data} calc={calc} onClick={()=>onOpenProduct(p)}/>)}</div>:<Empty icon={<Search/>} title="Nada por aqui" text={q?'Nenhum produto combina com essa busca.':'Não há produtos para este filtro.'} action={q?undefined:'Adicionar produto'} onAction={onAdd}/>}
  </div>
}

function SalesPage({data,calc,onSale,onOpenProduct}:{data:Data;calc:Metrics;onSale:()=>void;onOpenProduct:(p:Product)=>void}){
  const [period,setPeriod]=useState<'all'|'today'|'week'|'month'>('all')
  const today=localDate()
  const completed=data.sales.filter(s=>s.status==='completed')
  const todaySales=completed.filter(s=>s.sale_date===today)
  const todayTotal=todaySales.reduce((sum,s)=>sum+calc.saleStats(s).revenue,0)
  const ticket=completed.length?completed.reduce((sum,s)=>sum+calc.saleStats(s).revenue,0)/completed.length:0
  const monthSales=completed.filter(s=>s.sale_date.startsWith(today.slice(0,7)))
  const includesTrades=data.tradeIns.some(trade=>trade.trade_date.startsWith(today.slice(0,7)))
  const chart=recentDailyValues(monthSales.map(s=>({date:s.sale_date,amount:calc.saleStats(s).revenue})),15,true,0)
  const filtered=data.sales.filter(s=>period==='all'||period==='today'&&s.sale_date===today||period==='week'&&s.sale_date>=addDays(today,-6)||period==='month'&&s.sale_date.startsWith(today.slice(0,7))).sort((a,b)=>b.sale_date.localeCompare(a.sale_date)||b.created_at.localeCompare(a.created_at))
  return <div className="cp-page cp-vision-sales-page">
    <PageTitle eyebrow={new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'short'})} title="Vendas" text="Acompanhe o desempenho da sua operação." action={<button className="cp-primary cp-small" onClick={onSale}><Plus size={18}/> Nova venda</button>}/>
    <section className="cp-vision-sales-hero">
      <div className="cp-vision-sales-hero-info"><span><BarChart3 size={21}/> Desempenho de vendas</span><small>{includesTrades?'Vendas e trocas no mês · valor negociado':'Acumulado de vendas no mês'}</small><strong>{money.format(calc.monthRevenue)}</strong><em>{calc.monthOrders} pedido(s) fechado(s) no mês</em></div>
      <PremiumAreaChart values={chart.values} labels={chart.labels} variant="dark"/>
    </section>
    <section className="cp-vision-sales-stats">
      <div><span className="cp-vision-stat-icon"><Clock3/></span><small>Hoje</small><strong>{money.format(todayTotal)}</strong><em>{todaySales.length} venda(s)</em></div>
      <div><span className="cp-vision-stat-icon"><BarChart3/></span><small>No mês</small><strong>{money.format(calc.monthRevenue)}</strong><em>{includesTrades?'Inclui bens recebidos em trocas':'Faturamento real'}</em></div>
      <div><span className="cp-vision-stat-icon"><Tag/></span><small>Ticket médio</small><strong>{money.format(ticket)}</strong><em>Por venda concluída</em></div>
      <div><span className="cp-vision-stat-icon" data-premium-icon={calc.monthOrders>0?"verified":undefined}><ShoppingBag/></span><small>Pedidos fechados</small><strong>{number.format(calc.monthOrders)}</strong><em>Neste mês</em></div>
    </section>
    <div className="cp-vision-sales-filters cp-filter-tabs" role="group" aria-label="Período das vendas">
      {([['all','Todas'],['today','Hoje'],['week','Semana'],['month','Mês']] as const).map(([key,label])=><button key={key} className={period===key?'active':''} onClick={()=>setPeriod(key)}>{label}</button>)}
    </div>
    <div className="cp-section-head cp-vision-list-heading"><div><h2>Vendas e trocas</h2></div><span>{filtered.length} registro(s)</span></div>
    {filtered.length?<div className="cp-sale-list cp-vision-sale-list">{filtered.map(sale=>{
      const stats=calc.saleStats(sale)
      const items=data.grouped.itemsBySale.get(sale.id)||[]
      const quantity=items.reduce((sum,item)=>sum+item.quantity,0)
      const product=items[0]?calc.productMap.get(items[0].product_id):undefined
      const photo=product?(data.grouped.photosByProduct.get(product.id)||[])[0]?.signed_url:null
      const customer=sale.customer_id?data.grouped.customerById.get(sale.customer_id):null
      const trade=data.grouped.tradeBySale.get(sale.id)
      const received=trade?calc.productMap.get(trade.incoming_product_id):null
      const status=sale.status==='cancelled'?'Cancelada':trade?'Concluída':sale.payment_mode==='receivable'?'A receber':'Paga'
      return <button type="button" key={sale.id} className="cp-sale-row cp-vision-sale-row" onClick={()=>product&&onOpenProduct(product)}>
        <span className="cp-sale-thumb">{photo?<img src={photo} alt=""/>:<ReceiptText/>}</span>
        <div className="cp-sale-main"><strong>{trade?'Troca: '+(product?.name||'Produto')+' por '+(received?.name||'item recebido'):product?.name||'Venda'}{!trade&&items.length>1?' + '+(items.length-1)+' item(ns)':''}</strong><span>{trade?(trade.cash_direction==='received'?'Volta recebida: '+money.format(trade.cash_amount):trade.cash_direction==='paid'?'Volta paga: '+money.format(trade.cash_amount):'Sem volta em dinheiro'):saleChannelLabel(sale.sale_channel,sale.sale_channel_other)+' · '+(customer?.name||quantity+' un. vendida(s)')}</span><span>{new Date(sale.sale_date+'T12:00:00').toLocaleDateString('pt-BR')}</span></div>
        <div className="cp-vision-sale-badges"><span>{trade?'Troca':paymentLabel(sale.payment_method)}</span><span className={sale.status==='cancelled'?'is-cancelled':sale.payment_mode==='receivable'?'is-receivable':'is-paid'}>{status}</span></div>
        <div className="cp-sale-money"><b>{money.format(stats.revenue)}</b><span className={stats.profit>=0?'positive':'negative'}>{trade?'Valor negociado':money.format(stats.profit)+' lucro'}</span></div>
        <ChevronRight className="cp-vision-row-chevron" size={17}/>
      </button>
    })}</div>:<Empty icon={<ReceiptText/>} title="Nenhuma venda neste período" text="Os registros aparecerão aqui conforme o filtro selecionado." action="Registrar venda" onAction={onSale}/>}
  </div>
}

function CashPage({data,calc,onCash,onSettings}:{data:Data;calc:Metrics;onCash:()=>void;onSettings:()=>void}){
  const [filter,setFilter]=useState<'all'|'income'|'expense'>('all')
  const incoming=data.cashEntries.filter(x=>x.kind==='income').reduce((s,x)=>s+x.amount,0)
  const outgoing=data.cashEntries.filter(x=>x.kind==='expense').reduce((s,x)=>s+x.amount,0)
  const month=localDate().slice(0,7)
  const monthEntries=data.cashEntries.filter(e=>e.occurred_at.startsWith(month))
  const monthIn=monthEntries.filter(e=>e.kind==='income').reduce((s,e)=>s+e.amount,0)
  const monthOut=monthEntries.filter(e=>e.kind==='expense').reduce((s,e)=>s+e.amount,0)
  const chart=recentDailyValues(data.cashEntries.map(e=>({date:e.occurred_at,amount:e.kind==='income'?e.amount:-e.amount})),15,true,data.settings?.initial_cash||0)
  const rows=data.cashEntries.filter(e=>filter==='all'||e.kind===filter)
  return <div className="cp-page cp-vision-cash-page">
    <PageTitle eyebrow={new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'short'})} title="Caixa" text="Acompanhe entradas, saídas e seu dinheiro disponível." action={<button className="cp-primary cp-small" onClick={onCash}><ArrowUpRight size={18}/> Movimentar</button>}/>
    <section className="cp-vision-cash-hero">
      <div className="cp-vision-cash-balance"><span className="cp-vision-balance-symbol"><WalletCards/></span><div><small>Saldo do caixa</small><strong>{money.format(calc.cash)}</strong></div></div>
      <div className="cp-vision-cash-pair"><div><span className="cp-vision-in"><ArrowUpRight/></span><div><small>Entradas registradas</small><strong>{money.format(incoming)}</strong></div></div><div><span className="cp-vision-out"><ArrowDownRight/></span><div><small>Saídas registradas</small><strong>{money.format(outgoing)}</strong></div></div></div>
      <button className="cp-vision-cash-settings" onClick={onSettings}>Ajustar saldo inicial <ChevronRight size={14}/></button>
    </section>
    <section className="cp-vision-cash-stats"><div><span className="cp-vision-stat-icon cp-vision-positive"><ArrowUpRight/></span><small>Entradas do mês</small><strong className="positive">{money.format(monthIn)}</strong></div><div><span className="cp-vision-stat-icon cp-vision-negative"><ArrowDownRight/></span><small>Saídas do mês</small><strong className="negative">{money.format(monthOut)}</strong></div><div><span className="cp-vision-stat-icon"><WalletCards/></span><small>Saldo atual</small><strong>{money.format(calc.cash)}</strong></div></section>
    <section className="cp-vision-cash-chart"><div className="cp-vision-panel-heading"><span className="cp-vision-stat-icon"><BarChart3/></span><div><h2>Movimentação diária do caixa</h2><small>Saldo acumulado nos últimos 15 dias</small></div></div><PremiumAreaChart values={chart.values} labels={chart.labels}/></section>
    <section className="cp-vision-cash-history"><div className="cp-vision-history-head"><h2>Movimentações recentes</h2><div className="cp-filter-tabs cp-vision-cash-filters" role="group" aria-label="Filtrar movimentos">{([['all','Tudo'],['income','Entradas'],['expense','Saídas']] as const).map(([key,label])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}</div></div>
      {rows.length?<div className="cp-cash-list cp-vision-cash-list">{rows.map(e=><CashRow key={e.id} entry={e}/>)}</div>:<Empty icon={<WalletCards/>} title="Nenhuma movimentação" text="As entradas e saídas registradas aparecem aqui." action="Adicionar movimentação" onAction={onCash}/>}
    </section>
  </div>
}

function CashRow({entry}:{entry:CashEntry}){
  const positive=entry.kind==='income'
  return <div className="cp-cash-row"><span className={positive?'cp-move-icon positive':'cp-move-icon negative'}>{positive?<ArrowUpRight/>:<ArrowDownRight/>}</span><div><strong>{entry.description}</strong><span>{new Date(entry.occurred_at+'T12:00:00').toLocaleDateString('pt-BR')} · {cashCategory(entry.category)}</span></div><b className={positive?'positive':'negative'}>{(positive?'+ ':'− ')+money.format(entry.amount)}</b></div>
}

function PageTitle({eyebrow,title,text,action}:{eyebrow:string;title:string;text:string;action?:React.ReactNode}){return <section className="cp-page-title"><div><span className="cp-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</section>}
function Empty({icon,title,text,action,onAction}:{icon:React.ReactNode;title:string;text:string;action?:string;onAction?:()=>void}){return <div className="cp-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action&&onAction&&<button className="cp-secondary" onClick={onAction}>{action}</button>}</div>}

function BottomNav({view,onView,onAdd}:{view:ControlView;onView:(v:ControlView)=>void;onAdd:()=>void}){
  return <nav className="cp-bottom"><div className="cp-bottom-inner"><button className={view==='home'?'active':''} onClick={()=>onView('home')}><Home/><span>Início</span></button><button className={view==='stock'?'active':''} onClick={()=>onView('stock')}><Package/><span>Estoque</span></button><button className="cp-add-main" onClick={onAdd}><Plus/><span>Registrar</span></button><button className={view==='sales'?'active':''} onClick={()=>onView('sales')}><ReceiptText/><span>Vendas</span></button><button className={view==='cash'?'active':''} onClick={()=>onView('cash')}><WalletCards/><span>Caixa</span></button></div></nav>
}

function StockAddSheet({data,onClose,onOwn,onRegisterPurchase,onOpenPurchased}:{data:Data;onClose:()=>void;onOwn:()=>void;onRegisterPurchase:()=>void;onOpenPurchased:(product:Product)=>void}){
  const purchased=data.products.filter(product=>product.acquisition_type==='purchase')
  return <ModalShell onClose={onClose} compact><div className="cp-action-sheet cp-stock-add-sheet">
    <span className="cp-eyebrow">ADICIONAR AO ESTOQUE</span>
    <h2>De onde vem esse produto?</h2>
    <p>Compras registradas no CONTROLE+ já entram no estoque automaticamente. Assim você não duplica mercadoria.</p>
    <Action icon={<Box/>} title="Produto que já tenho" text="Algo que já era seu · não mexe no caixa" onClick={onOwn}/>
    <Action icon={<ShoppingBag/>} title="Ainda não registrei a compra" text="Registra a compra, desconta do caixa e coloca no estoque" onClick={onRegisterPurchase}/>
    {purchased.length>0&&<div className="cp-stock-existing"><div className="cp-stock-existing-head"><span>COMPRAS JÁ CADASTRADAS</span><small>Esses produtos já fazem parte do estoque/histórico.</small></div><div className="cp-stock-existing-list">{purchased.slice(0,8).map(product=><button type="button" key={product.id} onClick={()=>onOpenPurchased(product)}><span><Package/></span><div><b>{product.name}</b><small>{product.quantity_available>0?product.quantity_available+' un. disponível(is)':'Sem unidades disponíveis · ver histórico'}</small></div><ChevronRight/></button>)}</div></div>}
  </div></ModalShell>
}

function ActionSheet({onClose,onChoose}:{onClose:()=>void;onChoose:(m:Modal)=>void}){
  return <ModalShell onClose={onClose} compact><div className="cp-action-sheet cp-vision-actions">
    <div className="cp-vision-actions-head"><span className="cp-vision-actions-mark"><Plus size={23}/></span><div><h2>Registrar</h2><p>Ações rápidas para o seu dia a dia</p></div></div>
    <div className="cp-vision-action-grid">
      <Action icon={<ShoppingBag/>} title="Registrar venda" text="Lance uma venda e atualize seus resultados." onClick={()=>onChoose('sale')}/>
      <Action icon={<Package/>} title="Adicionar estoque" text="Inclua produtos e mantenha seu controle." onClick={()=>onChoose('stockAdd')}/>
      <Action icon={<WalletCards/>} title="Movimentar caixa" text="Registre entradas e saídas do caixa." onClick={()=>onChoose('cash')}/>
      <Action icon={<ArrowDownRight/>} title="Registrar gasto" text="Organize reparos, taxas e outros custos." onClick={()=>onChoose('expense')}/>
      <Action icon={<ShoppingBag/>} title="Registrar compra" text="Compre para revender e atualize o estoque." onClick={()=>onChoose('purchase')}/>
      <Action icon={<Box/>} title="Produto próprio" text="Cadastre algo que já é seu, sem mexer no caixa." onClick={()=>onChoose('inventory')}/>
    </div>
  </div></ModalShell>
}
function Action({icon,title,text,onClick}:{icon:React.ReactNode;title:string;text:string;onClick:()=>void}){return <button type="button" onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><ChevronRight/></button>}

function ListingSetup({isListed,setIsListed,channels,setChannels,listingDate,setListingDate}:{isListed:boolean;setIsListed:(v:boolean)=>void;channels:string[];setChannels:(v:string[])=>void;listingDate:string;setListingDate:(v:string)=>void}){
  function toggle(channel:string){setChannels(channels.includes(channel)?channels.filter(x=>x!==channel):[...channels,channel])}
  return <div className="cp-listing-setup">
    <div className="cp-listing-question"><div><Megaphone/><div><b>Esse produto já está anunciado?</b><small>Se estiver, o CONTROLE+ acompanha o anúncio com você.</small></div></div><div className="cp-yes-no"><button type="button" className={!isListed?'active':''} onClick={()=>setIsListed(false)}>Não</button><button type="button" className={isListed?'active':''} onClick={()=>setIsListed(true)}>Sim</button></div></div>
    {isListed&&<div className="cp-listing-fields">
      <div className="cp-field cp-field--full"><span>Onde está anunciado?</span><div className="cp-channel-grid">{LISTING_CHANNELS.map(channel=><button type="button" key={channel} className={channels.includes(channel)?'active':''} onClick={()=>toggle(channel)}>{channels.includes(channel)&&<Check size={14}/>} {channel}</button>)}</div></div>
      <Field label="Desde quando está anunciado?"><input type="date" max={localDate()} value={listingDate} onChange={e=>setListingDate(e.target.value)}/></Field>
      <div className="cp-listing-age"><Clock3/><div><b>{daysSince(listingDate)} dia(s) de anúncio</b><small>{daysSince(listingDate)>=5?'Já entra na rotina de acompanhamento.':'A primeira revisão acontece ao completar 5 dias.'}</small></div></div>
    </div>}
  </div>
}

function InventoryModePicker({mode,onChange}:{mode:'single'|'stock';onChange:(v:'single'|'stock')=>void}){
  return <div className="cp-field cp-field--full cp-inventory-mode-field"><span>Você tem estoque deste produto?</span><div className="cp-inventory-mode-choices" role="group" aria-label="Tipo de produto"><button type="button" aria-pressed={mode==='single'} className={mode==='single'?'active':''} onClick={()=>onChange('single')}><b>Item único</b><small>Uma peça para vender uma vez</small></button><button type="button" aria-pressed={mode==='stock'} className={mode==='stock'?'active':''} onClick={()=>onChange('stock')}><b>Tenho estoque</b><small>Controle de quantidades e reposição</small></button></div></div>
}

function PurchaseModal({data,onClose,onDone}:{data:Data;onClose:()=>void;onDone:()=>void}){
  const [step,setStep]=useState(1)
  const [name,setName]=useState(''),[category,setCategory]=useState(''),[source,setSource]=useState('Marketplace'),[date,setDate]=useState(localDate()),[supplierId,setSupplierId]=useState('')
  const [inventoryMode,setInventoryMode]=useState<'single'|'stock'>('single')
  const [cost,setCost]=useState(''),[qty,setQty]=useState('1'),[listed,setListed]=useState(''),[minimum,setMinimum]=useState(''),[notes,setNotes]=useState('')
  const [isListed,setIsListed]=useState(false),[channels,setChannels]=useState<string[]>([]),[listingDate,setListingDate]=useState(localDate())
  const [files,setFiles]=useState<File[]>([]),[error,setError]=useState<string|null>(null)
  async function save(){
    setError(null)
    try{
      if(!name.trim())throw new Error('Dê um nome para o produto.')
      if(inventoryMode==='stock'&&(!Number.isInteger(Number(qty))||Number(qty)<1))throw new Error('Informe uma quantidade inteira maior que zero.')
      const purchase=Number(cost.replace(',','.'))
      if(!Number.isFinite(purchase)||purchase<0)throw new Error('Informe quanto você pagou.')
      const listPrice=listed?Number(listed.replace(',','.')):null
      if(isListed&&(!listPrice||listPrice<=0))throw new Error('Informe o preço do anúncio.')
      if(isListed&&channels.length===0)throw new Error('Selecione onde o produto está anunciado.')
      await data.createProduct({
        name:name.trim(),category:category.trim(),source,supplierId:supplierId||null,
        purchaseDate:date,purchaseUnitCost:purchase,inventoryMode,quantity:inventoryMode==='single'?1:Math.max(1,Number(qty)||1),
        listedPrice:listPrice,minimumPrice:minimum?Number(minimum.replace(',','.')):null,notes,
        acquisitionType:'purchase',costBasisKnown:true,
        listingStatus:isListed?'listed':'not_listed',listingChannels:channels,
        listingStartedAt:isListed?listingDate:null
      },files)
      onDone()
    }catch(err:any){setError(err?.message||'Não foi possível salvar a compra.')}
  }
  return <ModalShell onClose={onClose}><ModalHeader eyebrow="NOVA COMPRA" title={step===1?'O que você comprou?':step===2?'Valores e anúncio':'Fotos e detalhes'} text={step===1?'Comece pelo básico. Você pode detalhar depois.':step===2?'Separe o que é custo, preço de venda e situação do anúncio.':'Guarde fotos e observações do estado do produto.'}/><Stepper step={step}/>
    {step===1&&<div className="cp-form-grid"><Field label="Produto" full><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: iPhone 11 128GB"/></Field><Field label="Categoria"><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Celular, ferramenta..."/></Field><Field label="Onde comprou?"><select value={source} onChange={e=>setSource(e.target.value)}><option>Marketplace</option><option>OLX</option><option>Fornecedor</option><option>Loja</option><option>Outro</option></select></Field><Field label="Data da compra"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Fornecedor salvo (opcional)" full><select value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">Não vincular</option>{data.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}{s.source?' · '+s.source:''}</option>)}</select></Field><Tip text="Essa compra sai do caixa automaticamente e entra no estoque."/></div>}
    {step===2&&<div className="cp-form-grid"><Field label="Quanto pagou por unidade?"><MoneyInput value={cost} setValue={setCost} placeholder="0,00"/></Field><InventoryModePicker mode={inventoryMode} onChange={setInventoryMode}/>{inventoryMode==='stock'&&<Field label="Quantidade em estoque"><input type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></Field>}<Field label={isListed?'Preço anunciado':'Preço que pretende anunciar'}><MoneyInput value={listed} setValue={setListed} placeholder="Opcional"/></Field><Field label="Menor valor que aceitaria"><MoneyInput value={minimum} setValue={setMinimum} placeholder="Opcional"/></Field><ListingSetup isListed={isListed} setIsListed={setIsListed} channels={channels} setChannels={setChannels} listingDate={listingDate} setListingDate={setListingDate}/><div className="cp-live-summary"><span>Investimento inicial</span><strong>{money.format((Number(cost.replace(',','.'))||0)*(inventoryMode==='single'?1:(Number(qty)||1)))}</strong><small>Será registrado automaticamente como saída do caixa.</small></div></div>}
    {step===3&&<div className="cp-form-grid"><label className="cp-photo-drop"><ImagePlus size={28}/><b>{files.length?files.length+' foto(s) selecionada(s)':'Adicionar fotos'}</b><span>Até 8 imagens · 10 MB cada</span><input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,8))}/></label>{files.length>0&&<div className="cp-photo-preview">{files.map((file,i)=><div key={file.name+i}><img src={URL.createObjectURL(file)} alt=""/><button type="button" onClick={()=>setFiles(list=>list.filter((_,index)=>index!==i))}><X/></button></div>)}</div>}<Field label="Observações" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Defeito, acessório, detalhe da compra..."/></Field><div className="cp-review-box"><b>{name||'Seu produto'}</b><span>{(inventoryMode==='single'?'Item único':qty+' un. em estoque')+' · '+money.format(Number(cost.replace(',','.'))||0)+' cada'}</span><span>{isListed?'Anunciado em '+channels.join(', '):'Ainda não anunciado'}</span><span>{files.length+' foto(s) no histórico'}</span></div></div>}
    {error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions">{step>1&&<button className="cp-secondary" onClick={()=>setStep(s=>s-1)}>Voltar</button>}<button className="cp-primary" disabled={data.busy} onClick={()=>step<3?setStep(s=>s+1):void save()}>{data.busy?'Salvando...':step<3?'Continuar':'Salvar compra'}</button></div>
  </ModalShell>
}

function InventoryModal({data,onClose,onDone}:{data:Data;onClose:()=>void;onDone:()=>void}){
  const [step,setStep]=useState(1)
  const [name,setName]=useState(''),[category,setCategory]=useState(''),[qty,setQty]=useState('1')
  const [inventoryMode,setInventoryMode]=useState<'single'|'stock'>('single')
  const [knowCost,setKnowCost]=useState(false),[cost,setCost]=useState(''),[listed,setListed]=useState(''),[minimum,setMinimum]=useState('')
  const [isListed,setIsListed]=useState(false),[channels,setChannels]=useState<string[]>([]),[listingDate,setListingDate]=useState(localDate())
  const [files,setFiles]=useState<File[]>([]),[notes,setNotes]=useState(''),[error,setError]=useState<string|null>(null)
  async function save(){
    setError(null)
    try{
      if(!name.trim())throw new Error('Dê um nome para o produto.')
      if(inventoryMode==='stock'&&(!Number.isInteger(Number(qty))||Number(qty)<1))throw new Error('Informe uma quantidade inteira maior que zero.')
      const originalCost=knowCost?(Number(cost.replace(',','.'))||0):0
      const listPrice=listed?Number(listed.replace(',','.')):null
      if(knowCost&&originalCost<0)throw new Error('Informe um custo válido.')
      if(isListed&&(!listPrice||listPrice<=0))throw new Error('Informe o preço do anúncio.')
      if(isListed&&channels.length===0)throw new Error('Selecione onde o produto está anunciado.')
      await data.createProduct({
        name:name.trim(),category:category.trim(),source:'Produto próprio',
        purchaseDate:localDate(),purchaseUnitCost:originalCost,inventoryMode,quantity:inventoryMode==='single'?1:Math.max(1,Number(qty)||1),
        listedPrice:listPrice,minimumPrice:minimum?Number(minimum.replace(',','.')):null,notes,
        acquisitionType:'owned',costBasisKnown:knowCost,
        listingStatus:isListed?'listed':'not_listed',listingChannels:channels,
        listingStartedAt:isListed?listingDate:null
      },files)
      onDone()
    }catch(err:any){setError(err?.message||'Não foi possível adicionar o produto.')}
  }
  return <ModalShell onClose={onClose}><ModalHeader eyebrow="PRODUTO QUE JÁ É SEU" title={step===1?'O que você quer vender?':step===2?'Preço e anúncio':'Fotos e detalhes'} text={step===1?'Cadastre algo que você já tem em casa ou já possuía. Isso não tira dinheiro do caixa.':step===2?'Se já estiver anunciado, o CONTROLE+ começa a acompanhar o desempenho.':'Fotos ajudam a reconhecer o item no estoque e acompanhar a venda.'}/><Stepper step={step}/>
    {step===1&&<div className="cp-form-grid"><Field label="Produto" full><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: TV Samsung 43, bicicleta, ferramenta..."/></Field><Field label="Categoria"><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Eletrônico, ferramenta..."/></Field><InventoryModePicker mode={inventoryMode} onChange={setInventoryMode}/>{inventoryMode==='stock'&&<Field label="Quantidade em estoque"><input type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></Field>}<Tip text="Produto próprio entra no estoque, mas não gera saída no caixa."/></div>}
    {step===2&&<div className="cp-form-grid"><div className="cp-field cp-field--full"><span>Quer considerar quanto esse produto te custou?</span><div className="cp-cost-choice"><button type="button" className={!knowCost?'active':''} onClick={()=>setKnowCost(false)}>Não sei / não considerar</button><button type="button" className={knowCost?'active':''} onClick={()=>setKnowCost(true)}>Sim, sei o valor</button></div></div>{knowCost&&<Field label="Custo original por unidade"><MoneyInput value={cost} setValue={setCost} placeholder="0,00"/></Field>}<Field label={isListed?'Preço anunciado':'Preço que pretende vender'}><MoneyInput value={listed} setValue={setListed} placeholder="Opcional"/></Field><Field label="Menor valor que aceitaria"><MoneyInput value={minimum} setValue={setMinimum} placeholder="Opcional"/></Field><ListingSetup isListed={isListed} setIsListed={setIsListed} channels={channels} setChannels={setChannels} listingDate={listingDate} setListingDate={setListingDate}/></div>}
    {step===3&&<div className="cp-form-grid"><label className="cp-photo-drop"><ImagePlus size={28}/><b>{files.length?files.length+' foto(s) selecionada(s)':'Adicionar fotos'}</b><span>Até 8 imagens · 10 MB cada</span><input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,8))}/></label>{files.length>0&&<div className="cp-photo-preview">{files.map((file,i)=><div key={file.name+i}><img src={URL.createObjectURL(file)} alt=""/><button type="button" onClick={()=>setFiles(list=>list.filter((_,index)=>index!==i))}><X/></button></div>)}</div>}<Field label="Observações" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Estado, acessórios, defeitos, motivo da venda..."/></Field><div className="cp-review-box"><b>{name||'Seu produto'}</b><span>Produto próprio · não movimenta o caixa</span><span>{isListed?'Anunciado há '+daysSince(listingDate)+' dia(s)':'Ainda não anunciado'}</span></div></div>}
    {error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions">{step>1&&<button className="cp-secondary" onClick={()=>setStep(s=>s-1)}>Voltar</button>}<button className="cp-primary" disabled={data.busy} onClick={()=>step<3?setStep(s=>s+1):void save()}>{data.busy?'Salvando...':step<3?'Continuar':'Adicionar ao estoque'}</button></div>
  </ModalShell>
}

function SaleModal({data,initialProduct,onClose,onDone,onTradeDone}:{data:Data;initialProduct:Product|null;onClose:()=>void;onDone:()=>void;onTradeDone:()=>void}){
  const available=data.products.filter(p=>p.quantity_available>0)
  const first=initialProduct&&initialProduct.quantity_available>0?initialProduct:available[0]
  const [productId,setProductId]=useState(first?.id||'')
  const [qty,setQty]=useState('1')
  const [transactionType,setTransactionType]=useState<'sale'|'trade'>('sale')
  const [price,setPrice]=useState(first?.listed_price?String(first.listed_price):'')
  const [date,setDate]=useState(localDate())
  const [payment,setPayment]=useState('pix')
  const [paymentMode,setPaymentMode]=useState<'paid'|'receivable'>('paid')
  const [saleChannel,setSaleChannel]=useState('')
  const [saleChannelOther,setSaleChannelOther]=useState('')
  const [customerId,setCustomerId]=useState('')
  const [newCustomer,setNewCustomer]=useState(false)
  const [customerName,setCustomerName]=useState('')
  const [customerPhone,setCustomerPhone]=useState('')
  const [installments,setInstallments]=useState('2')
  const [firstDue,setFirstDue]=useState(localDate())
  const [notes,setNotes]=useState('')
  const [error,setError]=useState<string|null>(null)
  const product=available.find(p=>p.id===productId)
  const calc=buildMetrics(data)
  const cost=product?calc.unitCost(product)*(Number(qty)||1):0
  const revenue=(Number(price.replace(',','.'))||0)*(Number(qty)||1)

  async function save(){
    setError(null)
    try{
      if(!product)throw new Error('Escolha o produto vendido.')
      const value=Number(price.replace(',','.'))
      if(!Number.isFinite(value)||value<=0)throw new Error('Informe o valor da venda.')
      if(!saleChannel)throw new Error('Selecione por onde vendeu o item.')
      if(saleChannel==='other'&&!saleChannelOther.trim())throw new Error('Informe o canal de venda.')
      let customer=customerId||null
      if(newCustomer){
        if(!customerName.trim())throw new Error('Informe o nome do cliente.')
        const created=await data.createCustomer(customerName,customerPhone)
        customer=created.id
      }
      if(paymentMode==='receivable'&&!customer)throw new Error('Para venda a prazo, informe quem vai pagar.')
      await data.registerSale({
        saleChannel,saleChannelOther:saleChannel==='other'?saleChannelOther.trim():'',
        productId:product.id,
        quantity:Math.max(1,Number(qty)||1),
        unitPrice:value,
        saleDate:date,
        paymentMethod:paymentMode==='receivable'?'receivable':payment,
        paymentMode,
        customerId:customer,
        installmentCount:paymentMode==='receivable'?Math.max(1,Math.min(24,Number(installments)||1)):1,
        firstDueDate:paymentMode==='receivable'?firstDue:null,
        notes
      })
      onDone()
    }catch(err:any){setError(err?.message||'Não foi possível registrar a venda.')}
  }

  if(transactionType==='trade'&&product?.inventory_mode==='single')return <TradeModal data={data} initialProduct={product} onClose={onClose} onBack={()=>setTransactionType('sale')} onDone={onTradeDone}/>

  return <ModalShell onClose={onClose}>
    <ModalHeader eyebrow="REGISTRAR VENDA" title="O dinheiro entrou agora ou vai entrar depois?" text="Essa escolha faz o caixa ficar real. Venda a prazo entra em A receber, não no saldo livre."/>
    {available.length?<div className="cp-form-grid">
      <Field label="Produto vendido" full><select value={productId} onChange={e=>{setProductId(e.target.value);setTransactionType('sale');const p=available.find(x=>x.id===e.target.value);setPrice(p?.listed_price?String(p.listed_price):'')}}>{available.map(p=><option key={p.id} value={p.id}>{p.name+' · '+p.quantity_available+' disp.'}</option>)}</select></Field>
      {product?.inventory_mode==='single'&&<div className="cp-field cp-field--full"><span>Como será a negociação?</span><div className="cp-trade-type-switch"><button type="button" className="active" onClick={()=>setTransactionType('sale')}><Banknote size={18}/><b>Venda</b></button><button type="button" onClick={()=>setTransactionType('trade')}><RefreshCw size={18}/><b>Troca</b></button></div></div>}<Field label="Quantidade"><input type="number" min="1" max={product?.quantity_available||1} value={qty} onChange={e=>setQty(e.target.value)}/></Field>
      <Field label="Valor por unidade"><MoneyInput value={price} setValue={setPrice} placeholder="0,00"/></Field>
      <Field label="Data da venda"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
      <Field label="Por onde vendeu?" full><select required value={saleChannel} onChange={e=>setSaleChannel(e.target.value)}><option value="">Selecione o canal da venda</option>{SALE_CHANNELS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field>
      {saleChannel==='other'&&<Field label="Qual canal?" full><input maxLength={120} value={saleChannelOther} onChange={e=>setSaleChannelOther(e.target.value)} placeholder="Ex.: grupo de bairro"/></Field>}
      <div className="cp-field cp-field--full"><span>Como será recebido?</span><div className="cp-sale-mode"><button type="button" className={paymentMode==='paid'?'active':''} onClick={()=>setPaymentMode('paid')}><Banknote/><div><b>Recebi agora</b><small>entra no caixa hoje</small></div></button><button type="button" className={paymentMode==='receivable'?'active':''} onClick={()=>setPaymentMode('receivable')}><Clock3/><div><b>Venda a prazo</b><small>cria parcelas a receber</small></div></button></div></div>
      {paymentMode==='paid'&&<Field label="Pagamento"><select value={payment} onChange={e=>setPayment(e.target.value)}><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="card">Cartão</option><option value="transfer">Transferência</option><option value="other">Outro</option></select></Field>}
      <Field label={paymentMode==='receivable'?'Quem vai pagar?':'Cliente (opcional)'} full><select value={newCustomer?'new':customerId} onChange={e=>{if(e.target.value==='new'){setNewCustomer(true);setCustomerId('')}else{setNewCustomer(false);setCustomerId(e.target.value)}}}><option value="">Não informar</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}<option value="new">+ Novo cliente</option></select></Field>
      {newCustomer&&<><Field label="Nome do cliente"><input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Nome"/></Field><Field label="WhatsApp"><input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="Opcional"/></Field></>}
      {paymentMode==='receivable'&&<><Field label="Quantidade de parcelas"><input type="number" min="1" max="24" value={installments} onChange={e=>setInstallments(e.target.value)}/></Field><Field label="Primeiro vencimento"><input type="date" value={firstDue} onChange={e=>setFirstDue(e.target.value)}/></Field></>}
      <Field label="Observação" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex.: entreguei com carregador"/></Field>
      <div className={paymentMode==='receivable'?'cp-profit-preview cp-profit-preview--receivable':'cp-profit-preview'}>
        <div><span>Venda</span><b>{money.format(revenue)}</b></div>
        <div><span>Custo real</span><b>{money.format(cost)}</b></div>
        <div><span>Lucro estimado</span><strong className={revenue-cost>=0?'positive':'negative'}>{money.format(revenue-cost)}</strong></div>
        {paymentMode==='receivable'&&<div className="cp-receivable-preview"><span>Vai para</span><strong>A receber · {Math.max(1,Number(installments)||1)}x</strong></div>}
      </div>
    </div>:<Empty icon={<Package/>} title="Sem produto disponível" text="Cadastre uma compra antes de registrar uma venda."/>}
    {error&&<div className="cp-form-error">{error}</div>}
    <div className="cp-modal-actions"><button className="cp-secondary" onClick={onClose}>Cancelar</button>{available.length>0&&<button className="cp-primary" disabled={data.busy} onClick={()=>void save()}>{data.busy?'Registrando...':'Confirmar venda'}</button>}</div>
  </ModalShell>
}


function TradeModal({data,initialProduct,onClose,onBack,onDone}:{data:Data;initialProduct:Product;onClose:()=>void;onBack:()=>void;onDone:()=>void}){
  const eligible=data.products.filter(p=>p.inventory_mode==='single'&&p.quantity_available===1)
  const [outgoingId,setOutgoingId]=useState(initialProduct.id)
  const outgoing=eligible.find(p=>p.id===outgoingId)
  const [receivedName,setReceivedName]=useState('')
  const [receivedCategory,setReceivedCategory]=useState('')
  const [receivedValue,setReceivedValue]=useState('')
  const [resalePrice,setResalePrice]=useState('')
  const [cashDirection,setCashDirection]=useState<'none'|'received'|'paid'>('none')
  const [cashAmount,setCashAmount]=useState('')
  const [paymentMethod,setPaymentMethod]=useState('pix')
  const [date,setDate]=useState(localDate())
  const [customerId,setCustomerId]=useState('')
  const [counterparty,setCounterparty]=useState('')
  const [notes,setNotes]=useState('')
  const [files,setFiles]=useState<File[]>([])
  const [error,setError]=useState<string|null>(null)
  const [operationId]=useState(()=>crypto.randomUUID())
  const [incomingProductId]=useState(()=>crypto.randomUUID())
  const previewUrls=useMemo(()=>files.map(f=>URL.createObjectURL(f)),[files])
  useEffect(()=>()=>{previewUrls.forEach(url=>URL.revokeObjectURL(url))},[previewUrls])
  const readAmount=(v:string)=>{const value=v.trim().replace(/\s/g,'');return Number(value.includes(',')?value.replace(/\./g,'').replace(',','.'):value)}
  const agreed=receivedValue.trim()?readAmount(receivedValue):0
  const cashback=cashDirection==='none'?0:(cashAmount.trim()?readAmount(cashAmount):0)
  const net=agreed+(cashDirection==='received'?cashback:cashDirection==='paid'?-cashback:0)
  const itemCost=outgoing?buildMetrics(data).unitCost(outgoing):0
  const projectedProfit=net-itemCost
  async function saveTrade(){
    setError(null)
    try{
      if(!outgoing)throw new Error('Escolha um item disponível para entregar.')
      if(!receivedName.trim())throw new Error('Informe o nome do produto recebido.')
      if(!Number.isFinite(agreed)||agreed<=0)throw new Error('Informe o valor combinado do produto recebido.')
      if(cashDirection!=='none'&&(!Number.isFinite(cashback)||cashback<=0))throw new Error('Informe o valor da volta em dinheiro.')
      if(net<0)throw new Error('A volta que você pagou supera o valor avaliado do item recebido.')
      const desired=resalePrice.trim()?readAmount(resalePrice):null
      if(desired!==null&&(!Number.isFinite(desired)||desired<0))throw new Error('Preço de revenda inválido.')
      
      if(!files.length)throw new Error('Adicione pelo menos uma foto do produto recebido.')
      if(date>localDate())throw new Error('A data da troca não pode ser futura.')
      const extra=[counterparty.trim()?'Outra pessoa: '+counterparty.trim():'',notes.trim()].filter(Boolean).join(' · ')
      await data.registerTrade({
        requestId:operationId,outgoingProductId:outgoing.id,incomingProductId,
        incomingName:receivedName.trim(),incomingCategory:receivedCategory.trim(),
        incomingValue:agreed,cashDirection,cashAmount:cashDirection==='none'?0:cashback,
        tradeDate:date,paymentMethod,incomingListedPrice:desired,
        customerId:customerId||null,notes:extra
      },files)
      onDone()
    }catch(err:any){setError(err?.message||'Não foi possível registrar a troca.')}
  }
  return <ModalShell onClose={onClose}>
    <ModalHeader eyebrow="TROCA DE ITEM ÚNICO" title="O que entrou no lugar?" text="Dê baixa no item entregue e receba o novo produto no Estoque, com foto e histórico ligados."/>
    <div className="cp-trade-flow"><span><RefreshCw size={19}/> Item entregue</span><span>Troca registrada com histórico</span><span><Package size={19}/> Item recebido</span></div>
    <div className="cp-form-grid cp-trade-form">
      <div className="cp-field cp-field--full"><span>Tipo de operação</span><div className="cp-trade-type-switch"><button type="button" onClick={onBack}><Banknote size={19}/><b>Venda</b></button><button type="button" className="active" aria-pressed="true"><RefreshCw size={19}/><b>Troca</b></button></div></div>
      <Field label="Qual item você vai entregar?" full><select value={outgoingId} onChange={e=>setOutgoingId(e.target.value)}>{eligible.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <div className="cp-trade-section-label"><Package size={19}/><div><b>Produto que você vai receber</b><small>Ele será cadastrado automaticamente como Item único</small></div></div>
      <Field label="Nome do produto recebido" full><input value={receivedName} onChange={e=>setReceivedName(e.target.value)} placeholder="Ex.: iPhone 11 128 GB"/></Field>
      <Field label="Categoria"><input value={receivedCategory} onChange={e=>setReceivedCategory(e.target.value)} placeholder="Celular, bicicleta..."/></Field>
      <Field label="Valor acordado do item recebido"><input inputMode="decimal" value={receivedValue} onChange={e=>setReceivedValue(e.target.value)} placeholder="Ex.: 800,00"/></Field>
      <Field label="Preço que pretende vender (opcional)" full><input inputMode="decimal" value={resalePrice} onChange={e=>setResalePrice(e.target.value)} placeholder="Ex.: 1.000,00"/></Field>
      <div className="cp-trade-photos cp-field cp-field--full"><span>Fotos do item recebido <b>· obrigatório</b></span><label className="cp-trade-photo-picker"><ImagePlus size={24}/><div><b>{files.length?files.length+' foto(s) selecionada(s)':'Adicionar fotos do item'}</b><small>Da câmera ou galeria · de 1 a 5 imagens</small></div><input type="file" accept="image/*" multiple onChange={e=>{
        const selected=Array.from(e.target.files||[]).slice(0,5)
        setFiles(selected);e.currentTarget.value=''
      }}/></label>
      {previewUrls.length>0&&<div className="cp-trade-photo-previews">{previewUrls.map((url,i)=><div key={url}><img src={url} alt={'Foto recebida '+(i+1)}/><button type="button" aria-label={'Remover foto '+(i+1)} onClick={()=>setFiles(list=>list.filter((_,index)=>index!==i))}><X size={16}/></button></div>)}</div>}</div>
      <div className="cp-trade-section-label"><WalletCards size={19}/><div><b>Teve volta em dinheiro?</b><small>Informe quem pagou a diferença na troca</small></div></div>
      <div className="cp-field cp-field--full"><span>Volta em dinheiro</span><div className="cp-trade-cash-options">
        <button type="button" className={cashDirection==='none'?'active':''} onClick={()=>setCashDirection('none')}>Sem volta</button>
        <button type="button" className={cashDirection==='received'?'active':''} onClick={()=>setCashDirection('received')}><ArrowDownRight size={16}/> Recebi</button>
        <button type="button" className={cashDirection==='paid'?'active':''} onClick={()=>setCashDirection('paid')}><ArrowUpRight size={16}/> Paguei</button>
      </div></div>
      {cashDirection!=='none'&&<><Field label="Valor da volta"><input inputMode="decimal" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} placeholder="Ex.: 100,00"/></Field><Field label="Forma da volta"><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="transfer">Transferência</option><option value="card">Cartão</option><option value="other">Outro</option></select></Field></>}
      <Field label="Data da troca"><input type="date" max={localDate()} value={date} onChange={e=>setDate(e.target.value)}/></Field>
      <Field label="Cliente cadastrado (opcional)"><select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Não vincular</option>{data.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Nome de quem trocou (opcional)" full><input value={counterparty} onChange={e=>setCounterparty(e.target.value)} placeholder="Ex.: João, do Marketplace"/></Field>
      <Field label="Observações (opcional)" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Estado do aparelho, bateria, acessórios, defeitos..."/></Field>
      <div className="cp-trade-summary">
        <div className="cp-trade-summary-heading"><RefreshCw size={18}/><strong>Resumo da troca</strong></div>
        <div><span>Você entrega</span><b>{outgoing?.name||'Selecione o item'}</b></div>
        <div><span>Você recebe</span><b>{receivedName||'Novo item'} {agreed>0?'· '+money.format(agreed):''}</b></div>
        <div><span>Movimento no caixa</span><b className={cashDirection==='paid'?'negative':cashDirection==='received'?'positive':''}>{cashDirection==='received'?'+ ':cashDirection==='paid'?'- ':''}{money.format(cashDirection==='none'?0:cashback)}</b></div>
        <div><span>Valor negociado</span><b>{money.format(Number.isFinite(net)?net:0)}</b></div>
        {outgoing?.cost_basis_known?<div><span>Resultado estimado*</span><b className={projectedProfit>=0?'positive':'negative'}>{money.format(Number.isFinite(projectedProfit)?projectedProfit:0)}</b></div>:<div><span>Resultado estimado*</span><b>Sem custo informado</b></div>}
        <small>*A avaliação do item recebido não é dinheiro no caixa. Apenas a volta movimenta o saldo. O resultado depende do valor atribuído ao item recebido.</small>
      </div>
    </div>
    {error&&<div className="cp-form-error">{error}</div>}
    <div className="cp-modal-actions"><button type="button" className="cp-secondary" onClick={onBack}>Voltar à venda</button><button type="button" className="cp-primary" disabled={data.busy||!outgoing} onClick={()=>void saveTrade()}>{data.busy?'Registrando troca...':'Confirmar troca e colocar no estoque'}</button></div>
  </ModalShell>
}

function ExpenseModal({data,initialProduct,onClose,onDone}:{data:Data;initialProduct:Product|null;onClose:()=>void;onDone:()=>void}){
  const available=data.products.filter(p=>p.quantity_available>0||p.status==='reserved')
  const [productId,setProductId]=useState(initialProduct?.id||available[0]?.id||''),[type,setType]=useState('repair'),[amount,setAmount]=useState(''),[description,setDescription]=useState(''),[date,setDate]=useState(localDate()),[error,setError]=useState<string|null>(null)
  async function save(){setError(null);try{const value=Number(amount.replace(',','.'));if(!productId)throw new Error('Escolha um produto.');if(!Number.isFinite(value)||value<=0)throw new Error('Informe o valor do gasto.');await data.addExpense({productId,amount:value,expenseType:type,description,occurredAt:date});onDone()}catch(err:any){setError(err?.message||'Não foi possível registrar o gasto.')}}
  return <ModalShell onClose={onClose}><ModalHeader eyebrow="GASTO DO PRODUTO" title="Some tudo que esse produto custou." text="Reparo, limpeza e transporte entram no custo real e deixam o lucro correto."/>
    {available.length?<div className="cp-form-grid"><Field label="Produto" full><select value={productId} onChange={e=>setProductId(e.target.value)}>{available.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></Field><Field label="Tipo"><select value={type} onChange={e=>setType(e.target.value)}><option value="repair">Reparo</option><option value="transport">Transporte</option><option value="cleaning">Limpeza</option><option value="fee">Taxa</option><option value="accessory">Acessório/peça</option><option value="other">Outro</option></select></Field><Field label="Valor"><MoneyInput value={amount} setValue={setAmount} placeholder="0,00"/></Field><Field label="Data"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Descrição" full><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex.: troca de bateria"/></Field><Tip text="Esse valor entra no custo real do produto e também sai do caixa."/></div>:<Empty icon={<Package/>} title="Sem produto para receber gasto" text="Primeiro registre a compra do produto."/>}
    {error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions"><button className="cp-secondary" onClick={onClose}>Cancelar</button>{available.length>0&&<button className="cp-primary" disabled={data.busy} onClick={()=>void save()}>{data.busy?'Salvando...':'Salvar gasto'}</button>}</div>
  </ModalShell>
}

function CashModal({data,onClose,onDone}:{data:Data;onClose:()=>void;onDone:()=>void}){
  const [kind,setKind]=useState<'income'|'expense'>('expense'),[amount,setAmount]=useState(''),[description,setDescription]=useState(''),[date,setDate]=useState(localDate()),[error,setError]=useState<string|null>(null)
  async function save(){setError(null);try{const value=Number(amount.replace(',','.'));if(!description.trim())throw new Error('Descreva o que aconteceu.');if(!Number.isFinite(value)||value<=0)throw new Error('Informe o valor.');await data.addCashEntry({kind,category:'manual',description:description.trim(),amount:value,occurredAt:date});onDone()}catch(err:any){setError(err?.message||'Não foi possível adicionar ao caixa.')}}
  return <ModalShell onClose={onClose}><ModalHeader eyebrow="MOVIMENTO DE CAIXA" title="Registre o dinheiro que entrou ou saiu." text="Use para movimentos que não são compra, venda ou gasto de produto."/><div className="cp-kind-toggle"><button className={kind==='income'?'active positive':''} onClick={()=>setKind('income')}><ArrowUpRight/> Entrada</button><button className={kind==='expense'?'active negative':''} onClick={()=>setKind('expense')}><ArrowDownRight/> Saída</button></div><div className="cp-form-grid"><Field label="Valor"><MoneyInput value={amount} setValue={setAmount} placeholder="0,00"/></Field><Field label="Data"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Descrição" full><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex.: retirada pessoal, aporte, frete geral..."/></Field></div>{error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions"><button className="cp-secondary" onClick={onClose}>Cancelar</button><button className="cp-primary" disabled={data.busy} onClick={()=>void save()}>{data.busy?'Salvando...':'Adicionar ao caixa'}</button></div></ModalShell>
}

function SettingsModal({data,email,access,billingBusy,onSubscribe,onCancel,readOnly,onClose,onDone}:{data:Data;email?:string;access:NonNullable<ReturnType<typeof useControlAccess>['access']>;billingBusy:boolean;onSubscribe:()=>void;onCancel:()=>void;readOnly:boolean;onClose:()=>void;onDone:(t:string)=>void}){
  const [business,setBusiness]=useState(data.settings?.business_name||'Meu negócio'),[cash,setCash]=useState(String(data.settings?.initial_cash||0)),[days,setDays]=useState(String(data.settings?.stock_alert_days||21)),[error,setError]=useState<string|null>(null)
  async function save(){setError(null);try{await data.updateSettings({business_name:business.trim()||'Meu negócio',initial_cash:Math.max(0,Number(cash.replace(',','.'))||0),stock_alert_days:Math.max(1,Number(days)||21),onboarding_completed:true});onDone('Configurações salvas.');onClose()}catch(err:any){setError(err?.message||'Não foi possível salvar.')}}
  return <ModalShell onClose={onClose}>
    <section className="cp-settings-hero">
      <span className="cp-settings-hero-icon"><Settings2/></span>
      <div><span>CONFIGURAÇÕES DO NEGÓCIO</span><h2>Seu CONTROLE+, do seu jeito.</h2><p>Ajuste apenas o que muda seu caixa, seus alertas e a identificação do negócio.</p></div>
    </section>
    <div className="cp-account-line"><span>{(email?.[0]||'C').toUpperCase()}</span><div><b>{email||'Sua conta'}</b><small>Conta protegida e dados separados por usuário</small></div></div>
    <ActivePlanCard access={access} busy={billingBusy} onCancel={onCancel}/>
    {readOnly&&<button className="cp-settings-subscribe" disabled={billingBusy} onClick={onSubscribe}>Continuar por {money.format(access.monthly_price)}/mês</button>}
    <div className="cp-settings-sections">
      <div className="cp-settings-section"><span>01</span><div><b>Identificação</b><small>Como seu negócio aparece dentro do app.</small></div></div>
      <div className="cp-form-grid"><Field label="Nome do negócio" full><input disabled={readOnly} value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Ex.: Brique do Luan"/></Field></div>
      <div className="cp-settings-section"><span>02</span><div><b>Dinheiro de partida</b><small>Use o saldo que você tinha quando começou a controlar aqui.</small></div></div>
      <div className="cp-form-grid"><Field label="Saldo inicial"><MoneyInput value={cash} setValue={setCash} placeholder="0,00" disabled={readOnly}/></Field></div>
      <div className="cp-settings-section"><span>03</span><div><b>Alerta de estoque parado</b><small>Depois desse período, o app chama sua atenção.</small></div></div>
      <div className="cp-form-grid"><Field label="Alertar estoque após"><div className="cp-input-suffix"><input disabled={readOnly} type="number" min="1" value={days} onChange={e=>setDays(e.target.value)}/><span>dias</span></div></Field></div>
    </div>
    <div className="cp-settings-note"><b>Importante sobre o saldo inicial</b><p>Ele é o ponto de partida do caixa. Depois que você já começou a registrar compras e vendas, mudar esse valor altera o saldo disponível mostrado no app.</p></div>
    {error&&<div className="cp-form-error">{error}</div>}
    <div className="cp-modal-actions"><button className="cp-danger-link" onClick={()=>void supabase.auth.signOut()}><LogOut size={17}/> Sair</button>{!readOnly&&<button className="cp-primary" disabled={data.busy} onClick={()=>void save()}>Salvar configurações</button>}</div>
  </ModalShell>
}

function ListingCheckinModal({product,data,onClose,onSold,onDone}:{product:Product;data:Data;onClose:()=>void;onSold:()=>void;onDone:(text:string)=>void}){
  const [stage,setStage]=useState<'ask'|'slow'|'price'>('ask')
  const suggested=product.listed_price?Math.max(1,Math.round(product.listed_price*.95)):''
  const [newPrice,setNewPrice]=useState(String(suggested))
  const [error,setError]=useState<string|null>(null)
  const photo=(data.grouped.photosByProduct.get(product.id)||[])[0]?.signed_url
  const listedDays=daysSince(product.listing_started_at||product.purchase_date)
  const channels=product.listing_channels.length?product.listing_channels.join(' · '):'Plataforma não informada'
  const price=product.listed_price||0

  const suggestion=listedDays>=15
    ?'Esse anúncio já está há bastante tempo no ar. Vale renovar as fotos e o título e considerar uma redução de 8% a 12% para destravar a venda.'
    :listedDays>=10
      ?'Com mais de 10 dias, vale refazer o anúncio e testar uma redução leve de 5% a 8% se as mensagens estiverem fracas.'
      :'Antes de cortar muito o preço, teste uma foto principal melhor, um título mais direto e renove o anúncio. Se quase ninguém chamar, uma redução pequena pode ajudar.'

  async function record(result:'good'|'keep'|'refreshed'|'price_lowered',nextPrice?:number){
    setError(null)
    try{
      await data.recordListingCheckin({productId:product.id,result,newPrice:nextPrice})
      onDone(result==='refreshed'?'Anúncio renovado. Vou perguntar de novo em 5 dias.':result==='price_lowered'?'Preço atualizado. Nova revisão em 5 dias.':'Certo. Próxima revisão em 5 dias.')
    }catch(err:any){setError(err?.message||'Não foi possível atualizar o acompanhamento.')}
  }

  async function lowerPrice(){
    const value=Number(newPrice.replace(',','.'))
    if(!Number.isFinite(value)||value<=0){setError('Informe um preço válido.');return}
    await record('price_lowered',value)
  }

  return <ModalShell onClose={onClose}>
    <div className="cp-checkin-product">{photo?<img src={photo} alt=""/>:<span><Megaphone/></span>}<div><span>REVISÃO DO ANÚNCIO</span><h2>{product.name}</h2><p>{channels} · {listedDays} dia(s) anunciado</p></div></div>
    {stage==='ask'&&<div className="cp-checkin-body"><h3>Como está esse anúncio?</h3><p>Já passaram {listedDays} dias. Isso ajuda o CONTROLE+ a não deixar uma mercadoria esquecida.</p><div className="cp-checkin-options"><button onClick={onSold}><span className="is-success"><Banknote/></span><div><b>Vendeu</b><small>Registrar a venda agora</small></div><ChevronRight/></button><button disabled={data.busy} onClick={()=>void record('good')}><span><Check/></span><div><b>Está indo bem</b><small>Tem procura ou negociação acontecendo</small></div><ChevronRight/></button><button onClick={()=>setStage('slow')}><span className="is-warn"><TrendingDown/></span><div><b>Está fraco</b><small>Poucas mensagens ou nenhuma proposta</small></div><ChevronRight/></button></div></div>}
    {stage==='slow'&&<div className="cp-checkin-body"><span className="cp-eyebrow">ANÚNCIO FRACO</span><h3>Não deixa o produto morrer no estoque.</h3><div className="cp-listing-advice"><RefreshCw/><p>{suggestion}</p></div>{price>0&&<div className="cp-price-suggestion"><span>Preço atual</span><b>{money.format(price)}</b><small>Teste inicial sugerido: perto de {money.format(Number(suggested)||price)}</small></div>}<div className="cp-checkin-actions"><button className="cp-primary" disabled={data.busy} onClick={()=>void record('refreshed')}><RefreshCw/> Refiz o anúncio</button><button className="cp-secondary" onClick={()=>setStage('price')}><TrendingDown/> Baixar o preço</button><button className="cp-text-button" disabled={data.busy} onClick={()=>void record('keep')}>Manter como está por mais 5 dias</button></div></div>}
    {stage==='price'&&<div className="cp-checkin-body"><span className="cp-eyebrow">AJUSTAR PREÇO</span><h3>Quanto vai pedir agora?</h3><p>Faça uma mudança pequena primeiro. Você ainda pode revisar novamente daqui a 5 dias.</p><Field label="Novo preço anunciado" full><MoneyInput value={newPrice} setValue={setNewPrice} placeholder="0,00"/></Field>{price>0&&Number(newPrice.replace(',','.'))>0&&<div className="cp-discount-preview"><span>Diferença</span><b>{money.format(Number(newPrice.replace(',','.'))-price)}</b><small>{(((Number(newPrice.replace(',','.'))-price)/price)*100).toFixed(1)}%</small></div>}<div className="cp-modal-actions"><button className="cp-secondary" onClick={()=>setStage('slow')}>Voltar</button><button className="cp-primary" disabled={data.busy} onClick={()=>void lowerPrice()}>{data.busy?'Salvando...':'Atualizar preço'}</button></div></div>}
    {error&&<div className="cp-form-error">{error}</div>}
  </ModalShell>
}

function ProductDetail({product,data,calc,readOnly,onClose,onSale,onExpense,onSaved,onDeleted,onBlocked}:{product:Product;data:Data;calc:Metrics;readOnly:boolean;onClose:()=>void;onSale:()=>void;onExpense:()=>void;onSaved:()=>void;onDeleted:()=>void;onBlocked:()=>void}){
  const photos=data.grouped.photosByProduct.get(product.id)||[]
  const expenses=data.grouped.expensesByProduct.get(product.id)||[]
  const cost=calc.unitCost(product)
  const [listed,setListed]=useState(product.listed_price===null?'':String(product.listed_price))
  const [minimum,setMinimum]=useState(product.minimum_price===null?'':String(product.minimum_price))
  const [editing,setEditing]=useState(false)
  const [editingInfo,setEditingInfo]=useState(false)
  const [name,setName]=useState(product.name)
  const [category,setCategory]=useState(product.category||'')
  const [categoryGroup,setCategoryGroup]=useState(product.category_group||'Outros')
  const [itemType,setItemType]=useState<'main'|'accessory'|'part'>(product.item_type||'main')
  const [classificationTouched,setClassificationTouched]=useState(false)
  const [inventoryMode,setInventoryMode]=useState<'single'|'stock'>(product.inventory_mode)
  const [notes,setNotes]=useState(product.notes||'')
  const [listingEditing,setListingEditing]=useState(false)
  const [isListed,setIsListed]=useState(product.listing_status==='listed')
  const [channels,setChannels]=useState<string[]>(product.listing_channels||[])
  const [listingDate,setListingDate]=useState(product.listing_started_at||localDate())
  const [confirmDelete,setConfirmDelete]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [downloadingPhotoId,setDownloadingPhotoId]=useState<string|null>(null)
  const potential=product.listed_price!==null?(product.listed_price-cost)*product.quantity_available:null
  const listingDays=product.listing_status==='listed'?daysSince(product.listing_started_at||product.purchase_date):0
  const listingDue=product.listing_status==='listed'&&!!product.listing_next_checkin_at&&product.listing_next_checkin_at<=localDate()
  const checkins=data.grouped.listingCheckinsByProduct.get(product.id)||[]
  const hasSaleHistory=data.saleItems.some(item=>item.product_id===product.id)
  const tradeOut=data.grouped.tradeByOutgoingProduct.get(product.id)
  const tradeIn=data.grouped.tradeByIncomingProduct.get(product.id)
  const relatedTrade=tradeOut||tradeIn
  const relatedProduct=relatedTrade?data.products.find(p=>p.id===(tradeOut?tradeOut.incoming_product_id:tradeIn!.outgoing_product_id)):null
  const productSales=data.saleItems.filter(item=>item.product_id===product.id).map(item=>({item,sale:data.grouped.saleById.get(item.sale_id)})).filter(entry=>entry.sale?.status==='completed')

  async function saveInfo(){
    setError(null)
    try{
      if(!name.trim())throw new Error('Informe o nome do produto.')
      if(inventoryMode==='single'&&product.quantity_initial!==1)throw new Error('Este produto já teve várias unidades. Para torná-lo item único, cadastre a peça separadamente.')
      const patch:Partial<Product>={name:name.trim(),category:category.trim()||null,notes:notes.trim()||null,inventory_mode:inventoryMode}
      if(classificationTouched){
        patch.category_group=categoryGroup.trim()||'Outros'
        patch.item_type=itemType
        patch.category_source='manual'
      }
      await data.updateProduct(product.id,patch)
      setClassificationTouched(false)
      setEditingInfo(false);onSaved()
    }catch(err:any){setError(err?.message||'Não foi possível editar o produto.')}
  }
  async function addPhotos(files:File[]){
    setError(null)
    try{
      if(!files.length)return
      const count=await data.addProductPhotos(product.id,files)
      if(count>0)onSaved()
    }catch(err:any){setError(err?.message||'Não foi possível adicionar as fotos.')}
  }
  async function downloadPhoto(photo:ProductPhoto,index:number){
    setError(null)
    setDownloadingPhotoId(photo.id)
    try{
      const blob=await data.downloadProductPhoto(photo.id)
      const extension=photo.storage_path.split('.').pop()?.toLowerCase()||'jpg'
      const safeExtension=['jpg','jpeg','png','webp','heic','heif'].includes(extension)?extension:'jpg'
      const safeName=product.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'produto'
      const url=URL.createObjectURL(blob)
      const link=document.createElement('a')
      link.href=url
      link.download=`${safeName}-foto-${index+1}.${safeExtension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(()=>URL.revokeObjectURL(url),60000)
    }catch(err:any){setError(err?.message||'Não foi possível baixar a foto.')}
    finally{setDownloadingPhotoId(null)}
  }
  async function removePhoto(photoId:string){
    setError(null)
    try{
      await data.deleteProductPhoto(photoId)
      onSaved()
    }catch(err:any){setError(err?.message||'Não foi possível remover a foto.')}
  }
  async function removeProduct(){
    setError(null)
    try{
      await data.deleteProduct(product.id)
      onDeleted()
    }catch(err:any){setError(err?.message||'Não foi possível excluir o produto.')}
  }
  async function savePrices(){
    setError(null)
    try{
      await data.updateProduct(product.id,{listed_price:listed?Number(listed.replace(',','.')):null,minimum_price:minimum?Number(minimum.replace(',','.')):null})
      setEditing(false);onSaved()
    }catch(err:any){setError(err?.message||'Não foi possível salvar os preços.')}
  }
  async function saveListing(){
    setError(null)
    try{
      const price=listed?Number(listed.replace(',','.')):null
      if(isListed&&(!price||price<=0))throw new Error('Informe o preço do anúncio.')
      if(isListed&&channels.length===0)throw new Error('Selecione onde está anunciado.')
      await data.updateProduct(product.id,{
        listed_price:price,
        listing_status:isListed?'listed':'paused',
        listing_channels:isListed?channels:[],
        listing_started_at:isListed?listingDate:null,
        listing_next_checkin_at:isListed?addDays(listingDate,5):null
      })
      setListingEditing(false);onSaved()
    }catch(err:any){setError(err?.message||'Não foi possível atualizar o anúncio.')}
  }

  return <ModalShell onClose={onClose}>
    <div className="cp-detail-hero"><div className="cp-detail-photo">{photos[0]?.signed_url?<img src={photos[0].signed_url} alt=""/>:<Package/>}</div><div><span className="cp-eyebrow">{product.source?.startsWith('Troca por ')?'RECEBIDO EM TROCA':product.acquisition_type==='owned'?'PRODUTO PRÓPRIO':product.category||'PRODUTO'}</span><h2>{name}</h2><p>{tradeOut?'Item trocado · '+(relatedProduct?.name||'produto recebido'):product.quantity_available===0?'Produto vendido':tradeIn?'Recebido em troca · disponível':product.inventory_mode==='single'?'Item único · disponível':product.quantity_available+' de '+product.quantity_initial+' unidade(s) disponíveis'}</p></div></div>

    {(relatedTrade||productSales.length>0)&&<section className="cp-detail-section cp-item-history"><div className="cp-section-head"><div><span>HISTÓRICO</span><h2>Movimentações deste produto</h2></div></div>
      {relatedTrade&&<div className="cp-item-history-entry"><b>{tradeOut?'TROCADO POR':'RECEBIDO EM TROCA'}</b><strong>{relatedProduct?.name||'Produto vinculado'}</strong><span>Data: {new Date(relatedTrade.trade_date+'T12:00:00').toLocaleDateString('pt-BR')} · Avaliação: {money.format(relatedTrade.incoming_value)}</span><span>{relatedTrade.cash_direction==='none'?'Sem volta em dinheiro':relatedTrade.cash_direction==='paid'?'Volta paga: '+money.format(relatedTrade.cash_amount):'Volta recebida: '+money.format(relatedTrade.cash_amount)}</span>{relatedTrade.notes&&<small>{relatedTrade.notes}</small>}</div>}
      {productSales.filter(entry=>!data.grouped.tradeBySale.has(entry.sale!.id)).map(({item,sale})=><div key={item.id} className="cp-item-history-entry"><b>VENDA CONCLUÍDA</b><strong>{money.format(item.unit_price*item.quantity)}</strong><span>{new Date(sale!.sale_date+'T12:00:00').toLocaleDateString('pt-BR')} · {item.quantity} un. · {paymentLabel(sale!.payment_method)}</span><span>Canal: {saleChannelLabel(sale!.sale_channel,sale!.sale_channel_other)}</span>{sale!.notes&&<small>{sale!.notes}</small>}</div>)}
    </section>}

    <section className="cp-detail-section">
      <div className="cp-section-head"><div><span>FOTOS</span><h2>{photos.length?photos.length+' foto(s) do produto':'Adicione fotos desse produto'}</h2></div>{readOnly?<button className="cp-detail-add-photo" onClick={onBlocked}><ImagePlus size={16}/> Adicionar</button>:<label className="cp-detail-add-photo"><ImagePlus size={16}/> Adicionar<input type="file" accept="image/*" multiple onChange={e=>{const files=Array.from(e.target.files||[]);void addPhotos(files);e.currentTarget.value=''}}/></label>}</div>
      <div className="cp-photo-manager">
        {photos.map((photo,index)=><div key={photo.id}><img src={photo.signed_url||''} alt={`Foto ${index+1} de ${product.name}`}/><div className="cp-photo-actions"><button type="button" className="cp-photo-download" disabled={downloadingPhotoId!==null} onClick={()=>void downloadPhoto(photo,index)} title="Baixar foto" aria-label={`Baixar foto ${index+1}`}><Download/></button>{!readOnly&&<button type="button" className="cp-photo-delete" disabled={data.busy} onClick={()=>void removePhoto(photo.id)} title="Excluir foto" aria-label={`Excluir foto ${index+1}`}><Trash2/></button>}</div></div>)}
        {!readOnly&&photos.length<12&&<label className="cp-photo-add-tile"><ImagePlus/><b>Adicionar fotos</b><small>até {12-photos.length} nova(s)</small><input type="file" accept="image/*" multiple onChange={e=>{const files=Array.from(e.target.files||[]);void addPhotos(files);e.currentTarget.value=''}}/></label>}
      </div>
      <p className="cp-muted">{readOnly?'Modo leitura: suas fotos continuam disponíveis para download.':'Você pode manter até 12 fotos por produto, baixar ou remover cada imagem individualmente.'}</p>
    </section>

    <section className="cp-detail-section">
      <div className="cp-section-head"><div><span>DADOS DO PRODUTO</span><h2>Informações básicas</h2></div><button onClick={()=>readOnly?onBlocked():setEditingInfo(v=>!v)}><Pencil size={14}/>{editingInfo?'Cancelar':'Editar'}</button></div>
      {editingInfo?<div className="cp-inline-edit cp-product-edit-grid">
        <Field label="Nome" full><input value={name} onChange={e=>setName(e.target.value)}/></Field>
        <Field label="Categoria informada"><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Ex.: eletrônicos"/></Field>
         <InventoryModePicker mode={inventoryMode} onChange={setInventoryMode}/>
        <Field label="Tipo no ranking"><select value={itemType} onChange={e=>{setItemType(e.target.value as 'main'|'accessory'|'part');setClassificationTouched(true)}}><option value="main">Produto principal</option><option value="accessory">Acessório</option><option value="part">Peça</option></select></Field>
        <Field label="Categoria do ranking" full><input list="cp-ranking-categories" value={categoryGroup} onChange={e=>{setCategoryGroup(e.target.value);setClassificationTouched(true)}} placeholder="Ex.: Cabos e carregadores"/><datalist id="cp-ranking-categories"><option value="Cabos e carregadores"/><option value="Acessórios para celular"/><option value="iPhones"/><option value="Celulares"/><option value="PlayStation"/><option value="Xbox"/><option value="Controles e acessórios"/><option value="Áudio"/><option value="Televisões"/><option value="Ferramentas"/><option value="Eletrodomésticos"/><option value="Casa e cozinha"/><option value="Computadores"/><option value="Tablets"/><option value="Relógios e smartwatches"/><option value="Bicicletas"/><option value="Motos"/><option value="Carros"/></datalist></Field>
        <div className="cp-classification-tip"><Sparkles size={16}/><span>O CONTROLE+ classifica automaticamente. Altere apenas se quiser corrigir como este produto aparece no Ranking Pessoal.</span></div>
        <Field label="Observações" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Estado, acessórios, defeitos..."/></Field>
        <button className="cp-primary" disabled={data.busy} onClick={()=>void saveInfo()}>{data.busy?'Salvando...':'Salvar alterações'}</button>
      </div>:<div className="cp-product-info-read">
        <div><span>Categoria</span><b>{category||'Não informada'}</b></div>
        <div><span>Origem</span><b>{tradeIn?'Recebido em troca de '+(relatedProduct?.name||'outro produto'):product.acquisition_type==='owned'?'Produto próprio':product.source||'Compra'}</b></div>
         <div><span>Tipo de venda</span><b>{product.inventory_mode==='single'?'Item único':'Produto com estoque'}</b></div>
        <div className="cp-ranking-classification"><span>Ranking pessoal</span><b>{product.category_group||categoryGroup||'Outros'}</b><small>{product.item_type==='accessory'?'Acessório':product.item_type==='part'?'Peça':'Produto principal'} · {product.category_source==='manual'?'corrigido manualmente':'classificação automática'}</small></div>
        {notes&&<div className="cp-product-notes"><span>Observações</span><p>{notes}</p></div>}
      </div>}
    </section>

    <div className="cp-detail-numbers"><div><span>{product.inventory_mode==='single'?'Custo da peça':'Custo por un.'}</span><b>{product.cost_basis_known?money.format(product.purchase_unit_cost):'Não informado'}</b></div><div><span>Custo real</span><b>{product.cost_basis_known?money.format(cost):'Sem base'}</b></div><div><span>{product.inventory_mode==='single'?'Lucro da venda':'Lucro possível'}</span><b className={potential!==null&&potential>=0?'positive':''}>{potential===null?'—':money.format(potential)}</b></div><div><span>Tempo no estoque</span><b>{daysSince(product.purchase_date)} dias</b></div></div>
    <div className="cp-detail-actions">{product.quantity_available>0&&<button className="cp-primary" onClick={onSale}><Banknote/> Registrar venda</button>}<button className="cp-secondary" onClick={onExpense}><Plus/> Adicionar gasto</button></div>

    <section className="cp-detail-section">
      <div className="cp-section-head"><div><span>ANÚNCIO</span><h2>Acompanhar a venda</h2></div>{product.listing_status!=='sold'&&<button onClick={()=>readOnly?onBlocked():setListingEditing(v=>!v)}>{listingEditing?'Cancelar':'Editar'}</button>}</div>
      {listingEditing?<div className="cp-listing-editor"><ListingSetup isListed={isListed} setIsListed={setIsListed} channels={channels} setChannels={setChannels} listingDate={listingDate} setListingDate={setListingDate}/>{isListed&&<Field label="Preço anunciado" full><MoneyInput value={listed} setValue={setListed} placeholder="0,00"/></Field>}<button className="cp-primary" disabled={data.busy} onClick={()=>void saveListing()}>{data.busy?'Salvando...':'Salvar anúncio'}</button></div>:<div className={listingDue?'cp-listing-status-card is-due':'cp-listing-status-card'}>
        <span className="cp-listing-status-icon"><Megaphone/></span>
        <div><span>{tradeOut?'TROCADO':product.listing_status==='listed'?'ANUNCIADO':product.listing_status==='sold'?'VENDIDO':'NÃO ANUNCIADO'}</span><b>{tradeOut?'Entregue em troca de '+(relatedProduct?.name||'outro item'):product.listing_status==='listed'?(product.listing_channels.join(' · ')||'Plataforma não informada'):product.listing_status==='sold'?'Venda concluída':'Esse produto ainda não está sendo acompanhado'}</b>{product.listing_status==='listed'&&<small>{listingDays} dia(s) no ar · {listingDue?'revisão pendente':'próxima revisão '+new Date((product.listing_next_checkin_at||localDate())+'T12:00:00').toLocaleDateString('pt-BR')}</small>}</div>
        {product.listing_status==='listed'&&<strong>{product.listed_price===null?'—':money.format(product.listed_price)}</strong>}
      </div>}
      {checkins.length>0&&<div className="cp-checkin-history"><span>Últimas revisões</span>{checkins.slice(0,3).map(item=><div key={item.id}><b>{item.result==='refreshed'?'Anúncio renovado':item.result==='price_lowered'?'Preço reduzido':item.result==='good'?'Anúncio indo bem':'Mantido por mais 5 dias'}</b><small>{new Date(item.checkin_date+'T12:00:00').toLocaleDateString('pt-BR')}{item.new_price?' · '+money.format(item.new_price):''}</small></div>)}</div>}
    </section>

    <section className="cp-detail-section"><div className="cp-section-head"><div><span>PREÇO DE VENDA</span><h2>Quanto você quer fazer voltar</h2></div><button onClick={()=>readOnly?onBlocked():setEditing(v=>!v)}>{editing?'Cancelar':'Editar'}</button></div>{editing?<div className="cp-inline-edit"><Field label="Preço anunciado"><MoneyInput value={listed} setValue={setListed} placeholder="0,00"/></Field><Field label="Preço mínimo"><MoneyInput value={minimum} setValue={setMinimum} placeholder="0,00"/></Field><button className="cp-primary" disabled={data.busy} onClick={()=>void savePrices()}>Salvar preços</button></div>:<div className="cp-price-line"><div><span>Anunciado</span><b>{product.listed_price===null?'Não informado':money.format(product.listed_price)}</b></div><div><span>Mínimo</span><b>{product.minimum_price===null?'Não informado':money.format(product.minimum_price)}</b></div></div>}</section>
    <section className="cp-detail-section"><div className="cp-section-head"><div><span>CUSTOS EXTRAS</span><h2>O que aumentou o custo real</h2></div></div>{expenses.length?<div className="cp-expense-list">{expenses.map(e=><div key={e.id}><span><Tag size={15}/>{expenseLabel(e.expense_type)+(e.description?' · '+e.description:'')}</span><b>{money.format(e.amount)}</b></div>)}</div>:<p className="cp-muted">Nenhum gasto extra registrado neste produto.</p>}</section>

    {readOnly&&<section className="cp-detail-danger"><div><Trash2/><div><b>Excluir produto</b><p>Seu plano precisa estar ativo para alterar o estoque.</p></div></div><button className="cp-danger-button" onClick={onBlocked}>Excluir produto</button></section>}
    {!readOnly&&<section className="cp-detail-danger">
      <div><Trash2/><div><b>Excluir produto do estoque</b><p>{hasSaleHistory||relatedTrade?'Este produto possui movimentação registrada e o histórico financeiro precisa ser preservado.':'Use apenas se o cadastro estiver errado ou se você realmente quiser remover o item e seus movimentos vinculados.'}</p></div></div>
      {!hasSaleHistory&&!relatedTrade&&!confirmDelete&&<button className="cp-danger-button" onClick={()=>setConfirmDelete(true)}>Excluir produto</button>}
      {!hasSaleHistory&&!relatedTrade&&confirmDelete&&<div className="cp-delete-confirm"><span>Excluir definitivamente este produto?</span><button className="cp-secondary" onClick={()=>setConfirmDelete(false)}>Cancelar</button><button className="cp-danger-button" disabled={data.busy} onClick={()=>void removeProduct()}>{data.busy?'Excluindo...':'Sim, excluir'}</button></div>}
    </section>}

    {error&&<div className="cp-form-error">{error}</div>}
  </ModalShell>
}

function ModalShell({children,onClose,compact=false}:{children:React.ReactNode;onClose:()=>void;compact?:boolean}){return <div className="cp-modal-layer" role="dialog" aria-modal="true"><button className="cp-modal-backdrop" onClick={onClose} aria-label="Fechar"/><section className={compact?'cp-modal cp-modal--compact':'cp-modal'}><button className="cp-modal-x" onClick={onClose}><X/></button><div className="cp-modal-scroll">{children}</div></section></div>}
function ModalHeader({eyebrow,title,text}:{eyebrow:string;title:string;text:string}){return <div className="cp-modal-head"><span className="cp-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>}
function Stepper({step}:{step:number}){return <div className="cp-stepper">{[1,2,3].map(i=><div key={i} className={i<=step?'active':''}><span>{i<step?<Check/>:i}</span><small>{i===1?'Produto':i===2?'Valores':'Fotos'}</small></div>)}</div>}
function Field({label,children,full=false}:{label:string;children:React.ReactNode;full?:boolean}){return <label className={full?'cp-field cp-field--full':'cp-field'}><span>{label}</span>{children}</label>}
function MoneyInput({value,setValue,placeholder,disabled=false}:{value:string;setValue:(v:string)=>void;placeholder:string;disabled?:boolean}){return <div className="cp-money-input"><span>R$</span><input disabled={disabled} inputMode="decimal" value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9,.]/g,''))} placeholder={placeholder}/></div>}
function Tip({text}:{text:string}){return <div className="cp-form-tip"><span>+</span><p>{text}</p></div>}
function LoadingScreen(){return <div className="cp-loading"><Brand/><div className="cp-loading-line"><span/></div><p>Organizando seu negócio...</p></div>}
function paymentLabel(v:string){return ({pix:'Pix',cash:'Dinheiro',card:'Cartão',transfer:'Transferência',receivable:'A prazo',other:'Outro'} as Record<string,string>)[v]||v}
function expenseLabel(v:string){return ({repair:'Reparo',transport:'Transporte',cleaning:'Limpeza',fee:'Taxa',accessory:'Acessório/peça',other:'Outro'} as Record<string,string>)[v]||v}
function cashCategory(v:string){return ({purchase:'Compra',sale:'Venda',trade:'Troca',product_expense:'Gasto de produto',manual:'Manual'} as Record<string,string>)[v]||v}
