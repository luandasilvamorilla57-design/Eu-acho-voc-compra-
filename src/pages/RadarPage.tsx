import { AlertTriangle,ArrowRight,CheckCircle2,Clock3,Lightbulb,PackageOpen,Radar,ShieldCheck } from 'lucide-react'
import type { AnaliseRow,PurchaseRow,RadarConfigRow } from '../types/database'
import type { View } from '../components/BottomNav'
import type { RadarAlert } from '../utils/radarAlerts'
import type { UserInsight } from '../utils/userIntelligence'
import { money } from '../utils/format'
import { purchaseTotalCost } from '../utils/purchase'

export function RadarPage({analyses,purchases,config,alerts,insights,onNavigate,onOpen}:{analyses:AnaliseRow[];purchases:PurchaseRow[];config:RadarConfigRow;alerts:RadarAlert[];insights:UserInsight[];onNavigate:(v:View)=>void;onOpen:(a:AnaliseRow)=>void}){
  const stock=purchases.filter(p=>p.status!=='vendido')
  const capital=stock.reduce((s,p)=>s+purchaseTotalCost(p),0)
  const waiting=analyses.filter(a=>a.pipeline_status==='aguardando_negociacao').length
  const active=analyses.filter(a=>!['descartado','negociacao_falhou','comprado','vendido'].includes(a.pipeline_status)).sort((a,b)=>Number((b.analise_ia as any)?.calculado?.score_oportunidade??0)-Number((a.analise_ia as any)?.calculado?.score_oportunidade??0)).slice(0,3)

  return <div className="space-y-4 lg:space-y-5">
    <section className="radar-command">
      <div className="radar-command__beam"/>
      <div className="relative"><div className="flex items-center gap-2"><span className="radar-command__live"><i/> RADAR OPERACIONAL</span></div><h2 className="font-display mt-4 text-[34px] font-extrabold leading-[1.03] tracking-[-.055em] sm:text-5xl">O que precisa da sua atenção <span>agora.</span></h2><p className="mt-3 max-w-2xl text-[13px] leading-6 text-slate-400">Estoque parado, capital preso, negociações esperando resposta e sinais que podem melhorar seu próximo negócio.</p></div>
    </section>

    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <Quick icon={AlertTriangle} label="Alertas" value={String(alerts.length)} tone={alerts.some(a=>a.severity==='high')?'red':'green'}/>
      <Quick icon={PackageOpen} label="Capital no estoque" value={money(capital)}/>
      <Quick icon={Clock3} label="Negociações abertas" value={String(waiting)} tone="blue"/>
    </div>

    <section className="glass radar-alerts rounded-[26px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><span className="premium-eyebrow text-emerald-400">CENTRAL DE AÇÃO</span><h3 className="font-display mt-1.5 text-xl font-bold operation-title">Prioridades do Radar</h3></div><span className="operation-icon"><Radar size={18}/></span></div>
      {alerts.length?<div className="mt-4 grid gap-2">{alerts.slice(0,10).map(a=><button key={a.id} onClick={()=>onNavigate(a.view)} className={'radar-alert is-'+a.severity}><span className="radar-alert__dot"/><div><strong>{a.title}</strong><p>{a.detail}</p></div><span>{a.action}<ArrowRight size={12}/></span></button>)}</div>:<div className="radar-clean"><CheckCircle2 size={22}/><strong>Radar limpo por enquanto.</strong><p>Nenhum item parado, reserva vencendo ou negociação esquecida.</p></div>}
    </section>

    {active.length>0&&<section className="glass rounded-[26px] p-5 sm:p-6"><span className="premium-eyebrow text-blue-400">OPORTUNIDADES ABERTAS</span><h3 className="font-display mt-1.5 text-xl font-bold operation-title">As melhores leituras ainda em jogo</h3><div className="mt-4 grid gap-2 lg:grid-cols-3">{active.map((a,i)=><button key={a.id} onClick={()=>onOpen(a)} className="radar-opportunity"><span>#{i+1}</span><div><strong>{a.titulo_anuncio}</strong><small>{a.categoria||'Sem categoria'}</small></div><b>{Number((a.analise_ia as any)?.calculado?.score_oportunidade??0)}</b></button>)}</div></section>}

    <section className="glass rounded-[26px] p-5 sm:p-6">
      <div className="flex items-start justify-between"><div><span className="premium-eyebrow text-amber-400">APRENDIZADO REAL</span><h3 className="font-display mt-1.5 text-xl font-bold operation-title">O Radar está aprendendo com seus negócios.</h3><p className="mt-2 text-[12px] leading-5 text-slate-500">Esses padrões vêm das compras e vendas que você realmente registrou.</p></div><span className="operation-icon operation-icon--blue"><Lightbulb size={18}/></span></div>
      {insights.length?<div className="mt-4 grid gap-3 lg:grid-cols-3">{insights.map(i=><div key={i.id} className={'radar-insight is-'+i.tone}><span>{i.eyebrow}</span><strong>{i.title}</strong><p>{i.detail}</p></div>)}</div>:<div className="radar-clean mt-4"><ShieldCheck size={20}/><strong>Ainda faltam vendas concluídas.</strong><p>Depois das primeiras vendas, o Radar passa a mostrar seu ROI, giro e categorias mais fortes.</p></div>}
    </section>
  </div>
}
function Quick({icon:Icon,label,value,tone='green'}:{icon:any;label:string;value:string;tone?:'green'|'blue'|'red'}){return <div className={'radar-quick is-'+tone}><Icon size={16}/><span>{label}</span><strong>{value}</strong></div>}
