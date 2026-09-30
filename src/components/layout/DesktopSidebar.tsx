import { BarChart3,History,LogOut,PackageCheck,Radar,Sparkles } from 'lucide-react'
import { Brand } from '../Brand'
import type { View } from '../BottomNav'
import { supabase } from '../../lib/supabase'

export function DesktopSidebar({view,setView,radarCount=0}:{view:View;setView:(v:View)=>void;radarCount?:number}){
 const nav=[['dashboard','Painel',BarChart3],['radar','Radar',Radar],['new','Nova análise',Sparkles],['bought','Comprei',PackageCheck],['history','Histórico',History]] as const
 return <aside className="app-sidebar fixed inset-y-0 left-0 z-40 hidden w-[262px] border-r p-5 lg:flex lg:flex-col">
  <Brand/>
  <div className="mt-10 grid gap-2">{nav.map(([k,label,Icon])=><button key={k} onClick={()=>setView(k)} className={'sidebar-nav-item flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm transition '+(view===k?'is-active':'')}><Icon size={18}/><span>{label}</span>{k==='radar'&&radarCount>0&&<b className="sidebar-alert-badge">{radarCount}</b>}</button>)}</div>
  <div className="sidebar-radar-card mt-auto rounded-[24px] border p-4"><div className="text-[10px] font-bold tracking-[.18em] text-emerald-400">RADAR ATIVO</div><p className="mt-2 text-xs leading-5 text-slate-500">Preço, risco, liquidez e margem antes da negociação.</p></div>
  <button onClick={()=>supabase.auth.signOut()} className="sidebar-logout mt-3 flex items-center gap-2 rounded-xl px-3 py-3 text-xs"><LogOut size={16}/> Sair</button>
 </aside>
}
