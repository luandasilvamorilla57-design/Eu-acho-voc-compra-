import { Activity,BarChart3,History,ListChecks,LogOut,PackageCheck,Sparkles } from 'lucide-react'
import { Brand } from '../Brand'
import type { View } from '../BottomNav'
import { signOutFast } from '../../services/sessionService'

export function DesktopSidebar({view,setView,radarCount=0}:{view:View;setView:(v:View)=>void;radarCount?:number}){
  const nav=[['dashboard','Painel',BarChart3],['radar','Ações',ListChecks],['new','Nova análise',Sparkles],['bought','Comprei',PackageCheck],['history','Histórico',History]] as const
  return <aside className="app-sidebar fixed inset-y-0 left-0 z-40 hidden w-[276px] border-r lg:flex lg:flex-col">
    <div className="sidebar-brand-zone"><Brand/></div>

    <div className="sidebar-nav">
      <span className="sidebar-nav__label">NAVEGAÇÃO</span>
      <div className="sidebar-nav__list">{nav.map(([k,label,Icon])=>{
        const active=view===k
        return <button key={k} onClick={()=>setView(k)} className={'sidebar-nav-item '+(active?'is-active':'')}>
          <span className="sidebar-nav-item__icon"><Icon size={18}/></span>
          <span className="sidebar-nav-item__label">{label}</span>
          {k==='radar'&&radarCount>0&&<b className="sidebar-alert-badge">{Math.min(99,radarCount)}</b>}
          {active&&<i className="sidebar-nav-item__active" aria-hidden="true"/>}
        </button>
      })}</div>
    </div>

    <div className="sidebar-footer">
      <div className="sidebar-radar-card">
        <div className="sidebar-radar-card__top"><span><i/> SISTEMA ONLINE</span><Activity size={14}/></div>
        <strong>Central de Ação</strong>
        <p>Pendências, estoque, negociações e próximos passos acompanhados em um único lugar.</p>
        <div className="sidebar-radar-card__line"><span/><b>{radarCount?radarCount+' alerta(s) ativo(s)':'Nenhuma pendência crítica'}</b></div>
      </div>
      <button onClick={()=>void signOutFast()} className="sidebar-logout"><LogOut size={16}/><span>Sair da conta</span></button>
    </div>
  </aside>
}
