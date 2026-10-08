import {ArrowLeft,ArrowRight,BarChart3,Clock3,Crown,Medal,Sparkles,Target,TrendingUp,Trophy} from 'lucide-react'
import type {Product,Sale,SaleItem} from './types'

type RankItem={
  key:string
  label:string
  revenue:number
  cost:number
  profit:number
  units:number
  orders:number
  profitPerUnit:number
  margin:number
  avgDays:number|null
}

const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})
const number=new Intl.NumberFormat('pt-BR')

function titleCase(value:string){
  return value
    .trim()
    .replace(/[_-]+/g,' ')
    .replace(/\s+/g,' ')
    .replace(/\b\w/g,m=>m.toUpperCase())
}

function categoryOf(product:Product){
  const text=((product.category||'')+' '+product.name).toLowerCase()
  if(/iphone/.test(text))return 'iPhones'
  if(/xbox/.test(text))return 'Xbox'
  if(/playstation|\bps\s?2\b|\bps\s?3\b|\bps\s?4\b|\bps\s?5\b/.test(text))return 'PlayStation'
  if(/tv|televis/.test(text))return 'Televisões'
  if(/bike|bicic/.test(text))return 'Bicicletas'
  if(/notebook|computador|\bpc\b/.test(text))return 'Computadores'
  if(/moto/.test(text))return 'Motos'
  if(/carro|veículo|veiculo/.test(text))return 'Carros'
  if(/furadeira|parafusadeira|ferrament/.test(text))return 'Ferramentas'
  if(/celular|smartphone|samsung|motorola|xiaomi/.test(text))return 'Celulares'
  if(/fone|airpods|headset/.test(text))return 'Áudio'
  if(/relógio|relogio|watch/.test(text))return 'Smartwatches'
  const category=(product.category||'').trim()
  return category?titleCase(category):'Outros'
}

function daysBetween(a:string,b:string){
  const start=new Date(a+'T12:00:00').getTime()
  const end=new Date(b+'T12:00:00').getTime()
  if(!Number.isFinite(start)||!Number.isFinite(end))return null
  return Math.max(0,Math.round((end-start)/86400000))
}

export function buildPersonalRanking(products:Product[],sales:Sale[],saleItems:SaleItem[]){
  const productMap=new Map(products.map(p=>[p.id,p]))
  const saleMap=new Map(sales.filter(s=>s.status==='completed').map(s=>[s.id,s]))
  const groups=new Map<string,{
    label:string
    revenue:number
    cost:number
    profit:number
    units:number
    orders:Set<string>
    weightedDays:number
    daysUnits:number
  }>()

  for(const item of saleItems){
    const sale=saleMap.get(item.sale_id)
    const product=productMap.get(item.product_id)
    if(!sale||!product)continue
    const label=categoryOf(product)
    const key=label.toLowerCase()
    const row=groups.get(key)||{
      label,revenue:0,cost:0,profit:0,units:0,orders:new Set<string>(),weightedDays:0,daysUnits:0
    }
    const revenue=item.unit_price*item.quantity
    const cost=item.unit_cost_snapshot*item.quantity
    row.revenue+=revenue
    row.cost+=cost
    row.profit+=revenue-cost
    row.units+=item.quantity
    row.orders.add(item.sale_id)
    const days=daysBetween(product.purchase_date,sale.sale_date)
    if(days!==null){
      row.weightedDays+=days*item.quantity
      row.daysUnits+=item.quantity
    }
    groups.set(key,row)
  }

  const rows:RankItem[]=[...groups.entries()].map(([key,row])=>({
    key,
    label:row.label,
    revenue:row.revenue,
    cost:row.cost,
    profit:row.profit,
    units:row.units,
    orders:row.orders.size,
    profitPerUnit:row.units?row.profit/row.units:0,
    margin:row.revenue?row.profit/row.revenue*100:0,
    avgDays:row.daysUnits?row.weightedDays/row.daysUnits:null
  }))

  rows.sort((a,b)=>b.profit-a.profit||b.revenue-a.revenue)

  const fastest=[...rows].filter(r=>r.avgDays!==null&&r.units>0).sort((a,b)=>(a.avgDays||0)-(b.avgDays||0))[0]||null
  const bestMargin=[...rows].filter(r=>r.revenue>0).sort((a,b)=>b.margin-a.margin)[0]||null
  const bestUnit=[...rows].filter(r=>r.units>0).sort((a,b)=>b.profitPerUnit-a.profitPerUnit)[0]||null
  const totalProfit=rows.reduce((s,r)=>s+r.profit,0)
  const totalRevenue=rows.reduce((s,r)=>s+r.revenue,0)
  const totalUnits=rows.reduce((s,r)=>s+r.units,0)

  return {rows,fastest,bestMargin,bestUnit,totalProfit,totalRevenue,totalUnits}
}

