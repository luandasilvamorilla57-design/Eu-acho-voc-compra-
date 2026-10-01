import { Clock3,History,TrendingUp,WalletCards } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'
import type { PurchaseRow } from '../../types/database'
import { daysBetween } from '../../utils/purchase'
import { money,pct } from '../../utils/format'

export function HistoricalBenchmark({a,purchases}:{a:AnalysisResult;purchases:PurchaseRow[]}){
  const category=(a.categoria||'').trim().toLowerCase()
  const sold=purchases.filter(p=>p.status==='vendido'&&p.preco_venda!=null)
  const comparable=sold.filter(p=>(p.categoria||'').trim().toLowerCase()===category)
  const sample=comparable.length?comparable:sold
  if(!sample.length)return null

  const avg=(values:number[])=>values.length?values.reduce((x,y)=>x+y,0)/values.length:0
  const avgRoi=avg(sample.map(p=>Number(p.roi_realizado||0)))
  const avgProfit=avg(sample.map(p=>Number(p.lucro_realizado||0)))
  const avgDays=avg(sample.filter(p=>p.data_venda).map(p=>daysBetween(p.data_compra,p.data_venda!)))
  const projected=Number(a.calculado.roi_percentual||0)
  const delta=projected-avgRoi
  const sameCategory=comparable.length>0

  return <section className="history-benchmark glass rounded-[24px] p-5 sm:p-6">
    <div className="history-benchmark__head">
      <div><span className="premium-eyebrow text-blue-400">SEU HISTÓRICO REAL</span><h3 className="font-display">Como esta oportunidade se compara ao que você já vendeu.</h3><p>{sameCategory?'Base: '+sample.length+' venda(s) na categoria '+a.categoria+'.':'Ainda não há venda em '+a.categoria+'; comparação feita com suas '+sample.length+' venda(s) concluída(s).'}</p></div>
      <span><History size={19}/></span>
    </div>
    <div className="history-benchmark__grid">
      <Metric icon={TrendingUp} label="ROI desta análise" value={pct(projected)} hint={delta>=0?pct(delta)+' acima da sua média':pct(Math.abs(delta))+' abaixo da sua média'} tone={delta>=0?'good':'warn'}/>
      <Metric icon={WalletCards} label="Seu lucro médio" value={money(avgProfit)} hint="nas vendas usadas na comparação"/>
      <Metric icon={Clock3} label="Seu giro médio" value={Math.round(avgDays)+' dias'} hint={sameCategory?'nesta categoria':'em todas as categorias'}/>
    </div>
    <small className="history-benchmark__note">Histórico ajuda a contextualizar; ele não garante que este item terá o mesmo resultado.</small>
  </section>
}

function Metric({icon:Icon,label,value,hint,tone}:{icon:any;label:string;value:string;hint:string;tone?:'good'|'warn'}){
  return <div className={'history-benchmark__metric '+(tone?'is-'+tone:'')}><Icon size={15}/><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
}
