import {ArrowRight,CalendarDays,Check,ChevronRight,Clock3,CreditCard,Gift,LockKeyhole,RefreshCw,ShieldCheck,Sparkles,X} from 'lucide-react'
import type {ControlAccess} from './useControlAccess'

const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})

export function TrialBanner({access,onSubscribe,onOpen}:{access:ControlAccess;onSubscribe:()=>void;onOpen:()=>void}){
  if(access.is_admin||access.access_state==='active')return null
  const remaining=Math.max(0,access.days_remaining)
  const progress=Math.max(0,Math.min(100,(remaining/15)*100))
  const urgent=remaining<=3
  const ended=!access.can_write
  return <section
    className={ended?'cp-trial-banner is-ended':urgent?'cp-trial-banner is-urgent':'cp-trial-banner'}
    role="button"
    tabIndex={0}
    aria-label={ended?'Ver assinatura do CONTROLE+':'Ver detalhes do teste grátis'}
    onClick={onOpen}
    onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen()}}}
  >
    <div className="cp-trial-banner-copy">
      <span className="cp-trial-icon">{ended?<LockKeyhole/>:<Clock3/>}</span>
      <div>
        <b>{ended?'Seu teste grátis terminou':remaining===1?'1 dia grátis restante':remaining+' dias grátis restantes'}</b>
        <span>{ended?'Seus dados estão preservados. Toque para ver o plano.':'Toque aqui para entender os 15 dias grátis e a assinatura.'}</span>
      </div>
    </div>
    {!ended&&<div className="cp-trial-progress"><i style={{width:progress+'%'}}/></div>}
    <button onClick={e=>{e.stopPropagation();onSubscribe()}}>{money.format(access.monthly_price)}<small>/mês</small><ChevronRight/></button>
  </section>
}


function formatDate(value:string|null){
  if(!value)return '—'
  const date=new Date(value)
  if(Number.isNaN(date.getTime()))return '—'
  return date.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})
}
function addCalendarDays(value:string|null,days:number){
  if(!value)return null
  const d=new Date(value)
  if(Number.isNaN(d.getTime()))return null
  d.setDate(d.getDate()+days)
  return d.toISOString()
}

export function TrialInfoModal({
  access,busy,error,onClose,onSubscribe
}:{
  access:ControlAccess
  busy:boolean
  error:string|null
  onClose:()=>void
  onSubscribe:()=>void
}){
  const remaining=Math.max(0,access.days_remaining)
  const firstCharge=access.trial_ends_at
  const nextRenewal=addCalendarDays(firstCharge,30)
  const trialStart=access.trial_started_at
  const isExpired=!access.can_write
  const title=isExpired?'Seu teste terminou, mas seu negócio continua salvo.':'15 dias para usar tudo sem pagar.'
  return <div className="cp-trial-modal-layer" role="dialog" aria-modal="true" aria-label="Detalhes do teste grátis">
    <button className="cp-trial-modal-backdrop" onClick={onClose} aria-label="Fechar"/>
    <section className="cp-trial-modal-card">
      <button className="cp-trial-modal-close" onClick={onClose} aria-label="Fechar"><X/></button>

      <div className="cp-trial-modal-hero">
        <span className="cp-trial-modal-symbol"><Gift/></span>
        <div>
          <span className="cp-trial-modal-kicker">CONTROLE+ · TESTE COMPLETO</span>
          <h2>{title}</h2>
          <p>{isExpired
            ?'Produtos, vendas, fotos e histórico continuam preservados. Assine para voltar a registrar normalmente.'
            :'Você usa estoque, vendas, caixa, relatórios, acompanhamento de anúncios e o Guia do Brique sem limitar funções.'}</p>
        </div>
      </div>

      <div className="cp-trial-modal-price">
        <div><span>DEPOIS DO TESTE</span><strong>{money.format(access.monthly_price)}<small>/mês</small></strong></div>
        <p>Plano único. Todas as funções. Cancele quando quiser.</p>
      </div>

      {!isExpired&&<div className="cp-trial-timeline">
        <div className="cp-trial-step is-done">
          <span><Check/></span>
          <div><small>INÍCIO</small><b>Teste grátis começa</b><p>{formatDate(trialStart)} · acesso completo</p></div>
        </div>
        <div className="cp-trial-step">
          <span><CalendarDays/></span>
          <div><small>EM {remaining} DIA{remaining===1?'':'S'}</small><b>Primeira cobrança</b><p>{formatDate(firstCharge)} · {money.format(access.monthly_price)}</p></div>
        </div>
        <div className="cp-trial-step">
          <span><RefreshCw/></span>
          <div><small>30 DIAS DEPOIS</small><b>Próxima renovação</b><p>{formatDate(nextRenewal)} · mais 30 dias de acesso</p></div>
        </div>
      </div>}

      {!isExpired&&<div className="cp-trial-modal-highlight">
        <Clock3/>
        <div>
          <b>Assinar agora não corta seu período grátis.</b>
          <p>Você autoriza a assinatura hoje. A primeira cobrança fica para o fim dos 15 dias grátis; a renovação seguinte acontece 30 dias depois. Assinando no começo do teste, isso leva a próxima renovação para 45 dias após o início.</p>
        </div>
      </div>}

      <div className="cp-trial-modal-benefits">
        <span><Check/> Estoque com fotos</span>
        <span><Check/> Caixa e lucro real</span>
        <span><Check/> Acompanhamento de anúncios</span>
        <span><Check/> Relatórios e histórico</span>
      </div>

      {error&&<div className="cp-form-error">{error}</div>}

      <button className="cp-trial-modal-subscribe" disabled={busy} onClick={onSubscribe}>
        <CreditCard/>
        <span>{busy?'Abrindo Mercado Pago...':isExpired?'Assinar CONTROLE+ por '+money.format(access.monthly_price)+'/mês':'Assinar agora e manter meus dias grátis'}</span>
        {!busy&&<ArrowRight/>}
      </button>
      <button className="cp-trial-modal-later" onClick={onClose}>{isExpired?'Voltar':'Continuar usando grátis'}</button>

      <div className="cp-trial-modal-safe">
        <ShieldCheck/>
        <span>Pagamento processado pelo Mercado Pago. O CONTROLE+ não armazena os dados do seu cartão.</span>
      </div>
    </section>
  </div>
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