function medalFor(index:number){
  if(index===0)return <Crown/>
  if(index===1)return <Medal/>
  return <Trophy/>
}

export function PersonalRankingCard({
  products,sales,saleItems,onOpen
}:{
  products:Product[]
  sales:Sale[]
  saleItems:SaleItem[]
  onOpen:()=>void
}){
  const ranking=buildPersonalRanking(products,sales,saleItems)
  const top=ranking.rows.slice(0,3)

  if(!ranking.totalUnits){
    return <section className="cp-ranking-preview cp-ranking-preview--empty">
      <div className="cp-ranking-preview-icon"><Sparkles/></div>
      <div className="cp-ranking-preview-copy">
        <span>INTELIGÊNCIA DO SEU BRIQUE</span>
        <h2>O CONTROLE+ vai descobrir onde você ganha mais.</h2>
        <p>Depois das primeiras vendas, ele compara lucro, giro e margem por categoria e monta seu ranking pessoal.</p>
      </div>
      <div className="cp-ranking-empty-progress"><i/><i/><i/></div>
    </section>
  }

  const leader=top[0]
  return <button className="cp-ranking-preview" onClick={onOpen}>
    <div className="cp-ranking-preview-head">
      <div>
        <span>SEU RANKING PESSOAL</span>
        <h2>Onde seu dinheiro rende mais</h2>
      </div>
      <span className="cp-ranking-preview-arrow"><ArrowRight/></span>
    </div>

    <div className="cp-ranking-leader">
      <span className="cp-ranking-leader-medal"><Crown/></span>
      <div>
        <small>CAMPEÃ DE LUCRO</small>
        <b>{leader.label}</b>
        <p>{money.format(leader.profit)} de lucro · {leader.units} item(ns) vendido(s)</p>
      </div>
      <strong>{money.format(leader.profitPerUnit)}<small>/item</small></strong>
    </div>

    <div className="cp-ranking-mini-podium">
      {top.map((item,index)=><div key={item.key} className={'rank-'+(index+1)}>
        <span>{index+1}º</span>
        <b>{item.label}</b>
        <strong>{money.format(item.profit)}</strong>
      </div>)}
    </div>

    <div className="cp-ranking-insight">
      <Sparkles/>
      <span>{ranking.fastest
        ?ranking.fastest.label+' é seu giro mais rápido'+(ranking.fastest.avgDays!==null?' · média de '+Math.round(ranking.fastest.avgDays)+' dia(s) para vender.':'')
        :'Continue registrando vendas para o ranking ficar cada vez mais inteligente.'}</span>
    </div>
  </button>
}

