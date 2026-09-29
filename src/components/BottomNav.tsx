import { BarChart3,History,PackageCheck,Sparkles } from 'lucide-react'
export type View='dashboard'|'new'|'bought'|'history'

export function BottomNav({view,setView}:{view:View;setView:(v:View)=>void}){
  const items=[
    ['dashboard','Painel',BarChart3],
    ['new','Analisar',Sparkles],
    ['bought','Comprei',PackageCheck],
    ['history','Histórico',History]
  ] as const

  return <nav className="mobile-nav app-mobile-nav fixed inset-x-3 bottom-3 z-50 grid h-[76px] grid-cols-4 rounded-[24px] border p-2 shadow-2xl backdrop-blur-2xl lg:hidden">
    {items.map(([k,label,Icon])=>{
      const active=view===k
      return <button key={k} onClick={()=>setView(k)} className={`mobile-nav-item relative grid place-items-center content-center gap-1 rounded-[18px] text-[9px] font-semibold ${active?'is-active':''}`}>
        {active&&<span className={`absolute inset-0 rounded-[18px] ${k==='new'||k==='bought'?'mobile-nav-highlight':''}`}/>}
        <span className={`relative grid h-8 w-8 place-items-center rounded-2xl ${active&&(k==='new'||k==='bought')?'bg-emerald-400/12 text-emerald-300':''}`}><Icon size={18}/></span>
        <span className="relative">{label}</span>
      </button>
    })}
  </nav>
}
