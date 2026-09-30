import { BarChart3,History,PackageCheck,Radar,Sparkles } from 'lucide-react'
export type View='dashboard'|'radar'|'new'|'bought'|'history'

export function BottomNav({view,setView,radarCount=0}:{view:View;setView:(v:View)=>void;radarCount?:number}){
  const items=[
    ['dashboard','Painel',BarChart3],
    ['radar','Radar',Radar],
    ['new','Analisar',Sparkles],
    ['bought','Comprei',PackageCheck],
    ['history','Histórico',History]
  ] as const
  return <nav className="mobile-nav app-mobile-nav fixed inset-x-3 bottom-3 z-50 grid h-[82px] grid-cols-5 rounded-[27px] border p-2 shadow-2xl backdrop-blur-2xl lg:hidden">
    {items.map(([k,label,Icon])=>{const active=view===k;return <button key={k} onClick={()=>setView(k)} className={'mobile-nav-item relative grid place-items-center content-center gap-1 rounded-[20px] font-semibold '+(active?'is-active':'')}>
      {active&&<span className={'absolute inset-0 rounded-[20px] '+(k==='new'||k==='radar'?'mobile-nav-highlight':'')}/>}
      <span className={'mobile-nav-icon relative grid h-9 w-9 place-items-center rounded-2xl '+(active&&(k==='new'||k==='radar')?'bg-emerald-400/12 text-emerald-300':'')}><Icon size={18}/>{k==='radar'&&radarCount>0&&<b className="nav-alert-badge">{Math.min(9,radarCount)}{radarCount>9?'+':''}</b>}</span>
      <span className="mobile-nav-label relative">{label}</span>
    </button>})}
  </nav>
}
