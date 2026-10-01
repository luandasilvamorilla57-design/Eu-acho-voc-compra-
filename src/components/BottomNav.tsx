import { BarChart3,History,PackageCheck,Radar } from 'lucide-react'
export type View='dashboard'|'radar'|'new'|'bought'|'history'|'subscription'|'admin'

function AnalyzeIcon({size=28}:{size?:number}){
  return (
    <svg
      className="analyze-nav-glyph"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="analyze-nav-gradient" x1="5" y1="4" x2="27" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#78F4D5"/>
          <stop offset=".52" stopColor="#43DDC7"/>
          <stop offset="1" stopColor="#2BC6D7"/>
        </linearGradient>
      </defs>

      <path d="M10 4H7.8A3.8 3.8 0 0 0 4 7.8V10M22 4h2.2A3.8 3.8 0 0 1 28 7.8V10M4 22v2.2A3.8 3.8 0 0 0 7.8 28H10M28 22v2.2a3.8 3.8 0 0 1-3.8 3.8H22"
        stroke="url(#analyze-nav-gradient)" strokeWidth="2.35" strokeLinecap="round"/>

      <circle cx="14.1" cy="14.3" r="6.6"
        stroke="url(#analyze-nav-gradient)" strokeWidth="2.35"/>

      <path d="M18.9 19.1 24 24.2"
        stroke="url(#analyze-nav-gradient)" strokeWidth="2.6" strokeLinecap="round"/>

      <path d="M10.8 16.8v-2.4M14.1 16.8v-4.2M17.4 16.8v-6.1"
        stroke="url(#analyze-nav-gradient)" strokeWidth="2.15" strokeLinecap="round"/>
    </svg>
  )
}

export function BottomNav({view,setView,radarCount=0}:{view:View;setView:(v:View)=>void;radarCount?:number}){
  const items=[
    ['dashboard','Painel',BarChart3],
    ['radar','Radar',Radar],
    ['new','Analisar',AnalyzeIcon],
    ['bought','Comprei',PackageCheck],
    ['history','Histórico',History]
  ] as const
  return <nav className="mobile-nav app-mobile-nav fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 lg:hidden">
    {items.map(([k,label,Icon])=>{
      const active=view===k
      const primary=k==='new'
      return <button key={k} onClick={()=>setView(k)} className={'mobile-nav-item '+(active?'is-active ':'')+(primary?'is-primary':'')}>
        <span className="mobile-nav-icon">
          <Icon size={primary?28:18}/>
          {k==='radar'&&radarCount>0&&<b className="nav-alert-badge">{Math.min(9,radarCount)}{radarCount>9?'+':''}</b>}
        </span>
        <span className="mobile-nav-label">{label}</span>
        {active&&<i className="mobile-nav-active-dot" aria-hidden="true"/>}
      </button>
    })}
  </nav>
}
