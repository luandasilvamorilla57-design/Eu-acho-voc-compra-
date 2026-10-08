import {useEffect,useMemo,useState} from 'react'
import {
  ArrowLeft,Boxes,ChevronRight,CircleDollarSign,Mail,Package,ReceiptText,
  MessageSquareText,Search,ShieldCheck,Star,Store,UsersRound,WalletCards
} from 'lucide-react'
import {supabase} from '../lib/supabase'
import type {CashEntry,ControlAccount,ControlSettings,Product,Sale,SaleItem} from './types'
import {feedbackSummary,StarRating,type FeedbackRow} from './FeedbackPrompt'

const db=supabase as any
const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})
const number=new Intl.NumberFormat('pt-BR')

type AdminData={
  accounts:ControlAccount[]
  settings:ControlSettings[]
  products:Product[]
  sales:Sale[]
  saleItems:SaleItem[]
  cashEntries:CashEntry[]
  billing:any[]
  feedback:FeedbackRow[]
}

function toNumber<T extends Record<string,any>>(rows:T[],keys:string[]){
  return rows.map(row=>{
    const next:any={...row}
    for(const key of keys)if(next[key]!==null&&next[key]!==undefined)next[key]=Number(next[key])
    return next as T
  })
}

export function AdminCenter({onBack}:{onBack:()=>void}){
  const [data,setData]=useState<AdminData>({accounts:[],settings:[],products:[],sales:[],saleItems:[],cashEntries:[],billing:[],feedback:[]})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState<string|null>(null)

  useEffect(()=>{
    let alive=true
    ;(async()=>{
      setLoading(true);setError(null)
      try{
        const [a,s,p,sa,si,c,b,f]=await Promise.all([
          db.from('control_accounts').select('*').order('registered_at',{ascending:false}),
          db.from('control_settings').select('*'),
          db.from('control_products').select('*').order('created_at',{ascending:false}),
          db.from('control_sales').select('*').order('sale_date',{ascending:false}),
          db.from('control_sale_items').select('*').order('created_at',{ascending:false}),
          db.from('control_cash_entries').select('*').order('occurred_at',{ascending:false}),
          db.from('control_billing').select('*').order('created_at',{ascending:false}),
          db.from('control_feedback').select('*').order('created_at',{ascending:false})
        ])
        for(const result of [a,s,p,sa,si,c,b,f])if(result.error)throw result.error
        if(!alive)return
        setData({
          accounts:(a.data||[]) as ControlAccount[],
          settings:toNumber((s.data||[]) as ControlSettings[],['initial_cash','stock_alert_days']),
          products:toNumber((p.data||[]) as Product[],['purchase_unit_cost','listed_price','minimum_price']),
          sales:(sa.data||[]) as Sale[],
          saleItems:toNumber((si.data||[]) as SaleItem[],['unit_price','unit_cost_snapshot']),
          cashEntries:toNumber((c.data||[]) as CashEntry[],['amount']),
          billing:toNumber((b.data||[]) as any[],['monthly_price']),
          feedback:(f.data||[]) as FeedbackRow[]
        })
      }catch(err:any){
        if(alive)setError(err?.message||'Não foi possível carregar o painel administrador.')
      }finally{
        if(alive)setLoading(false)
      }
    })()
    return()=>{alive=false}
  },[])

  const settingsByUser=useMemo(()=>new Map(data.settings.map(item=>[item.user_id,item])),[data.settings])
  const billingByUser=useMemo(()=>new Map(data.billing.map(item=>[item.user_id,item])),[data.billing])
  const feedbackByUser=useMemo(()=>new Map(data.feedback.map(item=>[item.user_id,item])),[data.feedback])
  const metrics=useMemo(()=>{
    return data.accounts.map(account=>{
      const products=data.products.filter(item=>item.user_id===account.user_id)
      const sales=data.sales.filter(item=>item.user_id===account.user_id&&item.status==='completed')
      const saleIds=new Set(sales.map(item=>item.id))
      const items=data.saleItems.filter(item=>saleIds.has(item.sale_id))
      const cash=data.cashEntries.filter(item=>item.user_id===account.user_id)
      const settings=settingsByUser.get(account.user_id)
      const billing=billingByUser.get(account.user_id)
      const feedback=feedbackByUser.get(account.user_id)
      const now=Date.now()
      const trialEnd=billing?.trial_ends_at?new Date(billing.trial_ends_at).getTime():0
      const validUntil=billing?.valid_until?new Date(billing.valid_until).getTime():0
      const trialDays=Math.max(0,Math.ceil((trialEnd-now)/86400000))
      const accessLabel=validUntil>now&&['active','cancelled'].includes(String(billing?.status||''))?'Ativo':trialEnd>now?'Teste · '+trialDays+'d':billing?.status==='pending'?'Pagamento pendente':billing?.status==='past_due'?'Pagamento atrasado':'Expirado'
      const revenue=items.reduce((sum,item)=>sum+item.unit_price*item.quantity,0)
      const profit=items.reduce((sum,item)=>sum+(item.unit_price-item.unit_cost_snapshot)*item.quantity,0)
      const stockUnits=products.reduce((sum,item)=>sum+item.quantity_available,0)
      const stockValue=products.reduce((sum,item)=>sum+(item.purchase_unit_cost*item.quantity_available),0)
      const cashBalance=(settings?.initial_cash||0)+cash.reduce((sum,item)=>sum+(item.kind==='income'?item.amount:-item.amount),0)
      return{
        account,
        business:settings?.business_name||'Conta sem configuração',
        onboarded:Boolean(settings?.onboarding_completed),
        products, sales, items, revenue, profit, stockUnits, stockValue, cashBalance, billing, feedback, accessLabel, trialDays
      }
    })
  },[data,billingByUser,feedbackByUser,settingsByUser])

  const totals=useMemo(()=>metrics.reduce((acc,item)=>({
    accounts:acc.accounts+1,
    onboarded:acc.onboarded+(item.onboarded?1:0),
    stockUnits:acc.stockUnits+item.stockUnits,
    revenue:acc.revenue+item.revenue,
    cash:acc.cash+item.cashBalance
  }),{accounts:0,onboarded:0,stockUnits:0,revenue:0,cash:0}),[metrics])

  const feedbackStats=useMemo(()=>feedbackSummary(data.feedback),[data.feedback])

  const filtered=metrics.filter(item=>{
    const hay=(item.business+' '+(item.account.email||'')).toLowerCase()
    return hay.includes(query.toLowerCase())
  })

  const active=selected?metrics.find(item=>item.account.user_id===selected)||null:null

  if(active){
    return <div className="cp-page cp-admin-page">
      <section className="cp-admin-title">
        <button onClick={()=>setSelected(null)}><ArrowLeft/></button>
        <div><span>CONTA</span><h1>{active.business}</h1><p>{active.account.email||'E-mail indisponível'}</p></div>
      </section>

      <section className="cp-admin-account-hero">
        <div><span>Caixa estimado</span><strong>{money.format(active.cashBalance)}</strong></div>
        <div><span>Estoque</span><strong>{number.format(active.stockUnits)} un.</strong><small>{money.format(active.stockValue)} em custo</small></div>
        <div><span>Faturamento</span><strong>{money.format(active.revenue)}</strong><small>{active.sales.length} venda(s)</small></div>
        <div><span>Acesso</span><strong>{active.accessLabel}</strong><small>{active.billing?money.format(Number(active.billing.monthly_price||12.9))+'/mês':'Sem cobrança'}</small></div>
      </section>

      <section className="cp-admin-section">
        <div className="cp-admin-section-head"><div><span>ESTOQUE DA CONTA</span><h2>{active.products.length} produto(s)</h2></div></div>
        {active.products.length?<div className="cp-admin-products">{active.products.slice(0,30).map(product=><article key={product.id}>
          <span className="cp-admin-product-icon"><Package/></span>
          <div><b>{product.name}</b><small>{product.category||'Sem categoria'} · {product.quantity_available} disponível</small></div>
          <div><span>{product.listing_status==='listed'?'Anunciado':product.status==='sold'?'Vendido':'Em estoque'}</span><strong>{product.listed_price!==null?money.format(product.listed_price):'—'}</strong></div>
        </article>)}</div>:<div className="cp-admin-empty">Nenhum produto cadastrado nessa conta.</div>}
      </section>

      {active.feedback&&<section className="cp-admin-section cp-admin-user-feedback">
        <div className="cp-admin-section-head"><div><span>AVALIAÇÃO DESTE USUÁRIO</span><h2>O que ele achou do CONTROLE+</h2></div></div>
        <article>
          <div className="cp-admin-user-feedback-top"><StarRating value={Number(active.feedback.stars)}/><b>{active.feedback.stars}/5</b><small>{new Date(active.feedback.created_at).toLocaleDateString('pt-BR')}</small></div>
          {active.feedback.comment&&<p>“{active.feedback.comment}”</p>}
          {(active.feedback.selected_tags||[]).length>0&&<div className="cp-admin-feedback-tags">{active.feedback.selected_tags.map((tag:string)=><span key={tag}>{tag}</span>)}</div>}
        </article>
      </section>}

      <section className="cp-admin-section">
        <div className="cp-admin-section-head"><div><span>VENDAS RECENTES</span><h2>Histórico da conta</h2></div></div>
        {active.sales.length?<div className="cp-admin-sales">{active.sales.slice(0,15).map(sale=>{
          const items=active.items.filter(item=>item.sale_id===sale.id)
          const total=items.reduce((sum,item)=>sum+item.unit_price*item.quantity,0)
          return <article key={sale.id}><span><ReceiptText/></span><div><b>{new Date(sale.sale_date+'T12:00:00').toLocaleDateString('pt-BR')}</b><small>{sale.payment_mode==='receivable'?'A prazo':'Recebida'} · {items.length} item(ns)</small></div><strong>{money.format(total)}</strong></article>
        })}</div>:<div className="cp-admin-empty">Essa conta ainda não registrou vendas.</div>}
      </section>
    </div>
  }

  return <div className="cp-page cp-admin-page">
    <section className="cp-admin-title">
      <button onClick={onBack}><ArrowLeft/></button>
      <div><span>ADMINISTRADOR GERAL</span><h1>Visão de toda a operação.</h1><p>As contas continuam isoladas entre si. Só o seu perfil administrador enxerga este painel consolidado.</p></div>
      <span className="cp-admin-badge"><ShieldCheck/> SUPER ADMIN</span>
    </section>

    {loading&&<div className="cp-admin-empty">Carregando contas...</div>}
    {error&&<div className="cp-form-error">{error}</div>}
    {!loading&&!error&&<>
      <section className="cp-admin-kpis">
        <div><span><UsersRound/> Contas</span><strong>{totals.accounts}</strong><small>{totals.onboarded} configurada(s)</small></div>
        <div><span><Boxes/> Estoque global</span><strong>{number.format(totals.stockUnits)} un.</strong><small>todas as contas</small></div>
        <div><span><CircleDollarSign/> Faturamento</span><strong>{money.format(totals.revenue)}</strong><small>vendas registradas</small></div>
        <div><span><WalletCards/> Caixa somado</span><strong>{money.format(totals.cash)}</strong><small>saldo estimado</small></div>
      </section>

      <section className="cp-admin-feedback-block">
        <div className="cp-admin-feedback-title"><div><span>FEEDBACK DOS USUÁRIOS</span><h2>O que os clientes estão achando</h2><p>Avaliações aparecem somente depois de pelo menos 2 dias de uso.</p></div><MessageSquareText/></div>
        <div className="cp-admin-feedback-kpis">
          <div><span>Média geral</span><strong>{feedbackStats.total?feedbackStats.average.toFixed(1):'—'} <Star/></strong><small>{feedbackStats.total} avaliação(ões)</small></div>
          <div><span>5 estrelas</span><strong>{feedbackStats.five}</strong><small>clientes muito satisfeitos</small></div>
          <div><span>Mais pedido</span><strong>{feedbackStats.topTag?.[0]||'—'}</strong><small>{feedbackStats.topTag?feedbackStats.topTag[1]+' marcação(ões)':'sem dados ainda'}</small></div>
        </div>
        {data.feedback.length>0?<div className="cp-admin-feedback-list">
          {data.feedback.slice(0,12).map(review=>{
            const metric=metrics.find(item=>item.account.user_id===review.user_id)
            return <article key={review.id}>
              <div className="cp-admin-feedback-review-head">
                <span className="cp-admin-avatar">{((metric?.business||metric?.account.email||'C')[0]||'C').toUpperCase()}</span>
                <div><b>{metric?.business||'Conta'}</b><small>{metric?.account.email||'E-mail indisponível'} · {metric?.accessLabel||'Conta'}</small></div>
                <div><StarRating value={Number(review.stars)}/><small>{new Date(review.created_at).toLocaleDateString('pt-BR')}</small></div>
              </div>
              {review.comment&&<p>“{review.comment}”</p>}
              {(review.selected_tags||[]).length>0&&<div className="cp-admin-feedback-tags">{review.selected_tags.map(tag=><span key={tag}>{tag}</span>)}</div>}
            </article>
          })}
        </div>:<div className="cp-admin-empty">As avaliações aparecerão aqui conforme usuários com mais de 2 dias responderem.</div>}
      </section>

      <div className="cp-admin-toolbar">
        <label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar conta, negócio ou e-mail..."/></label>
        <span>{filtered.length} conta(s)</span>
      </div>

      <section className="cp-admin-accounts">
        {filtered.map(item=><button key={item.account.user_id} onClick={()=>setSelected(item.account.user_id)}>
          <span className="cp-admin-avatar">{(item.business[0]||item.account.email?.[0]||'C').toUpperCase()}</span>
          <div className="cp-admin-account-copy"><b>{item.business}</b><span><Mail/> {item.account.email||'Sem e-mail'}</span><small>Cadastrada em {new Date(item.account.registered_at).toLocaleDateString('pt-BR')}</small></div>
          <div className="cp-admin-account-numbers"><span><Store/> {item.stockUnits} un.</span><strong>{item.accessLabel}</strong><small>{money.format(item.revenue)} · {item.sales.length} venda(s)</small></div>
          <ChevronRight/>
        </button>)}
      </section>
    </>}
  </div>
}
