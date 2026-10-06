import {Check,ChevronRight,Clock3,CreditCard,LockKeyhole,RefreshCw,ShieldCheck,Sparkles} from 'lucide-react'
import type {ControlAccess} from './useControlAccess'

const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})

export function TrialBanner({access,onSubscribe}:{access:ControlAccess;onSubscribe:()=>void}){
  if(access.is_admin||access.access_state==='active')return null
  const remaining=Math.max(0,access.days_remaining)
  const progress=Math.max(0,Math.min(100,(remaining/15)*100))
  const urgent=remaining<=3
  const ended=!access.can_write
  return <section className={ended?'cp-trial-banner is-ended':urgent?'cp-trial-banner is-urgent':'cp-trial-banner'}>
    <div className="cp-trial-banner-copy">
      <span className="cp-trial-icon">{ended?<LockKeyhole/>:<Clock3/>}</span>
      <div>
        <b>{ended?'Seu teste grátis terminou':remaining===1?'1 dia grátis restante':remaining+' dias grátis restantes'}</b>
        <span>{ended?'Seus dados estão preservados. Assine para continuar registrando.':'CONTROLE+ completo durante o período de teste.'}</span>
      </div>
    </div>
    {!ended&&<div className="cp-trial-progress"><i style={{width:progress+'%'}}/></div>}
    <button onClick={onSubscribe}>{money.format(access.monthly_price)}<small>/mês</small><ChevronRight/></button>
  </section>
}

export function SubscriptionGate({
  access,products,sales,stockValue,onSubscribe,onRefresh,onReadOnly,busy,error
}:{
  access:ControlAccess
  products:number
  sales:number
  stockValue:number
  onSubscribe:()=>void
  onRefresh:()=>void
  onReadOnly:()=>void
  busy:boolean
  error:string|null
}){
  const pending=access.access_state==='pending'
  const pastDue=access.access_state==='past_due'
  return <div className="cp-subscription-page">
    <section className="cp-subscription-card">
      <span className="cp-subscription-symbol"><ShieldCheck/></span>
      <span className="cp-subscription-kicker">{pending?'PAGAMENTO EM PROCESSAMENTO':pastDue?'PAGAMENTO PENDENTE':'15 DIAS CONCLUÍDOS'}</span>
      <h1>{pending?'Estamos confirmando sua assinatura.':pastDue?'Regularize para continuar usando.':'Seu negócio continua aqui.'}</h1>
      <p>{pending?'Assim que o Mercado Pago confirmar, o acesso é liberado automaticamente.':'Nada foi apagado. Estoque, vendas, fotos e histórico continuam salvos na sua conta.'}</p>

      <div className="cp-subscription-price">
        <span>CONTROLE+ COMPLETO</span>
        <strong>{money.format(access.monthly_price)}<small>/mês</small></strong>
        <p>Um único plano. Todas as funções. Cancele quando quiser.</p>
      </div>

      <div className="cp-subscription-benefits">
        <span><Check/> Estoque com fotos e acompanhamento de anúncios</span>
        <span><Check/> Compras, vendas, caixa e lucro real</span>
        <span><Check/> Contas a receber, relatórios e histórico</span>
        <span><Check/> Seus dados permanecem salvos</span>
      </div>

      <div className="cp-subscription-preserved">
        <div><span>Produtos salvos</span><b>{products}</b></div>
        <div><span>Vendas salvas</span><b>{sales}</b></div>
        <div><span>Capital em estoque</span><b>{money.format(stockValue)}</b></div>
      </div>

      {error&&<div className="cp-form-error">{error}</div>}

      <button className="cp-subscribe-main" disabled={busy} onClick={onSubscribe}>
        <CreditCard/>{busy?'Abrindo pagamento...':pending?'Abrir pagamento novamente':'Continuar por '+money.format(access.monthly_price)+'/mês'}
      </button>
      {pending&&<button className="cp-subscribe-refresh" disabled={busy} onClick={onRefresh}><RefreshCw/> Já paguei · atualizar status</button>}
      <button className="cp-subscribe-readonly" onClick={onReadOnly}>Ver meus dados em modo leitura</button>

      <div className="cp-subscription-safe"><LockKeyhole/><span>Pagamento processado pelo Mercado Pago. O CONTROLE+ não armazena os dados do seu cartão.</span></div>
    </section>
  </div>
}

export function ActivePlanCard({access,onCancel,busy}:{access:ControlAccess;onCancel:()=>void;busy:boolean}){
  if(access.is_admin)return <div className="cp-plan-status is-admin"><Sparkles/><div><b>Acesso administrador</b><span>Sua conta proprietária não precisa de assinatura.</span></div></div>
  if(access.access_state==='trial')return <div className="cp-plan-status"><Clock3/><div><b>Teste grátis · {access.days_remaining} dia(s) restantes</b><span>Depois, {money.format(access.monthly_price)}/mês.</span></div></div>
  if(access.access_state==='active')return <div className="cp-plan-status is-active"><ShieldCheck/><div><b>CONTROLE+ ativo</b><span>{access.valid_until?'Acesso válido até '+new Date(access.valid_until).toLocaleDateString('pt-BR'):'Assinatura mensal ativa'}</span></div>{access.subscription_status!=='cancelled'&&<button disabled={busy} onClick={onCancel}>Cancelar renovação</button>}</div>
  return null
}
