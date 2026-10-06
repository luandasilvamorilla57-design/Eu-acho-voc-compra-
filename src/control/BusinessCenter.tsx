import {useMemo,useState} from 'react'
import {
  AlertTriangle,ArrowLeft,ArrowUpRight,Banknote,BarChart3,CalendarCheck,Check,
  ChevronRight,Download,FileArchive,Package,Plus,ReceiptText,Target,Truck,
  UserRound,UsersRound,WalletCards
} from 'lucide-react'
import type {ControlView,Customer,Supplier} from './types'
import {useControlData} from './useControlData'

type Data=ReturnType<typeof useControlData>
const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})
const number=new Intl.NumberFormat('pt-BR')
const today=()=>new Date().toISOString().slice(0,10)
const currentMonth=()=>today().slice(0,7)
const monthStart=(m:string)=>m.length===7?m+'-01':m
const monthName=(m:string)=>new Date(monthStart(m)+'T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})

function cashBalance(data:Data){
  const inValue=data.cashEntries.filter(x=>x.kind==='income').reduce((s,x)=>s+x.amount,0)
  const outValue=data.cashEntries.filter(x=>x.kind==='expense').reduce((s,x)=>s+x.amount,0)
  return (data.settings?.initial_cash||0)+inValue-outValue
}
function openReceivables(data:Data){return data.installments.filter(x=>x.status==='open').reduce((s,x)=>s+x.amount,0)}
function stats(data:Data,month:string){
  const sales=data.sales.filter(s=>s.status==='completed'&&s.sale_date.slice(0,7)===month)
  const ids=new Set(sales.map(s=>s.id))
  const items=data.saleItems.filter(i=>ids.has(i.sale_id))
  const revenue=items.reduce((s,i)=>s+i.unit_price*i.quantity,0)
  const cogs=items.reduce((s,i)=>s+i.unit_cost_snapshot*i.quantity,0)
  const productProfit=revenue-cogs
  const general=data.cashEntries.filter(e=>e.kind==='expense'&&e.occurred_at.slice(0,7)===month&&!['purchase','product_expense'].includes(e.category)).reduce((s,e)=>s+e.amount,0)
  const net=productProfit-general
  return{sales,items,revenue,cogs,productProfit,general,net,margin:revenue?net/revenue*100:0,ticket:sales.length?revenue/sales.length:0}
}
function download(name:string,text:string,type='text/plain;charset=utf-8'){
  const blob=new Blob([text],{type})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()
  URL.revokeObjectURL(url)
}
function csvCell(value:unknown){
  const text=String(value??'')
  return '"'+text.replaceAll('"','""')+'"'
}
function toCsv(headers:string[],rows:unknown[][]){
  return '\uFEFF'+headers.map(csvCell).join(';')+'\n'+rows.map(r=>r.map(csvCell).join(';')).join('\n')
}

export function ManagePage({data,onView,onBack}:{data:Data;onView:(v:ControlView)=>void;onBack:()=>void}){
  const month=currentMonth()
  const s=stats(data,month)
  const overdue=data.installments.filter(i=>i.status==='open'&&i.due_date<today())
  const goal=data.goals.find(g=>g.period_month.slice(0,7)===month)
  const tools=[
    {view:'cash' as ControlView,icon:<WalletCards/>,name:'Caixa',desc:'Dinheiro livre e movimentações.',value:money.format(cashBalance(data))},
    {view:'receivables' as ControlView,icon:<ReceiptText/>,name:'A receber',desc:'Parcelas, vencimentos e atrasos.',value:money.format(openReceivables(data)),alert:overdue.length?overdue.length+' atrasada(s)':''},
    {view:'reports' as ControlView,icon:<BarChart3/>,name:'Relatórios',desc:'Lucro, giro e categorias.',value:money.format(s.net)+' no mês'},
    {view:'people' as ControlView,icon:<UsersRound/>,name:'Pessoas',desc:'Clientes e fornecedores.',value:(data.customers.length+data.suppliers.length)+' contatos'},
    {view:'goals' as ControlView,icon:<Target/>,name:'Metas',desc:'Objetivos e progresso mensal.',value:goal?'Meta ativa':'Definir meta'},
    {view:'closures' as ControlView,icon:<CalendarCheck/>,name:'Fechamento',desc:'Resultado congelado de cada mês.',value:data.closures.length+' fechamento(s)'},
    {view:'backup' as ControlView,icon:<FileArchive/>,name:'Backup',desc:'Leve seus dados com você.',value:'JSON + CSV'}
  ]
  return <div className="cp-page cp-business-page">
    <BackTitle eyebrow="CENTRAL DE GESTÃO" title="O negócio inteiro, sem virar ERP." text="Entre aqui quando quiser entender o que está funcionando e tomar decisões melhores." onBack={onBack}/>
    <section className="cp-business-strip">
      <div><span>CAIXA LIVRE</span><strong>{money.format(cashBalance(data))}</strong><small>disponível agora</small></div>
      <div><span>A RECEBER</span><strong>{money.format(openReceivables(data))}</strong><small>{overdue.length?overdue.length+' parcela(s) atrasada(s)':'nenhum atraso'}</small></div>
      <div><span>RESULTADO DO MÊS</span><strong className={s.net>=0?'positive':'negative'}>{money.format(s.net)}</strong><small>lucro depois dos gastos gerais</small></div>
    </section>
    <div className="cp-business-list">{tools.map((tool,i)=><button key={tool.view} onClick={()=>onView(tool.view)} className="cp-business-tool">
      <span className="cp-business-index">{String(i+1).padStart(2,'0')}</span>
      <span className="cp-business-icon">{tool.icon}</span>
      <div><b>{tool.name}</b><p>{tool.desc}</p></div>
      <div className="cp-business-value"><strong>{tool.value}</strong>{tool.alert&&<small className="negative">{tool.alert}</small>}</div>
      <ChevronRight/>
    </button>)}</div>
  </div>
}

export function ReceivablesPage({data,onBack}:{data:Data;onBack:()=>void}){
  const [filter,setFilter]=useState<'open'|'overdue'|'paid'>('open')
  const [payId,setPayId]=useState<string|null>(null)
  const [method,setMethod]=useState('pix')
  const [paidAt,setPaidAt]=useState(today())
  const open=data.installments.filter(i=>i.status==='open')
  const overdue=open.filter(i=>i.due_date<today())
  const paid=data.installments.filter(i=>i.status==='paid')
  const list=(filter==='open'?open:filter==='overdue'?overdue:paid).slice().sort((a,b)=>a.due_date.localeCompare(b.due_date))
  const receivableById=new Map(data.receivables.map(r=>[r.id,r]))
  async function confirm(){if(payId){await data.payInstallment(payId,paidAt,method);setPayId(null)}}
  return <div className="cp-page cp-business-page">
    <BackTitle eyebrow="A RECEBER" title="Venda feita só vira caixa quando o dinheiro entra." text="Controle parcelas sem misturar promessa de pagamento com dinheiro disponível." onBack={onBack}/>
    <section className="cp-receive-summary">
      <div><span>EM ABERTO</span><strong>{money.format(open.reduce((s,i)=>s+i.amount,0))}</strong><small>{open.length} parcela(s)</small></div>
      <div className={overdue.length?'is-danger':''}><span>ATRASADO</span><strong>{money.format(overdue.reduce((s,i)=>s+i.amount,0))}</strong><small>{overdue.length} parcela(s)</small></div>
      <div><span>JÁ RECEBIDO</span><strong>{money.format(paid.reduce((s,i)=>s+i.amount,0))}</strong><small>{paid.length} parcela(s)</small></div>
    </section>
    <div className="cp-filter-tabs cp-receive-tabs"><button className={filter==='open'?'active':''} onClick={()=>setFilter('open')}>Em aberto</button><button className={filter==='overdue'?'active':''} onClick={()=>setFilter('overdue')}>Atrasadas</button><button className={filter==='paid'?'active':''} onClick={()=>setFilter('paid')}>Recebidas</button></div>
    {list.length?<div className="cp-receivable-list">{list.map(inst=>{
      const rec=receivableById.get(inst.receivable_id)
      const customer=rec?data.grouped.customerById.get(rec.customer_id):undefined
      const count=rec?(data.grouped.installmentsByReceivable.get(rec.id)||[]).length:1
      const late=inst.status==='open'&&inst.due_date<today()
      return <article key={inst.id} className={late?'cp-receivable-row is-late':'cp-receivable-row'}>
        <span className="cp-receivable-icon">{late?<AlertTriangle/>:<Banknote/>}</span>
        <div><span>{late?'VENCIDA':'PARCELA '+inst.installment_number+'/'+count}</span><b>{customer?.name||'Cliente'} · {rec?.description||'Venda'}</b><small>Vence {new Date(inst.due_date+'T12:00:00').toLocaleDateString('pt-BR')}</small></div>
        <strong>{money.format(inst.amount)}</strong>
        {inst.status==='open'?<button className="cp-primary cp-small" onClick={()=>setPayId(inst.id)}>Recebi</button>:<span className="cp-received-chip"><Check/> Recebida</span>}
      </article>
    })}</div>:<EmptyState icon={<ReceiptText/>} title={filter==='overdue'?'Nenhum atraso':'Nada aqui ainda'} text="Vendas a prazo aparecem aqui automaticamente."/>}
    {payId&&<Dialog onClose={()=>setPayId(null)}><span className="cp-eyebrow">CONFIRMAR RECEBIMENTO</span><h3>Esse dinheiro entrou de verdade?</h3><p>Ao confirmar, a parcela entra no saldo disponível do caixa.</p><div className="cp-form-grid"><Field label="Data"><input type="date" value={paidAt} onChange={e=>setPaidAt(e.target.value)}/></Field><Field label="Forma"><select value={method} onChange={e=>setMethod(e.target.value)}><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="card">Cartão</option><option value="transfer">Transferência</option><option value="other">Outro</option></select></Field></div><div className="cp-modal-actions"><button className="cp-secondary" onClick={()=>setPayId(null)}>Cancelar</button><button className="cp-primary" disabled={data.busy} onClick={()=>void confirm()}>{data.busy?'Salvando...':'Confirmar'}</button></div></Dialog>}
  </div>
}

export function ReportsPage({data,onBack}:{data:Data;onBack:()=>void}){
  const [month,setMonth]=useState(currentMonth())
  const s=useMemo(()=>stats(data,month),[data.sales,data.saleItems,data.cashEntries,month])
  const categories=useMemo(()=>{
    const map=new Map<string,{revenue:number;profit:number;qty:number}>()
    for(const item of s.items){
      const p=data.products.find(x=>x.id===item.product_id)
      const key=p?.category||'Sem categoria'
      const row=map.get(key)||{revenue:0,profit:0,qty:0}
      row.revenue+=item.unit_price*item.quantity
      row.profit+=(item.unit_price-item.unit_cost_snapshot)*item.quantity
      row.qty+=item.quantity
      map.set(key,row)
    }
    return [...map.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.profit-a.profit)
  },[data.products,s.items])
  const products=useMemo(()=>{
    const map=new Map<string,{name:string;profit:number;revenue:number;qty:number;days:number[]}>()
    for(const sale of s.sales){
      for(const item of data.grouped.itemsBySale.get(sale.id)||[]){
        const p=data.products.find(x=>x.id===item.product_id);if(!p)continue
        const row=map.get(p.id)||{name:p.name,profit:0,revenue:0,qty:0,days:[]}
        row.revenue+=item.unit_price*item.quantity
        row.profit+=(item.unit_price-item.unit_cost_snapshot)*item.quantity
        row.qty+=item.quantity
        row.days.push(Math.max(0,Math.round((new Date(sale.sale_date+'T12:00:00').getTime()-new Date(p.purchase_date+'T12:00:00').getTime())/86400000)))
        map.set(p.id,row)
      }
    }
    return [...map.values()].map(x=>({...x,avgDays:x.days.length?x.days.reduce((a,b)=>a+b,0)/x.days.length:0}))
  },[data.grouped.itemsBySale,data.products,s.sales])
  const topProfit=[...products].sort((a,b)=>b.profit-a.profit).slice(0,5)
  const topSpeed=[...products].sort((a,b)=>a.avgDays-b.avgDays).slice(0,5)
  const max=Math.max(1,...topProfit.map(x=>Math.abs(x.profit)))
  return <div className="cp-page cp-business-page">
    <BackTitle eyebrow="RELATÓRIOS" title="O que dá dinheiro merece mais capital." text="Compare lucro, margem e velocidade de venda para descobrir onde vale insistir." onBack={onBack}/>
    <div className="cp-month-selector"><label><span>MÊS</span><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><strong>{monthName(month)}</strong></div>
    <section className="cp-report-strip">
      <div><span>FATURAMENTO</span><strong>{money.format(s.revenue)}</strong><small>{s.sales.length} venda(s)</small></div>
      <div><span>LUCRO PRODUTOS</span><strong>{money.format(s.productProfit)}</strong><small>depois do custo da mercadoria</small></div>
      <div><span>GASTOS GERAIS</span><strong>{money.format(s.general)}</strong><small>fora dos produtos</small></div>
      <div><span>RESULTADO LÍQUIDO</span><strong className={s.net>=0?'positive':'negative'}>{money.format(s.net)}</strong><small>{s.margin.toFixed(1)}% sobre o faturamento</small></div>
    </section>
    <div className="cp-report-layout">
      <section className="cp-report-panel"><div className="cp-section-title-v4"><span>CATEGORIAS</span><h2>Onde seu lucro está nascendo</h2></div>{categories.length?categories.map(r=><div className="cp-category-line" key={r.name}><div><b>{r.name}</b><small>{r.qty} un. · {money.format(r.revenue)} vendidos</small></div><strong className={r.profit>=0?'positive':'negative'}>{money.format(r.profit)}</strong></div>):<EmptyState icon={<BarChart3/>} title="Sem vendas no período" text="As categorias aparecem quando houver vendas."/>}</section>
      <section className="cp-report-panel"><div className="cp-section-title-v4"><span>RANKING DE LUCRO</span><h2>Produtos que mais deixaram dinheiro</h2></div>{topProfit.length?topProfit.map((r,i)=><div className="cp-profit-rank" key={r.name}><span>{String(i+1).padStart(2,'0')}</span><div><b>{r.name}</b><i><em style={{width:(Math.abs(r.profit)/max*100)+'%'}}/></i></div><strong>{money.format(r.profit)}</strong></div>):<p className="cp-muted">Ainda não há histórico suficiente.</p>}</section>
    </div>
    <section className="cp-report-panel cp-speed-panel"><div className="cp-section-title-v4"><span>VELOCIDADE DE GIRO</span><h2>Quanto tempo seu dinheiro fica preso</h2></div>{topSpeed.length?<div className="cp-speed-grid">{topSpeed.map((r,i)=><article key={r.name}><span>#{i+1}</span><b>{r.name}</b><strong>{r.avgDays.toFixed(0)} dias</strong><small>{r.qty} un. vendida(s)</small></article>)}</div>:<p className="cp-muted">O giro começa a ser calculado quando produtos comprados forem vendidos.</p>}</section>
  </div>
}

export function PeoplePage({data,onBack}:{data:Data;onBack:()=>void}){
  const [tab,setTab]=useState<'customers'|'suppliers'>('customers')
  const [edit,setEdit]=useState<Customer|Supplier|null>(null)
  const [newOne,setNewOne]=useState(false)
  const list=tab==='customers'?data.customers:data.suppliers
  return <div className="cp-page cp-business-page">
    <BackTitle eyebrow="PESSOAS" title="Bons contatos também fazem parte do patrimônio." text="Guarde clientes que compram de novo e fornecedores que trazem mercadoria boa." onBack={onBack}/>
    <div className="cp-people-toolbar"><div className="cp-filter-tabs"><button className={tab==='customers'?'active':''} onClick={()=>setTab('customers')}>Clientes · {data.customers.length}</button><button className={tab==='suppliers'?'active':''} onClick={()=>setTab('suppliers')}>Fornecedores · {data.suppliers.length}</button></div><button className="cp-primary cp-small" onClick={()=>setNewOne(true)}><Plus/> Adicionar</button></div>
    {list.length?<div className="cp-contact-list">{list.map(item=>{
      const customerSales=tab==='customers'?data.sales.filter(s=>s.customer_id===item.id).length:0
      const supplierProducts=tab==='suppliers'?data.products.filter(p=>p.supplier_id===item.id).length:0
      return <button key={item.id} onClick={()=>setEdit(item)}><span className="cp-contact-icon">{tab==='customers'?<UserRound/>:<Truck/>}</span><div><b>{item.name}</b><small>{item.phone||'Sem telefone'}</small></div><em>{tab==='customers'?customerSales+' venda(s)':supplierProducts+' compra(s)'}</em><ChevronRight/></button>
    })}</div>:<EmptyState icon={tab==='customers'?<UsersRound/>:<Truck/>} title={tab==='customers'?'Nenhum cliente salvo':'Nenhum fornecedor salvo'} text={tab==='customers'?'Você pode salvar o cliente durante uma venda ou aqui.':'Cadastre quem costuma te fornecer mercadoria.'}/>}
    {(newOne||edit)&&<PersonDialog type={tab} item={edit} data={data} onClose={()=>{setNewOne(false);setEdit(null)}}/>}
  </div>
}

function PersonDialog({type,item,data,onClose}:{type:'customers'|'suppliers';item:Customer|Supplier|null;data:Data;onClose:()=>void}){
  const [name,setName]=useState(item?.name||'')
  const [phone,setPhone]=useState(item?.phone||'')
  const [notes,setNotes]=useState(item?.notes||'')
  const [source,setSource]=useState(type==='suppliers'?(item as Supplier|null)?.source||'':'')
  const [error,setError]=useState('')
  async function save(){
    setError('')
    try{
      if(!name.trim())throw new Error('Informe o nome.')
      if(type==='customers'){
        if(item)await data.updateCustomer(item.id,{name,phone:phone||null,notes:notes||null})
        else await data.createCustomer(name,phone,notes)
      }else{
        if(item)await data.updateSupplier(item.id,{name,phone:phone||null,source:source||null,notes:notes||null})
        else await data.createSupplier(name,phone,source,notes)
      }
      onClose()
    }catch(e:any){setError(e?.message||'Não foi possível salvar.')}
  }
  return <Dialog onClose={onClose}><span className="cp-eyebrow">{type==='customers'?'CLIENTE':'FORNECEDOR'}</span><h3>{item?'Editar contato':'Novo contato'}</h3><div className="cp-form-grid"><Field label="Nome" full><input value={name} onChange={e=>setName(e.target.value)}/></Field><Field label="WhatsApp"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Opcional"/></Field>{type==='suppliers'&&<Field label="Origem"><input value={source} onChange={e=>setSource(e.target.value)} placeholder="Brás, Marketplace..."/></Field>}<Field label="Observações" full><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="O que vale lembrar?"/></Field></div>{error&&<div className="cp-form-error">{error}</div>}<div className="cp-modal-actions"><button className="cp-secondary" onClick={onClose}>Cancelar</button><button className="cp-primary" disabled={data.busy} onClick={()=>void save()}>{data.busy?'Salvando...':'Salvar'}</button></div></Dialog>
}

export function GoalsPage({data,onBack}:{data:Data;onBack:()=>void}){
  const [month,setMonth]=useState(currentMonth())
  const getGoal=(m:string)=>data.goals.find(g=>g.period_month.slice(0,7)===m)
  const initial=getGoal(month)
  const [revenue,setRevenue]=useState(initial?String(initial.revenue_target):'')
  const [profit,setProfit]=useState(initial?String(initial.profit_target):'')
  const [sales,setSales]=useState(initial?String(initial.sales_target):'')
  const [budget,setBudget]=useState(initial?String(initial.purchase_budget):'')
  const s=stats(data,month)
  const spent=data.cashEntries.filter(e=>e.kind==='expense'&&e.category==='purchase'&&e.occurred_at.slice(0,7)===month).reduce((a,b)=>a+b.amount,0)
  function changeMonth(v:string){setMonth(v);const g=getGoal(v);setRevenue(g?String(g.revenue_target):'');setProfit(g?String(g.profit_target):'');setSales(g?String(g.sales_target):'');setBudget(g?String(g.purchase_budget):'')}
  async function save(){await data.saveGoal({periodMonth:month,revenueTarget:Number(revenue.replace(',','.'))||0,profitTarget:Number(profit.replace(',','.'))||0,salesTarget:Number(sales)||0,purchaseBudget:Number(budget.replace(',','.'))||0})}
  return <div className="cp-page cp-business-page">
    <BackTitle eyebrow="METAS" title="Um mês bom precisa ter um número." text="Defina para onde você quer levar faturamento, lucro, vendas e dinheiro de compra." onBack={onBack}/>
    <div className="cp-month-selector"><label><span>MÊS</span><input type="month" value={month} onChange={e=>changeMonth(e.target.value)}/></label><strong>{monthName(month)}</strong></div>
    <section className="cp-goal-list">
      <Progress label="Faturamento" actual={s.revenue} target={Number(revenue.replace(',','.'))||0} format={money.format}/>
      <Progress label="Lucro líquido" actual={s.net} target={Number(profit.replace(',','.'))||0} format={money.format}/>
      <Progress label="Vendas" actual={s.sales.length} target={Number(sales)||0} format={v=>number.format(v)}/>
      <Progress label="Orçamento de compra usado" actual={spent} target={Number(budget.replace(',','.'))||0} format={money.format}/>
    </section>
    <section className="cp-goal-editor"><div className="cp-section-title-v4"><span>CONFIGURAÇÃO</span><h2>Defina as metas de {monthName(month)}</h2></div><div className="cp-form-grid"><Field label="Faturamento"><MoneyBox value={revenue} setValue={setRevenue}/></Field><Field label="Lucro líquido"><MoneyBox value={profit} setValue={setProfit}/></Field><Field label="Quantidade de vendas"><input type="number" min="0" value={sales} onChange={e=>setSales(e.target.value)}/></Field><Field label="Orçamento para mercadoria"><MoneyBox value={budget} setValue={setBudget}/></Field></div><div className="cp-modal-actions"><button className="cp-primary" disabled={data.busy} onClick={()=>void save()}>{data.busy?'Salvando...':'Salvar metas'}</button></div></section>
  </div>
}

function Progress({label,actual,target,format}:{label:string;actual:number;target:number;format:(v:number)=>string}){
  const pct=target>0?Math.max(0,Math.min(100,actual/target*100)):0
  return <article className="cp-goal-row"><div><span>{label}</span><b>{format(actual)} <small>de {target>0?format(target):'—'}</small></b></div><strong>{target>0?pct.toFixed(0)+'%':'sem meta'}</strong><i><em style={{width:pct+'%'}}/></i></article>
}

export function ClosuresPage({data,onBack}:{data:Data;onBack:()=>void}){
  const [month,setMonth]=useState(currentMonth())
  const [notes,setNotes]=useState('')
  async function close(){await data.closeMonth(month,notes);setNotes('')}
  return <div className="cp-page cp-business-page">
    <BackTitle eyebrow="FECHAMENTO MENSAL" title="Tire uma fotografia do mês antes de seguir." text="O fechamento guarda faturamento, lucro, estoque, caixa e valores a receber daquele período." onBack={onBack}/>
    <section className="cp-close-box"><div><span>MÊS PARA FECHAR</span><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/><h2>{monthName(month)}</h2><p>Você pode refazer o fechamento depois se lançar alguma movimentação atrasada.</p></div><div><label>Observação do mês<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex.: mês forte em celulares, compra grande no fim do mês..."/></label><button className="cp-primary" disabled={data.busy} onClick={()=>void close()}>{data.busy?'Calculando...':'Fechar este mês'}</button></div></section>
    <div className="cp-section-title-v4 cp-closure-title"><span>HISTÓRICO</span><h2>Meses fechados</h2></div>
    {data.closures.length?<div className="cp-closure-list">{data.closures.map(c=><article key={c.id}><div><span>{monthName(c.period_month.slice(0,7))}</span><b className={c.net_profit>=0?'positive':'negative'}>{money.format(c.net_profit)} resultado</b><small>Fechado em {new Date(c.closed_at).toLocaleDateString('pt-BR')}</small></div><div><span>Faturamento<b>{money.format(c.revenue)}</b></span><span>Caixa final<b>{money.format(c.cash_balance)}</b></span><span>Estoque<b>{money.format(c.stock_value)}</b></span><span>A receber<b>{money.format(c.receivables_open)}</b></span></div></article>)}</div>:<EmptyState icon={<CalendarCheck/>} title="Nenhum mês fechado" text="Faça o primeiro fechamento quando quiser guardar um retrato daquele período."/>}
  </div>
}

export function BackupPage({data,onBack}:{data:Data;onBack:()=>void}){
  function backup(){
    const payload={version:2,generated_at:new Date().toISOString(),business:data.settings?.business_name||'',settings:data.settings,products:data.products,photos:data.photos.map(({signed_url,...p})=>p),expenses:data.expenses,sales:data.sales,sale_items:data.saleItems,cash_entries:data.cashEntries,customers:data.customers,suppliers:data.suppliers,receivables:data.receivables,installments:data.installments,goals:data.goals,closures:data.closures}
    download('controle-plus-backup-'+today()+'.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8')
  }
  function stockCsv(){download('controle-plus-estoque-'+today()+'.csv',toCsv(['Produto','Categoria','Quantidade','Pago por un.','Preço anunciado','Data compra','Status'],data.products.map(p=>[p.name,p.category||'',p.quantity_available,p.purchase_unit_cost,p.listed_price??'',p.purchase_date,p.status])),'text/csv;charset=utf-8')}
  function salesCsv(){download('controle-plus-vendas-'+today()+'.csv',toCsv(['Data','Produto','Quantidade','Venda un.','Custo un.','Lucro'],data.saleItems.map(i=>{const sale=data.grouped.saleById.get(i.sale_id);const product=data.products.find(p=>p.id===i.product_id);return[sale?.sale_date||'',product?.name||'',i.quantity,i.unit_price,i.unit_cost_snapshot,(i.unit_price-i.unit_cost_snapshot)*i.quantity]})),'text/csv;charset=utf-8')}
  function cashCsv(){download('controle-plus-caixa-'+today()+'.csv',toCsv(['Data','Tipo','Categoria','Descrição','Valor'],data.cashEntries.map(e=>[e.occurred_at,e.kind,e.category,e.description,e.amount])),'text/csv;charset=utf-8')}
  return <div className="cp-page cp-business-page">
    <BackTitle eyebrow="BACKUP E EXPORTAÇÃO" title="Seus dados são seus." text="Baixe uma cópia completa ou leve partes do negócio para uma planilha." onBack={onBack}/>
    <section className="cp-backup-hero"><FileArchive/><div><span>BACKUP COMPLETO</span><h2>Uma cópia de tudo que existe no CONTROLE+</h2><p>Produtos, vendas, caixa, clientes, fornecedores, metas e fechamentos em um arquivo JSON.</p></div><button className="cp-primary" onClick={backup}><Download/> Baixar backup</button></section>
    <div className="cp-section-title-v4"><span>CSV</span><h2>Abrir no Excel ou Google Planilhas</h2></div>
    <div className="cp-export-grid"><button onClick={stockCsv}><Package/><div><b>Estoque</b><small>Produtos e valores</small></div><Download/></button><button onClick={salesCsv}><ReceiptText/><div><b>Vendas</b><small>Venda, custo e lucro</small></div><Download/></button><button onClick={cashCsv}><WalletCards/><div><b>Caixa</b><small>Todas as movimentações</small></div><Download/></button></div>
    <div className="cp-backup-note"><AlertTriangle/><p><b>Importante:</b> o backup guarda os registros e caminhos das fotos. As imagens continuam protegidas no Storage do CONTROLE+.</p></div>
  </div>
}

function BackTitle({eyebrow,title,text,onBack}:{eyebrow:string;title:string;text:string;onBack:()=>void}){
  return <section className="cp-business-title"><button onClick={onBack}><ArrowLeft/></button><div><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p></div></section>
}
function Field({label,children,full=false}:{label:string;children:React.ReactNode;full?:boolean}){return <label className={full?'cp-field cp-field--full':'cp-field'}><span>{label}</span>{children}</label>}
function MoneyBox({value,setValue}:{value:string;setValue:(v:string)=>void}){return <div className="cp-money-input"><span>R$</span><input inputMode="decimal" value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9,.]/g,''))} placeholder="0,00"/></div>}
function EmptyState({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="cp-business-empty"><span>{icon}</span><b>{title}</b><p>{text}</p></div>}
function Dialog({children,onClose}:{children:React.ReactNode;onClose:()=>void}){return <div className="cp-inline-dialog"><button className="cp-inline-backdrop" onClick={onClose}/><section>{children}</section></div>}
