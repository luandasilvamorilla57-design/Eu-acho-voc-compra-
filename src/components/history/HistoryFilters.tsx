import { Download,Search } from 'lucide-react'

export function HistoryFilters({q,setQ,onExport}:{q:string;setQ:(v:string)=>void;onExport:()=>void}){
  return <section className="glass rounded-[22px] p-4 sm:p-5">
    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
      <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3"><Search size={15} className="text-slate-600"/><input value={q} onChange={e=>setQ(e.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar produto ou categoria..."/></div>
      <button onClick={onExport} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 text-xs text-slate-400"><Download size={15}/> CSV</button>
    </div>
  </section>
}
