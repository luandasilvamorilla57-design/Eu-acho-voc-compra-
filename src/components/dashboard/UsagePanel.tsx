import { BarChart3,Crown,Plus,Sparkles,Zap } from 'lucide-react'
import type { AccessStatus } from '../../hooks/usePlanAccess'

export function UsagePanel({status,onManage}:{status:AccessStatus;onManage:()=>void}){
  if(status.owner_access)return <section className="usage-panel usage-panel--owner">
    <div><span className="usage-panel__icon"><Crown size={19}/></span><div><span className="premium-eyebrow text-emerald-400">CONTA PROPRIETÁRIA</span><h3 className="font-display">Acesso ilimitado ativo.</h3><p>Sem franquia de análises, sem limite de recursos premium e sem cobrança.</p></div></div>
  </section>

  const remainingMonth=Math.max(0,status.analises_mes-status.usadas_mes)
  const remainingDay=Math.max(0,status.analises_dia-status.usadas_dia)
  const monthPct=status.analises_mes?Math.min(100,status.usadas_mes/status.analises_mes*100):0
  const salePct=status.geracoes_venda_mes?Math.min(100,status.usadas_venda_mes/status.geracoes_venda_mes*100):0
  const low=remainingMonth<=5||monthPct>=85

  return <section className={'usage-panel '+(low?'is-low':'')}>
    <div className="usage-panel__head"><div><span className="premium-eyebrow text-blue-400">SEU PLANO</span><h3 className="font-display">BRIKE {String(status.plano||'').toUpperCase()}</h3></div><button onClick={onManage}>Gerenciar <Zap size={14}/></button></div>
    <div className="usage-panel__grid">
      <Usage icon={BarChart3} label="Análises no mês" used={status.usadas_mes} total={status.analises_mes} pct={monthPct} hint={remainingMonth+' restantes'}/>
      <Usage icon={Sparkles} label="Hoje" used={status.usadas_dia} total={status.analises_dia} pct={status.analises_dia?status.usadas_dia/status.analises_dia*100:0} hint={remainingDay+' restantes hoje'}/>
      {status.geracoes_venda_mes>0&&<Usage icon={Zap} label="Preparar venda IA" used={status.usadas_venda_mes} total={status.geracoes_venda_mes} pct={salePct} hint="franquia premium"/>}
      <div className="usage-panel__credit"><span><Plus size={14}/> Créditos extras</span><strong>{status.creditos_extras}</strong><small>usados só depois da franquia mensal</small></div>
    </div>
    {low&&<button className="usage-panel__warning" onClick={onManage}><Plus size={14}/><span><strong>Suas análises estão acabando.</strong><small>Adicione +20 análises por R$6,90 sem trocar de plano.</small></span></button>}
  </section>
}

function Usage({icon:Icon,label,used,total,pct,hint}:{icon:any;label:string;used:number;total:number;pct:number;hint:string}){
  return <div className="usage-panel__usage"><div><Icon size={14}/><span>{label}</span><b>{used}/{total}</b></div><i><b style={{width:Math.min(100,pct)+'%'}}/></i><small>{hint}</small></div>
}
