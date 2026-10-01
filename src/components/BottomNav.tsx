import { BarChart3,History,PackageCheck,Radar,Sparkles } from 'lucide-react'
export type View='dashboard'|'radar'|'new'|'bought'|'history'|'subscription'|'admin'

export function BottomNav({view,setView,radarCount=0}:{view:View;setView:(v:View)=>void;radarCount?:number}){
  const items=[
    ['dashboard','Painel',BarChart3],
    ['radar','Radar',Radar],
    ['new','Analisar',Sparkles],
    ['bought','Comprei',PackageCheck],
    ['history','Histórico',History]
  ] as const
  return <nav className="mobile-nav app-mobile-nav fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 lg:hidden">
    {items.map(([k,label,Icon])=>{
      const active=view===k
      const primary=k==='new'
      return <button key={k} onClick={()=>setView(k)} className={'mobile-nav-item '+(active?'is-active ':'')+(primary?'is-primary':'')}>
        <span className="mobile-nav-icon">
          <Icon size={primary?19:18}/>
          {k==='radar'&&radarCount>0&&<b className="nav-alert-badge">{Math.min(9,radarCount)}{radarCount>9?'+':''}</b>}
        </span>
        <span className="mobile-nav-label">{label}</span>
        {active&&<i className="mobile-nav-active-dot" aria-hidden="true"/>}
      </button>
    })}
  </nav>
}
