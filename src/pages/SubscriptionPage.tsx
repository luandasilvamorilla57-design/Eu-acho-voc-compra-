import { useMemo,useState } from 'react'
import { ArrowLeft,CalendarDays,Check,Crown,Plus,RefreshCw,ShieldCheck,XCircle } from 'lucide-react'
import type { AccessStatus } from '../hooks/usePlanAccess'
import type { AccountPlan } from '../types/database'
import { supabase } from '../lib/supabase'
import { money } from '../utils/format'

const plans=[
  {id:'start' as const,name:'Start',price:9.90,month:40,day:7,sales:0},
  {id:'pro' as const,name:'Pro',price:19.90,month:120,day:15,sales:20},
  {id:'max' as const,name:'Max',price:34.90,month:300,day:30,sales:60},
]

export function SubscriptionPage({status,onBack,onRefresh}:{status:AccessStatus;onBack:()=>void;onRefresh:()=>Promise<boolean>}){
  const [busy,setBusy]=useState('')
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const current=useMemo(()=>plans.find(p=>p.id===status.plano),[status.plano])

  const invoke=async(name:string,body:any)=>{
    setError('');setMessage('');setBusy(name)
    try{
      const {data,error:e}=await supabase.functions.invoke(name,{body})
      if(e)throw e
      if(data?.error)throw new Error(data.error)
      return data
    }finally{setBusy('')}
  }

  const buyExtra=async()=>{
    try{
      const data=await invoke('comprar-creditos',{pacote:'extra20'})
      if(data?.no_need){setMessage(data.message||'Sua conta já é ilimitada.');return}
      if(!data?.checkout_url)throw new Error('Checkout indisponível.')
      window.location.assign(data.checkout_url)
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível abrir o pagamento.')}
  }

  const changePlan=async(plan:AccountPlan)=>{
    if(plan===status.plano)return
    const target=plans.find(p=>p.id===plan)
    const source=current
    const isUpgrade=Boolean(source&&target&&target.price>source.price)
    const difference=source&&target?Math.max(0,target.price-source.price):0
    const prompt=isUpgrade
      ? 'Fazer upgrade para '+plan.toUpperCase()+'? Você pagará '+money(difference)+' agora. A próxima renovação será de '+money(target!.price)+'.'
      : 'Trocar para o plano '+plan.toUpperCase()+'?'
    if(!confirm(prompt))return

    try{
      const data=await invoke('gerenciar-assinatura',{action:'change_plan',plano:plan})
      if(data?.requires_payment&&data?.checkout_url){
        window.location.assign(data.checkout_url)
        return
      }
      setMessage(data?.downgrade
        ? 'Plano alterado para BRIKE '+String(data?.plano||plan).toUpperCase()+'.'
        : 'Alteração processada.')
      await onRefresh()
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível trocar o plano.')}
  }

  const cancel=async()=>{
    if(!confirm('Cancelar a renovação automática? Seu acesso continua até o fim do período já pago, quando essa informação estiver disponível.'))return
    try{
      await invoke('gerenciar-assinatura',{action:'cancel'})
      setMessage('Renovação cancelada. Seu acesso válido permanece conforme o período pago.')
      await onRefresh()
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível cancelar a assinatura.')}
  }

  const refresh=async()=>{setBusy('refresh');setError('');await onRefresh();setBusy('')}

  if(status.owner_access)return <div className="subscription-page">
    <button onClick={onBack} className="subscription-back"><ArrowLeft size={15}/> Voltar</button>
    <section className="subscription-owner"><span><Crown size={24}/></span><div><span className="premium-eyebrow text-emerald-400">CONTA PROPRIETÁRIA</span><h2 className="font-display">Acesso total e ilimitado.</h2><p>Esta conta ignora limites de plano, análises, Preparar venda com IA e cobranças.</p></div></section>
  </div>

  const remaining=Math.max(0,status.analises_mes-status.usadas_mes)
  return <div className="subscription-page space-y-5">
    <button onClick={onBack} className="subscription-back"><ArrowLeft size={15}/> Voltar ao painel</button>

    <section className="subscription-hero">
      <div><span className="premium-eyebrow text-emerald-400">MINHA ASSINATURA</span><h2 className="font-display">BRIKE {String(status.plano||'').toUpperCase()}</h2><p>Controle sua franquia, créditos extras e renovação sem precisar falar com suporte.</p></div>
      <span className="subscription-hero__icon"><ShieldCheck size={22}/></span>
    </section>

    <div className="subscription-summary">
      <div><span>Plano atual</span><strong>{current?money(current.price)+'/mês':'—'}</strong><small>{status.assinatura_status||'ativo'}</small></div>
      <div><span>Análises restantes</span><strong>{remaining}</strong><small>{status.usadas_mes} de {status.analises_mes} usadas</small></div>
      <div><span>Créditos extras</span><strong>{status.creditos_extras}</strong><small>entram depois da franquia mensal</small></div>
      <div><span>Próxima cobrança</span><strong>{status.proxima_cobranca?new Date(status.proxima_cobranca).toLocaleDateString('pt-BR'):'—'}</strong><small>{status.gateway?status.gateway.replace('_',' '):'gateway'}</small></div>
    </div>

    <section className="extra-credit-card">
      <div><span className="extra-credit-card__icon"><Plus size={20}/></span><div><span className="premium-eyebrow text-cyan-400">PACOTE AVULSO</span><h3>+20 análises</h3><p>Use quando acabar sua franquia mensal sem precisar mudar de plano. O limite diário continua valendo.</p></div></div>
      <div className="extra-credit-card__price"><strong>R$ 6,90</strong><button onClick={buyExtra} disabled={!!busy}>{busy==='comprar-creditos'?'Abrindo pagamento...':'Adicionar 20 análises'}</button></div>
    </section>

    <section className="subscription-plans">
      <div className="subscription-section-head"><div><span className="premium-eyebrow text-slate-500">TROCAR PLANO</span><h3 className="font-display">Escolha o volume que combina com seu brique.</h3></div></div>
      <div className="subscription-plan-grid">{plans.map(p=><article key={p.id} className={p.id===status.plano?'is-current':''}>
        <div><span>{p.name}</span>{p.id===status.plano&&<b><Check size={11}/> ATUAL</b>}</div>
        <strong>{money(p.price)}<small>/mês</small></strong>
        <p>{p.month} análises/mês · {p.day}/dia</p>
        <p>{p.sales?p.sales+' preparações de venda IA/mês':'Anúncio Inteligente bloqueado'}</p>
        <button disabled={p.id===status.plano||!!busy} onClick={()=>changePlan(p.id)}>{p.id===status.plano?'Seu plano':current&&p.price>current.price?'Fazer upgrade para '+p.name:'Mudar para '+p.name}</button>
      </article>)}</div>
    </section>

    <section className="subscription-danger">
      <div><XCircle size={17}/><div><strong>Cancelar renovação</strong><p>Use somente se não quiser a próxima cobrança recorrente.</p></div></div>
      <button onClick={cancel} disabled={!!busy}>{busy==='gerenciar-assinatura'?'Processando...':'Cancelar assinatura'}</button>
    </section>

    <div className="subscription-refresh"><button onClick={refresh} disabled={!!busy}><RefreshCw size={13} className={busy==='refresh'?'animate-spin':''}/> Atualizar status</button><span><CalendarDays size={12}/> O status é confirmado pelo servidor e pelo gateway.</span></div>
    {message&&<div className="subscription-message is-good"><Check size={14}/>{message}</div>}
    {error&&<div className="subscription-message is-bad"><XCircle size={14}/>{error}</div>}
  </div>
}
