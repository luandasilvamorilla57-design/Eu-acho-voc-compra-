import { useEffect,useState } from 'react'
import { AlertTriangle,ArrowLeft,BarChart3,CircleDollarSign,RefreshCw,ShieldCheck,ShoppingBag,Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { money } from '../utils/format'

type AdminData={
  generated_at:string
  environment:string
  metrics:{users:number;active_subscriptions:number;mrr:number;analyses_total:number;purchases_total:number;sold_total:number;resale_drafts:number;errors_24h:number;analyses_this_month:number}
  plans:{start:number;pro:number;max:number}
  users:{id:string;email:string;created_at:string;last_sign_in_at:string|null;owner:boolean;onboarding:boolean;plan:string;subscription_status:string;analyses_month:number;analyses_today:number;sale_generations_month:number;last_usage:string|null}[]
  recent_errors:{context:string;message:string;created_at:string;user_id:string|null}[]
}

export function AdminPage({onBack}:{onBack:()=>void}){
  const [data,setData]=useState<AdminData|null>(null)
  const [busy,setBusy]=useState(true)
  const [error,setError]=useState('')

  const load=async()=>{
    setBusy(true);setError('')
    const {data:d,error:e}=await supabase.functions.invoke('admin-overview',{body:{}})
    if(e||d?.error){setError(d?.error||e?.message||'Não foi possível carregar o painel.');setBusy(false);return}
    setData(d as AdminData);setBusy(false)
  }
  useEffect(()=>{void load()},[])

  return <div className="admin-page space-y-5">
    <div className="admin-page__top"><button onClick={onBack}><ArrowLeft size={15}/> Voltar</button><button onClick={load} disabled={busy}><RefreshCw size={14} className={busy?'animate-spin':''}/> Atualizar</button></div>
    <section className="admin-hero"><div><span className="premium-eyebrow text-emerald-400">PAINEL PROPRIETÁRIO</span><h2 className="font-display">Saúde do BRIKE RADAR.</h2><p>Usuários, assinaturas, consumo, erros e operação em uma visão que só a conta proprietária acessa.</p></div><span><ShieldCheck size={23}/></span></section>

    {error&&<div className="admin-error"><AlertTriangle size={15}/>{error}</div>}
    {data&&<>
      <div className="admin-metrics">
        <Metric icon={Users} label="Usuários" value={String(data.metrics.users)} hint={data.metrics.active_subscriptions+' assinaturas ativas'}/>
        <Metric icon={CircleDollarSign} label="MRR contratado" value={money(data.metrics.mrr)} hint={'ambiente '+data.environment}/>
        <Metric icon={BarChart3} label="Análises no mês" value={String(data.metrics.analyses_this_month)} hint={data.metrics.analyses_total+' salvas no total'}/>
        <Metric icon={ShoppingBag} label="Vendas registradas" value={String(data.metrics.sold_total)} hint={data.metrics.purchases_total+' compras'}/>
      </div>

      <section className="admin-plans glass rounded-[24px] p-5"><span className="premium-eyebrow text-blue-400">DISTRIBUIÇÃO DE PLANOS</span><div><b>Start <strong>{data.plans.start}</strong></b><b>Pro <strong>{data.plans.pro}</strong></b><b>Max <strong>{data.plans.max}</strong></b><b>Erros 24h <strong className={data.metrics.errors_24h?'is-risk':''}>{data.metrics.errors_24h}</strong></b></div></section>

      <section className="admin-users">
        <div className="admin-section-head"><div><span className="premium-eyebrow text-slate-500">CONTAS</span><h3 className="font-display">Uso e assinatura</h3></div><span>{data.users.length} exibidas</span></div>
        <div className="admin-user-table"><div className="admin-user-table__head"><span>Conta</span><span>Plano</span><span>Análises</span><span>Venda IA</span><span>Status</span></div>{data.users.map(u=><div key={u.id} className="admin-user-row"><div><strong>{u.email||'Sem e-mail'}</strong><small>{new Date(u.created_at).toLocaleDateString('pt-BR')}</small></div><span>{u.owner?'OWNER':u.plan.toUpperCase()}</span><span>{u.analyses_month} mês · {u.analyses_today} hoje</span><span>{u.sale_generations_month}</span><b className={u.subscription_status==='active'||u.subscription_status==='authorized'||u.owner?'is-ok':''}>{u.subscription_status}</b></div>)}</div>
      </section>

      <section className="admin-errors glass rounded-[24px] p-5"><span className="premium-eyebrow text-amber-400">ERROS RECENTES</span><h3 className="font-display">O que precisa ser investigado</h3>{data.recent_errors.length?<div>{data.recent_errors.map((e,i)=><article key={i}><strong>{e.context}</strong><p>{e.message}</p><small>{new Date(e.created_at).toLocaleString('pt-BR')}</small></article>)}</div>:<p className="admin-errors__empty">Nenhum erro recente registrado.</p>}</section>
    </>}
  </div>
}

function Metric({icon:Icon,label,value,hint}:{icon:any;label:string;value:string;hint:string}){return <div className="admin-metric"><span><Icon size={17}/></span><small>{label}</small><strong>{value}</strong><p>{hint}</p></div>}