export function PersonalRankingPage({
  products,sales,saleItems,onBack
}:{
  products:Product[]
  sales:Sale[]
  saleItems:SaleItem[]
  onBack:()=>void
}){
  const ranking=buildPersonalRanking(products,sales,saleItems)
  const top=ranking.rows.slice(0,3)

  return <div className="cp-page cp-ranking-page">
    <section className="cp-ranking-hero">
      <button className="cp-ranking-back" onClick={onBack}><ArrowLeft/></button>
      <div>
        <span>INTELIGÊNCIA DO SEU BRIQUE</span>
        <h1>Seu histórico já sabe onde você ganha mais.</h1>
        <p>O ranking usa somente suas vendas reais para comparar lucro, margem e velocidade de giro por categoria.</p>
      </div>
      <span className="cp-ranking-hero-icon"><BarChart3/></span>
    </section>

    {!ranking.totalUnits?<section className="cp-ranking-empty-full">
      <Sparkles/>
      <h2>Seu ranking está sendo construído.</h2>
      <p>Registre suas vendas normalmente. Assim que houver histórico, o CONTROLE+ começa a mostrar quais categorias deixam mais dinheiro no seu bolso.</p>
    </section>:<>
      <section className="cp-ranking-overview">
        <div><span>Lucro analisado</span><b>{money.format(ranking.totalProfit)}</b></div>
        <div><span>Faturamento analisado</span><b>{money.format(ranking.totalRevenue)}</b></div>
        <div><span>Itens vendidos</span><b>{number.format(ranking.totalUnits)}</b></div>
        <div><span>Categorias</span><b>{number.format(ranking.rows.length)}</b></div>
      </section>

      <section className="cp-ranking-podium">
        {top.map((item,index)=><article key={item.key} className={'cp-ranking-podium-card rank-'+(index+1)}>
          <div className="cp-ranking-podium-position">{medalFor(index)}<span>{index+1}º</span></div>
          <small>{index===0?'MAIOR LUCRO':index===1?'SEGUNDO MELHOR':'TERCEIRO MELHOR'}</small>
          <h2>{item.label}</h2>
          <strong>{money.format(item.profit)}</strong>
          <p>{item.units} item(ns) · {item.orders} pedido(s)</p>
          <div>
            <span><small>Lucro/item</small><b>{money.format(item.profitPerUnit)}</b></span>
            <span><small>Margem</small><b>{item.margin.toFixed(0)}%</b></span>
            <span><small>Giro médio</small><b>{item.avgDays===null?'—':Math.round(item.avgDays)+'d'}</b></span>
          </div>
        </article>)}
      </section>

      <section className="cp-ranking-ai">
        <div className="cp-ranking-ai-title"><Sparkles/><div><span>O CONTROLE+ PERCEBEU</span><h2>Seu brique tem um padrão.</h2></div></div>
        <div className="cp-ranking-ai-grid">
          {ranking.rows[0]&&<article>
            <span><Trophy/></span>
            <div><small>MAIS DINHEIRO NO BOLSO</small><b>{ranking.rows[0].label}</b><p>É a categoria que mais gerou lucro no seu histórico: <strong>{money.format(ranking.rows[0].profit)}</strong>.</p></div>
          </article>}
          {ranking.fastest&&<article>
            <span><Clock3/></span>
            <div><small>GIRO MAIS RÁPIDO</small><b>{ranking.fastest.label}</b><p>Seus itens dessa categoria levam em média <strong>{Math.round(ranking.fastest.avgDays||0)} dia(s)</strong> para virar dinheiro.</p></div>
          </article>}
          {ranking.bestMargin&&<article>
            <span><TrendingUp/></span>
            <div><small>MELHOR MARGEM</small><b>{ranking.bestMargin.label}</b><p>Margem média observada de <strong>{ranking.bestMargin.margin.toFixed(0)}%</strong> sobre as vendas registradas.</p></div>
          </article>}
          {ranking.bestUnit&&<article>
            <span><Target/></span>
            <div><small>MAIOR LUCRO POR PEÇA</small><b>{ranking.bestUnit.label}</b><p>Cada item vendido deixou em média <strong>{money.format(ranking.bestUnit.profitPerUnit)}</strong> de lucro.</p></div>
          </article>}
        </div>
      </section>

      <section className="cp-ranking-table-section">
        <div className="cp-ranking-section-head"><div><span>RANKING COMPLETO</span><h2>Todas as categorias</h2></div></div>
        <div className="cp-ranking-table">
          {ranking.rows.map((item,index)=><article key={item.key}>
            <span className="cp-ranking-row-position">{index+1}</span>
            <div className="cp-ranking-row-name"><b>{item.label}</b><small>{item.units} item(ns) vendido(s)</small></div>
            <div><span>Lucro total</span><b>{money.format(item.profit)}</b></div>
            <div><span>Por item</span><b>{money.format(item.profitPerUnit)}</b></div>
            <div><span>Margem</span><b>{item.margin.toFixed(0)}%</b></div>
            <div><span>Giro</span><b>{item.avgDays===null?'—':Math.round(item.avgDays)+' dias'}</b></div>
          </article>)}
        </div>
      </section>

      <section className="cp-ranking-confidence">
        <Sparkles/>
        <div><b>Esse ranking melhora junto com seu negócio.</b><p>Quanto mais compras e vendas você registrar, mais fiel fica a comparação. Ele não usa média de internet: usa o seu próprio jeito de comprar e vender.</p></div>
      </section>
    </>}
  </div>
}
