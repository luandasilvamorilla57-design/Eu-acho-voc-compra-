import {useEffect,useMemo,useState} from 'react'
import {
  AlertTriangle,ArrowDownRight,ArrowUpRight,BadgeDollarSign,Banknote,BarChart3,Box,
  Check,ChevronRight,CircleDollarSign,Clock3,Home,ImagePlus,LogOut,Package,Plus,
  ReceiptText,Search,Settings2,ShoppingBag,Tag,WalletCards,X,Moon,Sun,Megaphone,RefreshCw,TrendingDown
} from 'lucide-react'
import {supabase} from '../lib/supabase'
import {useControlData} from './useControlData'
import {BackupPage,ClosuresPage,GoalsPage,ManagePage,PeoplePage,ReceivablesPage,ReportsPage} from './BusinessCenter'
import type {CashEntry,ControlView,Product,Sale} from './types'

type Data=ReturnType<typeof useControlData>
type Metrics=ReturnType<typeof buildMetrics>
type Modal='actions'|'purchase'|'inventory'|'sale'|'expense'|'cash'|'settings'|'listingCheckin'|null

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

export function ControlApp({userId,email}:{userId:string;email?:string}){
  const data=useControlData(userId)
  const [view,setView]=useState<ControlView>('home')
  const [modal,setModal]=useState<Modal>(null)
  const [selected,setSelected]=useState<Product|null>(null)
  const [toast,setToast]=useState<string|null>(null)
  const [theme,setTheme]=useState<'dark'|'light'>(()=>{
    const saved=window.localStorage.getItem('controle-plus-theme')
    if(saved==='light'||saved==='dark')return saved
    return window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark'
  })
  useEffect(()=>{
    window.localStorage.setItem('controle-plus-theme',theme)
    document.documentElement.dataset.theme=theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#f3f7fc':'#07111f')
  },[theme])
  const calc=useMemo(()=>buildMetrics(data),[data.settings,data.products,data.expenses,data.sales,data.saleItems,data.cashEntries])

  function notify(text:string){
    setToast(text)
    window.setTimeout(()=>setToast(null),2600)
  }
  function openListingCheckin(product:Product){
    setSelected(product)
    setModal('listingCheckin')
  }

  if(data.loading)return <LoadingScreen/>
  if(!data.settings)return <div className="cp-fatal"><strong>Não conseguimos abrir o CONTROLE+.</strong><button onClick={()=>void data.load()}>Tentar novamente</button></div>
  if(!data.settings.onboarding_completed)return <FirstRun data={data} email={email} theme={theme} onTheme={()=>setTheme(v=>v==='dark'?'light':'dark')}/>

  return <div className="cp-app" data-theme={theme}>
    <div className="cp-noise"/>
    <TopBar business={data.settings.business_name} email={email} theme={theme} onTheme={()=>setTheme(v=>v==='dark'?'light':'dark')} onSettings={()=>setModal('settings')} onManage={()=>setView('manage')}/>
    <main className="cp-main">
      {view==='home'&&<HomePage data={data} calc={calc} onOpenProduct={setSelected} onView={setView} onAction={setModal} onCheckListing={openListingCheckin}/>}
      {view==='stock'&&<StockPage data={data} calc={calc} onOpenProduct={setSelected} onAdd={()=>setModal('actions')}/>}
      {view==='sales'&&<SalesPage data={data} calc={calc} onSale={()=>setModal('sale')} onOpenProduct={setSelected}/>}
      {view==='cash'&&<CashPage data={data} calc={calc} onCash={()=>setModal('cash')} onSettings={()=>setModal('settings')}/>}
      {view==='manage'&&<ManagePage data={data} onView={setView} onBack={()=>setView('home')}/>}
      {view==='receivables'&&<ReceivablesPage data={data} onBack={()=>setView('manage')}/>}
      {view==='reports'&&<ReportsPage data={data} onBack={()=>setView('manage')}/>}
      {view==='people'&&<PeoplePage data={data} onBack={()=>setView('manage')}/>}
      {view==='goals'&&<GoalsPage data={data} onBack={()=>setView('manage')}/>}
      {view==='closures'&&<ClosuresPage data={data} onBack={()=>setView('manage')}/>}
      {view==='backup'&&<BackupPage data={data} onBack={()=>setView('manage')}/>}
    </main>
    <BottomNav view={view} onView={setView} onAdd={()=>setModal('actions')}/>

    {modal==='actions'&&<ActionSheet onClose={()=>setModal(null)} onChoose={setModal}/>}
    {modal==='purchase'&&<PurchaseModal data={data} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Compra salva e adicionada ao estoque.')}}/>}
    {modal==='inventory'&&<InventoryModal data={data} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Produto adicionado ao estoque sem movimentar o caixa.')}}/>}
    {modal==='sale'&&<SaleModal data={data} initialProduct={selected} onClose={()=>setModal(null)} onDone={()=>{setModal(null);setSelected(null);notify('Venda registrada. Caixa e estoque atualizados.')}}/>}
    {modal==='expense'&&<ExpenseModal data={data} initialProduct={selected} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Gasto somado ao custo real do produto.')}}/>}
    {modal==='cash'&&<CashModal data={data} onClose={()=>setModal(null)} onDone={()=>{setModal(null);notify('Movimentação adicionada ao caixa.')}}/>}
    {modal==='settings'&&<SettingsModal data={data} email={email} onClose={()=>setModal(null)} onDone={notify}/>}\n    {selected&&modal==='listingCheckin'&&<ListingCheckinModal product={selected} data={data} onClose={()=>{setModal(null);setSelected(null)}} onSold={()=>setModal('sale')} onDone={(text)=>{setModal(null);setSelected(null);notify(text)}}/>}
    {selected&&modal===null&&<ProductDetail product={selected} data={data} calc={calc} onClose={()=>setSelected(null)} onSale={()=>setModal('sale')} onExpense={()=>setModal('expense')} onSaved={()=>notify('Produto atualizado.')}/>}
    {toast&&<div className="cp-toast"><Check size={18}/>{toast}</div>}
    {data.error&&<div className="cp-error-bar"><AlertTriangle size={17}/>{data.error}</div>}
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
        <span className="cp-eyebrow">BEM-VINDO AO CONTROLE+</span>
        <h1>Vamos colocar seu negócio em ordem.</h1>
        <p>Você registra o que comprou e vendeu. O app cuida do estoque, caixa e lucro para você.</p>
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
  const stockUnits=data.products.reduce((s,p)=>s+p.quantity_available,0)
  const alertDays=data.settings?.stock_alert_days||21
  const agedProducts=data.products.filter(p=>p.quantity_available>0&&daysSince(p.purchase_date)>=alertDays)
  const agedCapital=agedProducts.reduce((s,p)=>s+unitCost(p)*p.quantity_available,0)
  const potentialProfit=data.products.reduce((s,p)=>p.quantity_available>0&&p.listed_price!==null?s+(p.listed_price-unitCost(p))*p.quantity_available:s,0)
  return{unitCost,productMap,stockCapital,cash,monthSales,monthRevenue,monthProfit,stockUnits,alertDays,agedProducts,agedCapital,potentialProfit,saleStats}
}

function TopBar({business,email,theme,onTheme,onSettings,onManage}:{business:string;email?:string;theme:'dark'|'light';onTheme:()=>void;onSettings:()=>void;onManage:()=>void}){
  return <header className="cp-topbar"><div className="cp-top-inner">
    <Brand/>
    <div className="cp-top-business"><span>{business}</span><small>CONTROLE DO NEGÓCIO</small></div>
    <div className="cp-top-actions">
      <button className="cp-theme-toggle" onClick={onTheme} aria-label={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button>
      <button className="cp-manage-top" onClick={onManage}><BarChart3 size={16}/><span>Gestão</span></button>
      <button className="cp-user-btn" onClick={onSettings}><span>{(email?.[0]||'C').toUpperCase()}</span><Settings2 size={16}/></button>
    </div>
  </div></header>
}
function Brand(){return <div className="cp-brand"><span className="cp-brand-mark">C<span>+</span></span><span className="cp-brand-word">CONTROLE<span>+</span></span></div>}

function HomePage({data,calc,onOpenProduct,onView,onAction,onCheckListing}:{data:Data;calc:Metrics;onOpenProduct:(p:Product)=>void;onView:(v:ControlView)=>void;onAction:(m:Modal)=>void;onCheckListing:(p:Product)=>void}){
  const recent=data.products.slice(0,4)
  const totalCapital=Math.max(0,calc.cash)+calc.stockCapital
  const cashPct=totalCapital>0?Math.max(0,Math.min(100,calc.cash/totalCapital*100)):0
  const stockPct=100-cashPct
  const now=new Date()
  const dateLabel=now.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'short'})
  const dueListings=data.products
    .filter(p=>p.quantity_available>0&&p.listing_status==='listed'&&!!p.listing_next_checkin_at&&p.listing_next_checkin_at<=localDate())
    .sort((a,b)=>(a.listing_next_checkin_at||'').localeCompare(b.listing_next_checkin_at||''))
  const dueListing=dueListings[0]

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
        <div><span>Saldo disponível</span><strong>{money.format(calc.cash)}</strong></div>
        <span className="cp-balance-app-badge">CAIXA</span>
      </div>
      <div className="cp-balance-app-stats">
        <div><span>Em estoque</span><b>{money.format(calc.stockCapital)}</b></div>
        <div><span>Lucro no mês</span><b className={calc.monthProfit>=0?'positive':'negative'}>{money.format(calc.monthProfit)}</b></div>
        <div><span>Vendas</span><b>{calc.monthSales.length}</b></div>
      </div>
      <div className="cp-capital-track"><i style={{width:cashPct+'%'}}/><em style={{width:stockPct+'%'}}/></div>
      <div className="cp-capital-track-labels"><span>{cashPct.toFixed(0)}% livre</span><span>{stockPct.toFixed(0)}% em produtos</span></div>
    </section>

    <section className="cp-quick-app">
      <button onClick={()=>onAction('purchase')}><span><ShoppingBag/></span><b>Compra</b><small>Entrar estoque</small></button>
      <button onClick={()=>onAction('sale')}><span><Banknote/></span><b>Venda</b><small>Dar baixa</small></button>
      <button onClick={()=>onAction('expense')}><span><ArrowDownRight/></span><b>Gasto</b><small>Somar custo</small></button>
      <button onClick={()=>onView('receivables')}><span><ReceiptText/></span><b>Receber</b><small>Parcelas</small></button>
    </section>

    <section className={'cp-smart-card cp-smart-card--'+guide.tone}>
      <div className="cp-smart-icon">{guide.tone==='warn'?<AlertTriangle/>:guide.tone==='brand'?<Package/>:<Check/>}</div>
      <div><span>AGORA</span><h2>{guide.title}</h2><p>{guide.text}</p></div>
      <button onClick={guide.action}>{guide.button}<ChevronRight size={16}/></button>
    </section>

    <section className="cp-app-section">
      <div className="cp-app-section-head"><div><span>ESTOQUE</span><h2>{recent.length?'Produtos recentes':'Seu estoque está vazio'}</h2></div>{recent.length>0&&<button onClick={()=>onView('stock')}>Ver todos</button>}</div>
      {recent.length?<div className="cp-product-row">{recent.map(p=><ProductCard key={p.id} product={p} data={data} calc={calc} onClick={()=>onOpenProduct(p)}/>)}</div>:<Empty icon={<Package/>} title="Comece pelo primeiro produto" text="Adicione uma compra para visualizar estoque, custo e lucro possível." action="Adicionar compra" onAction={()=>onAction('purchase')}/>}
    </section>

    <section className="cp-month-app">
      <div className="cp-app-section-head"><div><span>ESTE MÊS</span><h2>Desempenho</h2></div><button onClick={()=>onView('reports')}>Relatórios</button></div>
      <div className="cp-month-app-grid">
        <div><span>Faturamento</span><b>{money.format(calc.monthRevenue)}</b><small>{calc.monthSales.length} venda(s)</small></div>
        <div><span>Lucro real</span><b className={calc.monthProfit>=0?'positive':'negative'}>{money.format(calc.monthProfit)}</b><small>já descontando custos</small></div>
        <div><span>Lucro possível</span><b>{money.format(calc.potentialProfit)}</b><small>do estoque anunciado</small></div>
      </div>
    </section>
  </div>
}

function ProductCard({product,data,calc,onClick}:{product:Product;data:Data;calc:Metrics;onClick:()=>void}){
  const photo=(data.grouped.photosByProduct.get(product.id)||[])[0]?.signed_url
  const cost=calc.unitCost(product)
  const potential=product.listed_price!==null?(product.listed_price-cost)*product.quantity_available:null
  const days=daysSince(product.purchase_date)
  const listedDays=daysSince(product.listing_started_at||product.purchase_date)
  const listingDue=product.listing_status==='listed'&&!!product.listing_next_checkin_at&&product.listing_next_checkin_at<=localDate()
  const alert=product.quantity_available>0&&days>=calc.alertDays
  const pill=product.quantity_available===0?'Vendido':listingDue?'Revisar anúncio':product.listing_status==='listed'?'Anunciado · '+listedDays+'d':alert?days+' dias':'Em estoque'
  const pillClass=product.quantity_available===0?'cp-pill cp-pill--muted':listingDue?'cp-pill cp-pill--warn':product.listing_status==='listed'?'cp-pill cp-pill--listed':alert?'cp-pill cp-pill--warn':'cp-pill'
  return <button className="cp-product-card" onClick={onClick}><div className="cp-product-photo">{photo?<img src={photo} alt=""/>:<Box size={32}/>}<span className={pillClass}>{pill}</span></div><div className="cp-product-body"><span>{product.acquisition_type==='owned'?'Produto próprio':product.category||'Produto'}</span><h3>{product.name}</h3><div className="cp-product-values"><div><small>Custo real</small><b>{product.cost_basis_known?money.format(cost):'Não informado'}</b></div><div><small>{potential===null?'Sem preço':'Lucro possível'}</small><b className={potential!==null&&potential>=0?'positive':''}>{potential===null?'—':money.format(potential)}</b></div></div></div></button>
}

function StockPage({data,calc,onOpenProduct,onAdd}:{data:Data;calc:Metrics;onOpenProduct:(p:Product)=>void;onAdd:()=>void}){
  const [q,setQ]=useState('')
  const [filter,setFilter]=useState<'all'|'stock'|'listed'|'attention'|'sold'>('all')
  const listedCount=data.products.filter(p=>p.quantity_available>0&&p.listing_status==='listed').length
  const reviewCount=data.products.filter(p=>p.quantity_available>0&&p.listing_status==='listed'&&!!p.listing_next_checkin_at&&p.listing_next_checkin_at<=localDate()).length
  const list=data.products.filter(p=>{
    const match=(p.name+' '+(p.category||'')).toLowerCase().includes(q.toLowerCase())
    if(!match)return false
    if(filter==='stock')return p.quantity_available>0
    if(filter==='listed')return p.quantity_available>0&&p.listing_status==='listed'
    if(filter==='attention')return p.quantity_available>0&&(daysSince(p.purchase_date)>=calc.alertDays||(p.listing_status==='listed'&&!!p.listing_next_checkin_at&&p.listing_next_checkin_at<=localDate()))
    if(filter==='sold')return p.quantity_available===0
    return true
  })
  return <div className="cp-page"><PageTitle eyebrow="ESTOQUE" title="Seus produtos em um só lugar." text="Comprados para revenda ou produtos que você já tinha: acompanhe custo, anúncio e tempo parado." action={<button className="cp-primary cp-small" onClick={onAdd}><Plus size={18}/> Adicionar produto</button>}/><div className="cp-stock-summary cp-stock-summary--four"><div><span>Capital no estoque</span><strong>{money.format(calc.stockCapital)}</strong></div><div><span>Unidades disponíveis</span><strong>{calc.stockUnits}</strong></div><div><span>Anunciados</span><strong>{listedCount}</strong></div><div><span>Revisar anúncio</span><strong>{reviewCount}</strong></div></div><div className="cp-tools"><label className="cp-search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar produto..."/></label><div className="cp-filter-tabs">{([['all','Todos'],['stock','Disponíveis'],['listed','Anunciados'],['attention','Atenção'],['sold','Vendidos']] as const).map(([key,label])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}</div></div>{list.length?<div className="cp-stock-grid">{list.map(p=><ProductCard key={p.id} product={p} data={data} calc={calc} onClick={()=>onOpenProduct(p)}/>)}</div>:<Empty icon={<Search/>} title="Nada por aqui" text={q?'Nenhum produto combina com essa busca.':'Adicione uma compra ou um produto que você já tem.'} action={q?undefined:'Adicionar produto'} onAction={onAdd}/>}</div>
}

function SalesPage({data,calc,onSale,onOpenProduct}:{data:Data;calc:Metrics;onSale:()=>void;onOpenProduct:(p:Product)=>void}){
  return <div className="cp-page"><PageTitle eyebrow="VENDAS" title="Venda registrada, lucro entendido." text="Sem fazer conta na cabeça: veja o que entrou e quanto realmente sobrou." action={<button className="cp-primary cp-small" onClick={onSale}><Plus size={18}/> Registrar venda</button>}/><section className="cp-sales-hero"><div><span>Faturamento este mês</span><strong>{money.format(calc.monthRevenue)}</strong></div><div><span>Lucro real</span><strong className={calc.monthProfit>=0?'positive':'negative'}>{money.format(calc.monthProfit)}</strong></div><div><span>Vendas</span><strong>{calc.monthSales.length}</strong></div></section><div className="cp-section-head"><div><span>HISTÓRICO</span><h2>Últimas vendas</h2></div></div>{data.sales.length?<div className="cp-sale-list">{data.sales.map(sale=>{const stats=calc.saleStats(sale);const items=data.grouped.itemsBySale.get(sale.id)||[];const product=items[0]?calc.productMap.get(items[0].product_id):undefined;const photo=product?(data.grouped.photosByProduct.get(product.id)||[])[0]?.signed_url:null;return <button key={sale.id} className="cp-sale-row" onClick={()=>product&&onOpenProduct(product)}><span className="cp-sale-thumb">{photo?<img src={photo} alt=""/>:<ReceiptText/>}</span><div className="cp-sale-main"><strong>{product?.name||'Venda'}</strong><span>{new Date(sale.sale_date+'T12:00:00').toLocaleDateString('pt-BR')} · {paymentLabel(sale.payment_method)}</span></div><div className="cp-sale-money"><b>{money.format(stats.revenue)}</b><span className={stats.profit>=0?'positive':'negative'}>{(stats.profit>=0?'+':'')+money.format(stats.profit)} lucro</span></div></button>})}</div>:<Empty icon={<ReceiptText/>} title="Nenhuma venda registrada" text="Quando fechar uma venda, registre aqui. O produto sai do estoque e o valor entra no caixa." action="Registrar primeira venda" onAction={onSale}/>}</div>
}

function CashPage({data,calc,onCash,onSettings}:{data:Data;calc:Metrics;onCash:()=>void;onSettings:()=>void}){
  const incoming=data.cashEntries.filter(x=>x.kind==='income').reduce((s,x)=>s+x.amount,0)
  const outgoing=data.cashEntries.filter(x=>x.kind==='expense').reduce((s,x)=>s+x.amount,0)
  return <div className="cp-page"><PageTitle eyebrow="CAIXA" title="Saiba quanto pode reinvestir." text="Entradas e saídas ficam em uma linha do tempo simples, sem linguagem de contabilidade." action={<button className="cp-primary cp-small" onClick={onCash}><Plus size={18}/> Movimento</button>}/><section className="cp-cash-card"><span>Saldo disponível</span><strong>{money.format(calc.cash)}</strong><p>{calc.cash>=0?'Esse é o valor livre considerando tudo que você registrou.':'Seu caixa está negativo. Confira se o saldo inicial e as movimentações estão completos.'}</p><button onClick={onSettings}>Ajustar saldo inicial <ChevronRight size={16}/></button></section><div className="cp-cash-breakdown"><div><span><ArrowUpRight/> Entradas</span><b>{money.format(incoming)}</b></div><div><span><ArrowDownRight/> Saídas</span><b>{money.format(outgoing)}</b></div></div><div className="cp-section-head"><div><span>MOVIMENTAÇÕES</span><h2>O que aconteceu com seu dinheiro</h2></div></div>{data.cashEntries.length?<div className="cp-cash-list">{data.cashEntries.map(e=><CashRow key={e.id} entry={e}/>)}</div>:<Empty icon={<WalletCards/>} title="Seu caixa está limpo" text="Compras, vendas e gastos registrados aparecem aqui automaticamente." action="Adicionar movimentação" onAction={onCash}/>}</div>
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

function ActionSheet({onClose,onChoose}:{onClose:()=>void;onChoose:(m:Modal)=>void}){
  return <ModalShell onClose={onClose} compact><div className="cp-action-sheet">
    <span className="cp-eyebrow">REGISTRAR</span>
    <h2>O que você quer registrar?</h2>
    <p>Escolha o movimento certo. O CONTROLE+ atualiza estoque e caixa sem misturar as coisas.</p>
    <Action icon={<ShoppingBag/>} title="Fiz uma compra" text="Comprei para revender · sai dinheiro do caixa" onClick={()=>onChoose('purchase')}/>
    <Action icon={<Box/>} title="Adicionar produto que já tenho" text="Produto de casa ou próprio · não mexe no caixa" onClick={()=>onChoose('inventory')}/>
    <Action icon={<Banknote/>} title="Fiz uma venda" text="Dar baixa no estoque e calcular o lucro" onClick={()=>onChoose('sale')}/>
    <Action icon={<ArrowDownRight/>} title="Tive um gasto" text="Reparo, transporte, limpeza ou taxa" onClick={()=>onChoose('expense')}/>
    <Action icon={<WalletCards/>} title="Outro movimento" text="Entrada ou saída manual de caixa" onClick={()=>onChoose('cash')}/>
  </div></ModalShell>
}
function Action({icon,title,text,onClick}:{icon:React.ReactNode;title:string;text:string;onClick:()=>void}){return <button onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><ChevronRight/></button>}

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

function PurchaseModal({data,onClose,onDone}:{data:Data;onClose:()=>void;onDone:()=>void}){
  const [step,setStep]=useState(1)
  const [name,setName]=useState(''),[category,setCategory]=useState(''),[source,setSource]=useState('Marketplace'),[date,setDate]=useState(localDate()),[supplierId,setSupplierId]=useState('')
  const [cost,setCost]=useState(''),[qty,setQty]=useState('1'),[listed,setListed]=useState(''),[minimum,setMinimum]=useState(''),[notes,setNotes]=useState('')
  const [isListed,setIsListed]=useState(false),[channels,setChannels]=useState<string[]>([]),[listingDate,setListingDate]=useState(localDate())
  const [files,setFiles]=useState<File[]>([]),[error,setError]=useState<string|null>(null)
  async function save(){
    setError(null)
    try{
      if(!name.trim())throw new Error('Dê um nome para o produto.')
      const purchase=Number(cost.replace(',','.'))
      if(!Number.isFinite(purchase)||purchase<0)throw new Error('Informe quanto você pagou.')
      const listPrice=listed?Number(listed.replace(',','.')):null
      if(isListed&&(!listPrice||listPrice<=0))throw new Error('Informe o preço do anúncio.')
      if(isListed&&channels.length===0)throw new Error('Selecione onde o produto está anunciado.')
      await data.createProduct({
        name:name.trim(),category:category.trim(),source,supplierId:supplierId||null,
        purchaseDate:date,purchaseUnitCost:purchase,quantity:Math.max(1,Number(qty)||1),
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
    {step===2&&<div className="cp-form-grid"><Field label="Quanto pagou por unidade?"><MoneyInput value={cost} setValue={setCost} placeholder="0,00"/></Field><Field label="Quantidade"><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/></Field><Field label={isListed?'Preço anunciado':'Preço que pretende anunciar'}><MoneyInput value={listed} setValue={setListed} placeholder="Opcional"/></Field><Field label="Menor valor que aceitaria"><MoneyInput value={minimum} setValue={setMinimum} placeholder="Opcional"/></Field><ListingSetup isListed={isListed} setIsListed={setIsListed} channels={channels} setChannels={setChannels} listingDate={listingDate} setListingDate={setListingDate}/><div className="cp-live-summary"><span>Investimento inicial</span><strong>{money.format((Number(cost.replace(',','.'))||0)*(Number(qty)||1))}</strong><small>Será registrado automaticamente como saída do caixa.</small></div></div>}
    {step===3&&<div className="cp-form-grid"><label className="cp-photo-drop"><ImagePlus size={28}/><b>{files.length?files.length+' foto(s) selecionada(s)':'Adicionar fotos'}</b><span>Até 8 imagens · 10 MB cada</span><input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,8))}/></label>{files.length>0&&<div className="cp-photo-preview">{files.map((file,i)=><div key={file.name+i}><img src={URL.createObjectURL(file)} alt=""/><button type="button" onClick={()=>setFiles(list=>list.filter((_,index)=>index!==i))}><X/></button></div>)}</div>}<Field label="Observações" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Defeito, acessório, detalhe da compra..."/></Field><div className="cp-review-box"><b>{name||'Seu produto'}</b><span>{(qty||1)+' un. · '+money.format(Number(cost.replace(',','.'))||0)+' cada'}</span><span>{isListed?'Anunciado em '+channels.join(', '):'Ainda não anunciado'}</span><span>{files.length+' foto(s) no histórico'}</span></div></div>}
    {error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions">{step>1&&<button className="cp-secondary" onClick={()=>setStep(s=>s-1)}>Voltar</button>}<button className="cp-primary" disabled={data.busy} onClick={()=>step<3?setStep(s=>s+1):void save()}>{data.busy?'Salvando...':step<3?'Continuar':'Salvar compra'}</button></div>
  </ModalShell>
}

function InventoryModal({data,onClose,onDone}:{data:Data;onClose:()=>void;onDone:()=>void}){
  const [step,setStep]=useState(1)
  const [name,setName]=useState(''),[category,setCategory]=useState(''),[qty,setQty]=useState('1')
  const [knowCost,setKnowCost]=useState(false),[cost,setCost]=useState(''),[listed,setListed]=useState(''),[minimum,setMinimum]=useState('')
  const [isListed,setIsListed]=useState(false),[channels,setChannels]=useState<string[]>([]),[listingDate,setListingDate]=useState(localDate())
  const [files,setFiles]=useState<File[]>([]),[notes,setNotes]=useState(''),[error,setError]=useState<string|null>(null)
  async function save(){
    setError(null)
    try{
      if(!name.trim())throw new Error('Dê um nome para o produto.')
      const originalCost=knowCost?(Number(cost.replace(',','.'))||0):0
      const listPrice=listed?Number(listed.replace(',','.')):null
      if(knowCost&&originalCost<0)throw new Error('Informe um custo válido.')
      if(isListed&&(!listPrice||listPrice<=0))throw new Error('Informe o preço do anúncio.')
      if(isListed&&channels.length===0)throw new Error('Selecione onde o produto está anunciado.')
      await data.createProduct({
        name:name.trim(),category:category.trim(),source:'Produto próprio',
        purchaseDate:localDate(),purchaseUnitCost:originalCost,quantity:Math.max(1,Number(qty)||1),
        listedPrice:listPrice,minimumPrice:minimum?Number(minimum.replace(',','.')):null,notes,
        acquisitionType:'owned',costBasisKnown:knowCost,
        listingStatus:isListed?'listed':'not_listed',listingChannels:channels,
        listingStartedAt:isListed?listingDate:null
      },files)
      onDone()
    }catch(err:any){setError(err?.message||'Não foi possível adicionar o produto.')}
  }
  return <ModalShell onClose={onClose}><ModalHeader eyebrow="PRODUTO QUE JÁ É SEU" title={step===1?'O que você quer vender?':step===2?'Preço e anúncio':'Fotos e detalhes'} text={step===1?'Cadastre algo que você já tem em casa ou já possuía. Isso não tira dinheiro do caixa.':step===2?'Se já estiver anunciado, o CONTROLE+ começa a acompanhar o desempenho.':'Fotos ajudam a reconhecer o item no estoque e acompanhar a venda.'}/><Stepper step={step}/>
    {step===1&&<div className="cp-form-grid"><Field label="Produto" full><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: TV Samsung 43, bicicleta, ferramenta..."/></Field><Field label="Categoria"><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Eletrônico, ferramenta..."/></Field><Field label="Quantidade"><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/></Field><Tip text="Produto próprio entra no estoque, mas não gera saída no caixa."/></div>}
    {step===2&&<div className="cp-form-grid"><div className="cp-field cp-field--full"><span>Quer considerar quanto esse produto te custou?</span><div className="cp-cost-choice"><button type="button" className={!knowCost?'active':''} onClick={()=>setKnowCost(false)}>Não sei / não considerar</button><button type="button" className={knowCost?'active':''} onClick={()=>setKnowCost(true)}>Sim, sei o valor</button></div></div>{knowCost&&<Field label="Custo original por unidade"><MoneyInput value={cost} setValue={setCost} placeholder="0,00"/></Field>}<Field label={isListed?'Preço anunciado':'Preço que pretende vender'}><MoneyInput value={listed} setValue={setListed} placeholder="Opcional"/></Field><Field label="Menor valor que aceitaria"><MoneyInput value={minimum} setValue={setMinimum} placeholder="Opcional"/></Field><ListingSetup isListed={isListed} setIsListed={setIsListed} channels={channels} setChannels={setChannels} listingDate={listingDate} setListingDate={setListingDate}/></div>}
    {step===3&&<div className="cp-form-grid"><label className="cp-photo-drop"><ImagePlus size={28}/><b>{files.length?files.length+' foto(s) selecionada(s)':'Adicionar fotos'}</b><span>Até 8 imagens · 10 MB cada</span><input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,8))}/></label>{files.length>0&&<div className="cp-photo-preview">{files.map((file,i)=><div key={file.name+i}><img src={URL.createObjectURL(file)} alt=""/><button type="button" onClick={()=>setFiles(list=>list.filter((_,index)=>index!==i))}><X/></button></div>)}</div>}<Field label="Observações" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Estado, acessórios, defeitos, motivo da venda..."/></Field><div className="cp-review-box"><b>{name||'Seu produto'}</b><span>Produto próprio · não movimenta o caixa</span><span>{isListed?'Anunciado há '+daysSince(listingDate)+' dia(s)':'Ainda não anunciado'}</span></div></div>}
    {error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions">{step>1&&<button className="cp-secondary" onClick={()=>setStep(s=>s-1)}>Voltar</button>}<button className="cp-primary" disabled={data.busy} onClick={()=>step<3?setStep(s=>s+1):void save()}>{data.busy?'Salvando...':step<3?'Continuar':'Adicionar ao estoque'}</button></div>
  </ModalShell>
}

function SaleModal({data,initialProduct,onClose,onDone}:{data:Data;initialProduct:Product|null;onClose:()=>void;onDone:()=>void}){
  const available=data.products.filter(p=>p.quantity_available>0)
  const first=initialProduct&&initialProduct.quantity_available>0?initialProduct:available[0]
  const [productId,setProductId]=useState(first?.id||'')
  const [qty,setQty]=useState('1')
  const [price,setPrice]=useState(first?.listed_price?String(first.listed_price):'')
  const [date,setDate]=useState(localDate())
  const [payment,setPayment]=useState('pix')
  const [paymentMode,setPaymentMode]=useState<'paid'|'receivable'>('paid')
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
      let customer=customerId||null
      if(newCustomer){
        if(!customerName.trim())throw new Error('Informe o nome do cliente.')
        const created=await data.createCustomer(customerName,customerPhone)
        customer=created.id
      }
      if(paymentMode==='receivable'&&!customer)throw new Error('Para venda a prazo, informe quem vai pagar.')
      await data.registerSale({
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

  return <ModalShell onClose={onClose}>
    <ModalHeader eyebrow="REGISTRAR VENDA" title="O dinheiro entrou agora ou vai entrar depois?" text="Essa escolha faz o caixa ficar real. Venda a prazo entra em A receber, não no saldo livre."/>
    {available.length?<div className="cp-form-grid">
      <Field label="Produto vendido" full><select value={productId} onChange={e=>{setProductId(e.target.value);const p=available.find(x=>x.id===e.target.value);setPrice(p?.listed_price?String(p.listed_price):'')}}>{available.map(p=><option key={p.id} value={p.id}>{p.name+' · '+p.quantity_available+' disp.'}</option>)}</select></Field>
      <Field label="Quantidade"><input type="number" min="1" max={product?.quantity_available||1} value={qty} onChange={e=>setQty(e.target.value)}/></Field>
      <Field label="Valor por unidade"><MoneyInput value={price} setValue={setPrice} placeholder="0,00"/></Field>
      <Field label="Data da venda"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
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

function SettingsModal({data,email,onClose,onDone}:{data:Data;email?:string;onClose:()=>void;onDone:(t:string)=>void}){
  const [business,setBusiness]=useState(data.settings?.business_name||'Meu negócio'),[cash,setCash]=useState(String(data.settings?.initial_cash||0)),[days,setDays]=useState(String(data.settings?.stock_alert_days||21)),[error,setError]=useState<string|null>(null)
  async function save(){setError(null);try{await data.updateSettings({business_name:business.trim()||'Meu negócio',initial_cash:Math.max(0,Number(cash.replace(',','.'))||0),stock_alert_days:Math.max(1,Number(days)||21),onboarding_completed:true});onDone('Configurações salvas.');onClose()}catch(err:any){setError(err?.message||'Não foi possível salvar.')}}
  return <ModalShell onClose={onClose}><ModalHeader eyebrow="SEU CONTROLE+" title="Ajustes simples, números mais reais." text="Defina o ponto de partida do caixa e quando um produto deve chamar atenção."/><div className="cp-account-line"><span>{(email?.[0]||'C').toUpperCase()}</span><div><b>{email||'Sua conta'}</b><small>Dados protegidos por usuário</small></div></div><div className="cp-form-grid"><Field label="Nome do negócio" full><input value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Ex.: Brique do Luan"/></Field><Field label="Saldo inicial"><MoneyInput value={cash} setValue={setCash} placeholder="0,00"/></Field><Field label="Alertar estoque após"><div className="cp-input-suffix"><input type="number" min="1" value={days} onChange={e=>setDays(e.target.value)}/><span>dias</span></div></Field></div><div className="cp-settings-note"><b>O que é saldo inicial?</b><p>É o dinheiro que você já tinha disponível antes de começar a registrar as movimentações aqui.</p></div>{error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions"><button className="cp-danger-link" onClick={()=>void supabase.auth.signOut()}><LogOut size={17}/> Sair</button><button className="cp-primary" disabled={data.busy} onClick={()=>void save()}>Salvar ajustes</button></div></ModalShell>
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

function ProductDetail({product,data,calc,onClose,onSale,onExpense,onSaved}:{product:Product;data:Data;calc:Metrics;onClose:()=>void;onSale:()=>void;onExpense:()=>void;onSaved:()=>void}){
  const photos=data.grouped.photosByProduct.get(product.id)||[]
  const expenses=data.grouped.expensesByProduct.get(product.id)||[]
  const cost=calc.unitCost(product)
  const [listed,setListed]=useState(product.listed_price===null?'':String(product.listed_price))
  const [minimum,setMinimum]=useState(product.minimum_price===null?'':String(product.minimum_price))
  const [editing,setEditing]=useState(false)
  const [listingEditing,setListingEditing]=useState(false)
  const [isListed,setIsListed]=useState(product.listing_status==='listed')
  const [channels,setChannels]=useState<string[]>(product.listing_channels||[])
  const [listingDate,setListingDate]=useState(product.listing_started_at||localDate())
  const [error,setError]=useState<string|null>(null)
  const potential=product.listed_price!==null?(product.listed_price-cost)*product.quantity_available:null
  const listingDays=product.listing_status==='listed'?daysSince(product.listing_started_at||product.purchase_date):0
  const listingDue=product.listing_status==='listed'&&!!product.listing_next_checkin_at&&product.listing_next_checkin_at<=localDate()
  const checkins=data.grouped.listingCheckinsByProduct.get(product.id)||[]

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
    <div className="cp-detail-hero"><div className="cp-detail-photo">{photos[0]?.signed_url?<img src={photos[0].signed_url} alt=""/>:<Package/>}</div><div><span className="cp-eyebrow">{product.acquisition_type==='owned'?'PRODUTO PRÓPRIO':product.category||'PRODUTO'}</span><h2>{product.name}</h2><p>{product.quantity_available>0?product.quantity_available+' de '+product.quantity_initial+' unidade(s) disponíveis':'Produto vendido'}</p></div></div>
    {photos.length>1&&<div className="cp-detail-gallery">{photos.slice(1,6).map(p=><img key={p.id} src={p.signed_url||''} alt=""/>)}</div>}
    <div className="cp-detail-numbers"><div><span>Custo por un.</span><b>{product.cost_basis_known?money.format(product.purchase_unit_cost):'Não informado'}</b></div><div><span>Custo real</span><b>{product.cost_basis_known?money.format(cost):'Sem base'}</b></div><div><span>Lucro possível</span><b className={potential!==null&&potential>=0?'positive':''}>{potential===null?'—':money.format(potential)}</b></div><div><span>Tempo no estoque</span><b>{daysSince(product.purchase_date)} dias</b></div></div>
    <div className="cp-detail-actions">{product.quantity_available>0&&<button className="cp-primary" onClick={onSale}><Banknote/> Registrar venda</button>}<button className="cp-secondary" onClick={onExpense}><Plus/> Adicionar gasto</button></div>

    <section className="cp-detail-section">
      <div className="cp-section-head"><div><span>ANÚNCIO</span><h2>Acompanhar a venda</h2></div>{product.listing_status!=='sold'&&<button onClick={()=>setListingEditing(v=>!v)}>{listingEditing?'Cancelar':'Editar'}</button>}</div>
      {listingEditing?<div className="cp-listing-editor"><ListingSetup isListed={isListed} setIsListed={setIsListed} channels={channels} setChannels={setChannels} listingDate={listingDate} setListingDate={setListingDate}/>{isListed&&<Field label="Preço anunciado" full><MoneyInput value={listed} setValue={setListed} placeholder="0,00"/></Field>}<button className="cp-primary" disabled={data.busy} onClick={()=>void saveListing()}>{data.busy?'Salvando...':'Salvar anúncio'}</button></div>:<div className={listingDue?'cp-listing-status-card is-due':'cp-listing-status-card'}>
        <span className="cp-listing-status-icon"><Megaphone/></span>
        <div><span>{product.listing_status==='listed'?'ANUNCIADO':product.listing_status==='sold'?'VENDIDO':'NÃO ANUNCIADO'}</span><b>{product.listing_status==='listed'?(product.listing_channels.join(' · ')||'Plataforma não informada'):product.listing_status==='sold'?'Venda concluída':'Esse produto ainda não está sendo acompanhado'}</b>{product.listing_status==='listed'&&<small>{listingDays} dia(s) no ar · {listingDue?'revisão pendente':'próxima revisão '+new Date((product.listing_next_checkin_at||localDate())+'T12:00:00').toLocaleDateString('pt-BR')}</small>}</div>
        {product.listing_status==='listed'&&<strong>{product.listed_price===null?'—':money.format(product.listed_price)}</strong>}
      </div>}
      {checkins.length>0&&<div className="cp-checkin-history"><span>Últimas revisões</span>{checkins.slice(0,3).map(item=><div key={item.id}><b>{item.result==='refreshed'?'Anúncio renovado':item.result==='price_lowered'?'Preço reduzido':item.result==='good'?'Anúncio indo bem':'Mantido por mais 5 dias'}</b><small>{new Date(item.checkin_date+'T12:00:00').toLocaleDateString('pt-BR')}{item.new_price?' · '+money.format(item.new_price):''}</small></div>)}</div>}
    </section>

    <section className="cp-detail-section"><div className="cp-section-head"><div><span>PREÇO DE VENDA</span><h2>Quanto você quer fazer voltar</h2></div><button onClick={()=>setEditing(v=>!v)}>{editing?'Cancelar':'Editar'}</button></div>{editing?<div className="cp-inline-edit"><Field label="Preço anunciado"><MoneyInput value={listed} setValue={setListed} placeholder="0,00"/></Field><Field label="Preço mínimo"><MoneyInput value={minimum} setValue={setMinimum} placeholder="0,00"/></Field><button className="cp-primary" disabled={data.busy} onClick={()=>void savePrices()}>Salvar preços</button></div>:<div className="cp-price-line"><div><span>Anunciado</span><b>{product.listed_price===null?'Não informado':money.format(product.listed_price)}</b></div><div><span>Mínimo</span><b>{product.minimum_price===null?'Não informado':money.format(product.minimum_price)}</b></div></div>}</section>
    <section className="cp-detail-section"><div className="cp-section-head"><div><span>CUSTOS EXTRAS</span><h2>O que aumentou o custo real</h2></div></div>{expenses.length?<div className="cp-expense-list">{expenses.map(e=><div key={e.id}><span><Tag size={15}/>{expenseLabel(e.expense_type)+(e.description?' · '+e.description:'')}</span><b>{money.format(e.amount)}</b></div>)}</div>:<p className="cp-muted">Nenhum gasto extra registrado neste produto.</p>}</section>
    {error&&<div className="cp-form-error">{error}</div>}
  </ModalShell>
}

function ModalShell({children,onClose,compact=false}:{children:React.ReactNode;onClose:()=>void;compact?:boolean}){return <div className="cp-modal-layer" role="dialog" aria-modal="true"><button className="cp-modal-backdrop" onClick={onClose} aria-label="Fechar"/><section className={compact?'cp-modal cp-modal--compact':'cp-modal'}><button className="cp-modal-x" onClick={onClose}><X/></button><div className="cp-modal-scroll">{children}</div></section></div>}
function ModalHeader({eyebrow,title,text}:{eyebrow:string;title:string;text:string}){return <div className="cp-modal-head"><span className="cp-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>}
function Stepper({step}:{step:number}){return <div className="cp-stepper">{[1,2,3].map(i=><div key={i} className={i<=step?'active':''}><span>{i<step?<Check/>:i}</span><small>{i===1?'Produto':i===2?'Valores':'Fotos'}</small></div>)}</div>}
function Field({label,children,full=false}:{label:string;children:React.ReactNode;full?:boolean}){return <label className={full?'cp-field cp-field--full':'cp-field'}><span>{label}</span>{children}</label>}
function MoneyInput({value,setValue,placeholder}:{value:string;setValue:(v:string)=>void;placeholder:string}){return <div className="cp-money-input"><span>R$</span><input inputMode="decimal" value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9,.]/g,''))} placeholder={placeholder}/></div>}
function Tip({text}:{text:string}){return <div className="cp-form-tip"><span>+</span><p>{text}</p></div>}
function LoadingScreen(){return <div className="cp-loading"><Brand/><div className="cp-loading-line"><span/></div><p>Organizando seu negócio...</p></div>}
function paymentLabel(v:string){return ({pix:'Pix',cash:'Dinheiro',card:'Cartão',transfer:'Transferência',receivable:'A prazo',other:'Outro'} as Record<string,string>)[v]||v}
function expenseLabel(v:string){return ({repair:'Reparo',transport:'Transporte',cleaning:'Limpeza',fee:'Taxa',accessory:'Acessório/peça',other:'Outro'} as Record<string,string>)[v]||v}
function cashCategory(v:string){return ({purchase:'Compra',sale:'Venda',product_expense:'Gasto de produto',manual:'Manual'} as Record<string,string>)[v]||v}
