import { BarChart3, History, LogOut, Sparkles } from 'lucide-react'
import { Brand } from '../Brand'
import type { View } from '../BottomNav'
import { supabase } from '../../lib/supabase'
export function DesktopSidebar({view,setView}:{view:View;setView:(v:View)=>void}){
 const nav=[['dashboard','Painel',BarChart3],['new','Nova análise',Sparkles],['history','Histórico',History]] as const
 return <aside className="fixed inset-y-0 left-0 z-40 hidden w-[262px] border-r border-slate-800/70 bg-[linear-gradient(180deg,rgba(8,19,33,.96),rgba(6,16,28,.94))] p-5 lg:flex lg:flex-col">
  <Brand/><div className="mt-10 grid gap-2">{nav.map(([k,label,Icon])=><button key={k} onClick={()=>setView(k)} className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm transition ${view===k?'bg-emerald-400/10 text-white ring-1 ring-emerald-400/15':'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'}`}><Icon size={18}/>{label}</button>)}</div>
  <div className="mt-auto rounded-[24px] border border-slate-800 bg-slate-900/40 p-4"><div className="text-[10px] font-bold tracking-[.18em] text-emerald-400">RADAR ATIVO</div><p className="mt-2 text-xs leading-5 text-slate-500">Preço, risco, liquidez e margem antes da negociação.</p></div>
  <button onClick={()=>supabase.auth.signOut()} className="mt-3 flex items-center gap-2 rounded-xl px-3 py-3 text-xs text-slate-500 hover:text-white"><LogOut size={16}/> Sair</button>
 </aside>
}
