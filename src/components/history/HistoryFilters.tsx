import { Download,Search } from 'lucide-react'

export function HistoryFilters({q,setQ,onExport}:{q:string;setQ:(v:string)=>void;onExport:()=>void}){
  return <section className="history-toolbar glass">
    <label className="history-search">
      <Search size={17}/>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar produto ou categoria..." aria-label="Buscar no histórico"/>
    </label>
    <button onClick={onExport} className="history-export"><Download size={16}/><span>Exportar CSV</span></button>
  </section>
}
