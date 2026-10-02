import { BarChart3, History, ListChecks, PackageCheck } from 'lucide-react'

export type View='dashboard'|'radar'|'negotiate'|'new'|'bought'|'history'|'subscription'|'admin'

function AnalyzeIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 3H6.8A2.8 2.8 0 0 0 4 5.8V7M16 3h1.2A2.8 2.8 0 0 1 20 5.8V7M4 16v1.2A2.8 2.8 0 0 0 6.8 20H8M20 16v1.2A2.8 2.8 0 0 1 17.2 20H16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle
        cx="10.5"
        cy="10.5"
        r="4.2"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M13.7 13.7L18 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M8.9 11.8V10.1M10.5 11.8V8.7M12.1 11.8V9.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BottomNav({view,setView,radarCount=0}:{view:View;setView:(v:View)=>void;radarCount?:number}){
  const items=[
    ['dashboard','Painel',BarChart3],
    ['radar','Ações',ListChecks],
    ['new','Analisar',AnalyzeIcon],
    ['bought','Comprei',PackageCheck],
    ['history','Histórico',History]
  ] as const

  return <nav className="mobile-nav app-mobile-nav fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 lg:hidden">
    {items.map(([k,label,Icon])=>{
      const active=view===k||(k==='radar'&&view==='negotiate')
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
