import {useState} from 'react'
import {ArrowRight,Check,Pencil,Target,X} from 'lucide-react'
import type {Goal,GoalInput} from './types'
import './monthly-goal.css'

const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2})
const integer=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0})

function parseMoney(value:string){
  const cleaned=value.trim().replace(/R\$/gi,'').replace(/\s/g,'')
  if(!cleaned)return NaN
  const normalized=cleaned.includes(',')
    ?cleaned.replace(/\./g,'').replace(',','.')
    :/^\d{1,3}(?:\.\d{3})+$/.test(cleaned)?cleaned.replace(/\./g,''):cleaned
  if(!/^\d+(?:\.\d{1,2})?$/.test(normalized))return NaN
  return Number(normalized)
}

type Props={
  goal?:Goal
  month:string
  revenue:number
  canWrite:boolean
  onBlocked:()=>void
  onSave:(value:GoalInput)=>Promise<void>
}

export function MonthlyGoalCard({goal,month,revenue,canWrite,onBlocked,onSave}:Props){
  const [editing,setEditing]=useState(false)
  const [amount,setAmount]=useState('')
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [saved,setSaved]=useState(false)

  const parts=month.split('-').map(Number)
  const year=parts[0],monthIndex=parts[1]-1
  const lastDay=new Date(year,monthIndex+1,0).getDate()
  const today=new Date()
  const isCurrent=today.getFullYear()===year&&today.getMonth()===monthIndex
  const daysElapsed=isCurrent?today.getDate():lastDay
  const daysLeft=Math.max(1,lastDay-daysElapsed+1)
  const title=new Date(year,monthIndex,1).toLocaleDateString('pt-BR',{month:'long'})
  const displayMonth=title.charAt(0).toUpperCase()+title.slice(1)
  const target=Math.max(0,Number(goal?.revenue_target)||0)
  const earned=Math.max(0,Number(revenue)||0)
  const hasGoal=target>0
  const rawPercent=hasGoal?earned/target*100:0
  const barPercent=Math.min(100,Math.max(0,rawPercent))
  const percentLabel=hasGoal?integer.format(Math.floor(rawPercent))+'%':'—'
  const remaining=Math.max(0,target-earned)
  const dailyNeeded=remaining/daysLeft
  const forecast=daysElapsed>0?earned/daysElapsed*lastDay:0
  const achieved=hasGoal&&earned>=target
  const onPace=hasGoal&&earned>=target*daysElapsed/lastDay

  function openEditor(){
    if(!canWrite){onBlocked();return}
    setAmount(goal&&goal.revenue_target>0?String(goal.revenue_target).replace('.',','):'')
    setSaved(false)
    setError('')
    setEditing(true)
  }

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(saving)return
    const targetAmount=parseMoney(amount)
    if(!Number.isFinite(targetAmount)||targetAmount<=0||targetAmount>999999999999.99){
      setError('Informe uma meta maior que zero. Exemplo: 5.000,00')
      return
    }
    setSaving(true);setError('')
    try{
      await onSave({
        periodMonth:month,
        revenueTarget:Math.round(targetAmount*100)/100,
        profitTarget:goal?.profit_target||0,
        salesTarget:goal?.sales_target||0,
        purchaseBudget:goal?.purchase_budget||0
      })
      setEditing(false)
      setSaved(true)
    }catch(err){
      setError(err instanceof Error?err.message:'Não foi possível salvar a meta. Tente novamente.')
    }finally{
      setSaving(false)
    }
  }

  return <section className={'cp-month-goal'+(achieved?' cp-month-goal--achieved':'')} aria-label={'Meta de faturamento de '+displayMonth}>
    <div className="cp-month-goal-head">
      <div className="cp-month-goal-identity">
        <span className="cp-month-goal-icon"><Target size={22}/></span>
        <div><small>SEU OBJETIVO</small><h2>Meta de {displayMonth}</h2></div>
      </div>
      <button type="button" className="cp-month-goal-edit" onClick={openEditor}><Pencil size={14}/>{hasGoal?'Editar':'Definir meta'}</button>
    </div>

    {editing?<form className="cp-month-goal-form" onSubmit={e=>void submit(e)}>
      <label htmlFor="cp-month-goal-amount">Qual faturamento você quer atingir neste mês?</label>
      <div className="cp-month-goal-input-wrap"><span>R$</span><input id="cp-month-goal-amount" inputMode="decimal" autoFocus value={amount} onChange={event=>{setAmount(event.target.value);setError('')}} placeholder="Ex.: 10.000,00" disabled={saving} maxLength={18}/></div>
      <p>Contamos apenas vendas concluídas. A meta fica salva e atualiza automaticamente conforme você vende.</p>
      {error&&<div className="cp-month-goal-error" role="alert">{error}</div>}
      <div className="cp-month-goal-form-actions">
        <button type="button" className="cp-month-goal-cancel" onClick={()=>{setEditing(false);setError('')}} disabled={saving}><X size={15}/> Cancelar</button>
        <button type="submit" className="cp-month-goal-save" disabled={saving}><Check size={16}/>{saving?'Salvando...':'Salvar meta'}</button>
      </div>
    </form>:<>
      <div className="cp-month-goal-amounts">
        <div className="cp-month-goal-earned"><span>VENDIDO NO MÊS</span><strong>{currency.format(earned)}</strong></div>
        <div className="cp-month-goal-total"><span>META DEFINIDA</span><strong>{hasGoal?currency.format(target):'A definir'}</strong></div>
      </div>
      <div className="cp-month-goal-progress-top">
        <span>{!hasGoal?'Defina sua meta para começar':achieved?'Meta alcançada!':earned===0?'Comece pela primeira venda':onPace?'Acima do ritmo do mês':'Abaixo do ritmo esperado'}</span>
        <strong>{percentLabel}</strong>
      </div>
      <div className="cp-month-goal-track" role="progressbar" aria-label="Progresso da meta de faturamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(barPercent)}><div style={{width:barPercent+'%'}}/></div>

      {hasGoal?<div className="cp-month-goal-details">
        <div><small>{achieved?'Ultrapassou a meta':'Falta vender'}</small><b>{currency.format(achieved?earned-target:remaining)}</b></div>
        <div><small>Para bater por dia</small><b>{achieved?'Meta batida':currency.format(dailyNeeded)}</b></div>
        <div><small>Projeção no ritmo atual</small><b>{earned>0?currency.format(forecast):'Sem vendas ainda'}</b></div>
      </div>:<button type="button" className="cp-month-goal-start" onClick={openEditor}>
        <span>Escolha um valor e acompanhe seu progresso automaticamente.</span><ArrowRight size={17}/>
      </button>}
      {saved&&<p className="cp-month-goal-saved" role="status"><Check size={14}/> Meta atualizada!</p>}
    </>}
  </section>
}
