import { useState } from 'react'
import { AlertTriangle,ArrowRight,BellOff,BellRing,CheckCircle2,Clock3,Handshake,Lightbulb,ListChecks,PackageOpen,ShieldCheck,Sparkles,WalletCards } from 'lucide-react'
import type { AnaliseRow,PurchaseRow,RadarConfigRow } from '../types/database'
import type { RadarConfigPatch } from '../hooks/useRadarConfig'
import type { View } from '../components/BottomNav'
import type { RadarAlert } from '../utils/radarAlerts'
import type { UserInsight } from '../utils/userIntelligence'
import { money } from '../utils/format'
import { purchaseTotalCost } from '../utils/purchase'

type NotificationState=NotificationPermission|'unsupported'

export function RadarPage({
  analyses,purchases,config,alerts,insights,onNavigate,onOpen,onSaveConfig
}:{
  analyses:AnaliseRow[]
  purchases:PurchaseRow[]
  config:RadarConfigRow
  alerts:RadarAlert[]
  insights:UserInsight[]
  onNavigate:(v:View)=>void
  onOpen:(a:AnaliseRow)=>void
  onSaveConfig:(patch:RadarConfigPatch)=>Promise<void>
}){
  const stock=purchases.filter(p=>p.status!=='vendido')
  const capital=stock.reduce((s,p)=>s+purchaseTotalCost(p),0)
  const waiting=analyses.filter(a=>a.pipeline_status==='aguardando_negociacao').length
  const active=analyses
    .filter(a=>!['descartado','negociacao_falhou','comprado','vendido'].includes(a.pipeline_status))
    .sort((a,b)=>Number((b.analise_ia as any)?.calculado?.score_oportunidade??0)-Number((a.analise_ia as any)?.calculado?.score_oportunidade??0))
    .slice(0,3)
  const high=alerts.filter(a=>a.severity==='high').length
  const medium=alerts.filter(a=>a.severity==='medium').length
  const [notificationState,setNotificationState]=useState<NotificationState>(()=>typeof Notification==='undefined'?'unsupported':Notification.permission)
  const [notificationBusy,setNotificationBusy]=useState(false)

  const notificationActive=notificationState==='granted'&&config.notificacoes_ativas

  const enableNotifications=async()=>{
    if(typeof Notification==='undefined'){
      setNotificationState('unsupported')
      return
    }
    setNotificationBusy(true)
    try{
      const permission=await Notification.requestPermission()
      setNotificationState(permission)
      if(permission==='granted'){
        await onSaveConfig({notificacoes_ativas:true})
        if('serviceWorker' in navigator){
          const registration=await navigator.serviceWorker.ready
          await registration.showNotification('BRIKE RADAR · Central de Ação ativada',{
            body:'Vou avisar quando estoque, negociação ou capital precisarem da sua atenção.',
            icon:'/brike-icon.svg',
            tag:'brike-action-center-ready'
          })
        }
      }else{
        await onSaveConfig({notificacoes_ativas:false})
      }
    }finally{
      setNotificationBusy(false)
    }
  }

  const pauseNotifications=async()=>{
    setNotificationBusy(true)
    try{await onSaveConfig({notificacoes_ativas:false})}
    finally{setNotificationBusy(false)}
  }

  return <div className="action-hub space-y-4 lg:space-y-5">
    <section className="action-command">
      <div className="action-command__beam"/>
      <div className="relative">
        <span className="action-command__live"><i/> CENTRAL DE AÇÃO</span>
        <h2 className="font-display">Seu próximo passo, <span>sem esquecer nada.</span></h2>
        <p>Esta área acompanha o que você já está operando e transforma pendências em ações: estoque parado, capital preso, negociações sem resposta, fotos faltando e oportunidades que ainda pedem decisão.</p>
        <div className="action-command__chips">
          <span><PackageOpen size={13}/> Estoque</span>
          <span><Clock3 size={13}/> Negociações</span>
          <span><Sparkles size={13}/> Revenda</span>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <Quick icon={AlertTriangle} label="Ações pendentes" value={String(alerts.length)} tone={high?'red':medium?'amber':'green'}/>
      <Quick icon={PackageOpen} label="Capital no estoque" value={money(capital)}/>
      <Quick icon={Clock3} label="Negociações abertas" value={String(waiting)} tone="blue"/>
    </div>

    <section className="action-negotiation-launch">
      <div className="action-negotiation-launch__copy">
        <span>NÃO SABE NEGOCIAR?</span>
        <h3>Deixe o Radar conduzir a conversa <em>sem parecer IA.</em></h3>
        <p>Envie um print ou foto do produto. O Radar identifica o item, faz as perguntas certas, espera o momento de ofertar e continua respondendo conforme o vendedor reage.</p>
        <div>
          <span>Produto identificado pela imagem</span>
          <span>Respostas por print ou texto</span>
          <span>Desconto baseado em fatos</span>
        </div>
      </div>
      <button type="button" onClick={()=>onNavigate('negotiate')}><Handshake size={17}/> Abrir negociação <ArrowRight size={15}/></button>
    </section>

    <section className="action-notify">
      <div className="action-notify__main">
        <span className={'action-notify__icon '+(notificationActive?'is-on':'')}><BellRing size={21}/></span>
        <div>
          <div className="action-notify__title-row">
            <span className="premium-eyebrow text-emerald-400">AVISOS IMPORTANTES</span>
            <StatusPill state={notificationState} active={config.notificacoes_ativas}/>
          </div>
          <h3>Notificações da sua operação</h3>
          <p>Quando houver algo importante, a Central pode avisar no celular para você não deixar dinheiro parado nem negociação esfriar.</p>
        </div>
      </div>

      <div className="action-notify__triggers">
        <span>Estoque chegando no limite de giro</span>
        <span>Capital muito comprometido</span>
        <span>Negociação sem atualização</span>
        <span>Reserva ou revenda pedindo ação</span>
      </div>

      {notificationState==='denied'
        ?<div className="action-notify__denied"><BellOff size={16}/><p>As notificações estão bloqueadas pelo navegador. Libere a permissão do site nas configurações do navegador para receber os avisos.</p></div>
        :notificationState==='unsupported'
          ?<div className="action-notify__denied"><BellOff size={16}/><p>Este navegador não oferece notificações para a Central de Ação.</p></div>
          :notificationActive
            ?<button type="button" className="action-notify__button is-secondary" onClick={pauseNotifications} disabled={notificationBusy}><BellOff size={16}/>{notificationBusy?'Atualizando...':'Pausar notificações'}</button>
            :<button type="button" className="action-notify__button" onClick={enableNotifications} disabled={notificationBusy}><BellRing size={16}/>{notificationBusy?'Ativando...':'Ativar notificações'}</button>}
    </section>

    <section className="glass radar-alerts action-priorities rounded-[26px] p-5 sm:p-6">
      <div className="action-section-head">
        <div>
          <span className="premium-eyebrow text-emerald-400">O QUE FAZER AGORA</span>
          <h3 className="font-display operation-title">Suas prioridades de hoje</h3>
          <p>Comece pelo topo. A Central ordena primeiro o que pode prender mais dinheiro, perder uma negociação ou atrasar a revenda.</p>
        </div>
        <span className="operation-icon"><ListChecks size={19}/></span>
      </div>

      {alerts.length
        ?<div className="mt-4 grid gap-2">{alerts.slice(0,10).map(a=><button key={a.id} onClick={()=>onNavigate(a.view)} className={'radar-alert action-alert is-'+a.severity}>
          <span className="radar-alert__dot"/>
          <div>
            <small>{a.severity==='high'?'FAÇA AGORA':a.severity==='medium'?'ATENÇÃO':'LEMBRETE'}</small>
            <strong>{a.title}</strong>
            <p>{a.detail}</p>
            <em>{a.recommendation}</em>
          </div>
          <span>{a.action}<ArrowRight size={13}/></span>
        </button>)}</div>
        :<div className="radar-clean"><CheckCircle2 size={23}/><strong>Tudo em ordem por enquanto.</strong><p>Nenhum estoque crítico, reserva vencendo ou negociação esquecida. A Central continua acompanhando sua operação.</p></div>}
    </section>

    {active.length>0&&<section className="glass action-open rounded-[26px] p-5 sm:p-6">
      <div className="action-section-head">
        <div>
          <span className="premium-eyebrow text-blue-400">DECISÕES EM ABERTO</span>
          <h3 className="font-display operation-title">Negócios que ainda estão em jogo</h3>
          <p>Abra uma análise para retomar preço, risco e próximo passo antes de perder a oportunidade.</p>
        </div>
        <span className="operation-icon operation-icon--blue"><WalletCards size={19}/></span>
      </div>
      <div className="mt-4 grid gap-2 lg:grid-cols-3">{active.map((a,i)=><button key={a.id} onClick={()=>onOpen(a)} className="radar-opportunity action-opportunity">
        <span>#{i+1}</span>
        <div><strong>{a.titulo_anuncio}</strong><small>{a.categoria||'Sem categoria'}</small></div>
        <b>{Number((a.analise_ia as any)?.calculado?.score_oportunidade??0)}</b>
      </button>)}</div>
    </section>}

    <section className="glass action-learning rounded-[26px] p-5 sm:p-6">
      <div className="action-section-head">
        <div>
          <span className="premium-eyebrow text-amber-400">INTELIGÊNCIA DA SUA OPERAÇÃO</span>
          <h3 className="font-display operation-title">A ferramenta aprende com o seu jeito de comprar e vender.</h3>
          <p>Depois das vendas registradas, ela identifica seu giro, ROI, negociação e categorias que funcionam melhor para você.</p>
        </div>
        <span className="operation-icon operation-icon--blue"><Lightbulb size={19}/></span>
      </div>
      {insights.length
        ?<div className="mt-4 grid gap-3 lg:grid-cols-3">{insights.map(i=><div key={i.id} className={'radar-insight is-'+i.tone}><span>{i.eyebrow}</span><strong>{i.title}</strong><p>{i.detail}</p></div>)}</div>
        :<div className="radar-clean mt-4"><ShieldCheck size={21}/><strong>A inteligência ainda está formando seu histórico.</strong><p>Registre compras e vendas. A Central passa a mostrar seu ROI real, velocidade de giro, desconto médio e categorias mais fortes.</p></div>}
    </section>
  </div>
}

function StatusPill({state,active}:{state:NotificationState;active:boolean}){
  if(state==='unsupported')return <span className="action-notify__status is-off">Indisponível</span>
  if(state==='denied')return <span className="action-notify__status is-off">Bloqueadas</span>
  if(state==='granted'&&active)return <span className="action-notify__status is-on">Ativas</span>
  return <span className="action-notify__status">Desativadas</span>
}

function Quick({icon:Icon,label,value,tone='green'}:{icon:any;label:string;value:string;tone?:'green'|'blue'|'red'|'amber'}){
  return <div className={'radar-quick is-'+tone}><Icon size={17}/><span>{label}</span><strong>{value}</strong></div>
}
