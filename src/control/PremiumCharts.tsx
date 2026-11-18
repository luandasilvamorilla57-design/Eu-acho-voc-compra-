import {useId} from 'react'

/**
 * Gráfico somente de apresentação — recebe valores já calculados.
 * Não consulta banco, não altera lançamentos e não inventa tendência.
 */
export function PremiumAreaChart({values,labels=[],variant='light'}:{values:number[];labels?:string[];variant?:'light'|'dark'}){
  const unique=useId().replace(/:/g,'')
  const points=values.length>=2?values:[0,0]
  const width=520,height=172,top=13,bottom=139
  const lo=Math.min(0,...points),hi=Math.max(1,...points)
  const spread=Math.max(1,hi-lo)
  const positions=points.map((value,index)=>({
    x:12+(index/Math.max(1,points.length-1))*(width-24),
    y:bottom-((value-lo)/spread)*(bottom-top)
  }))
  const stroke=variant==='dark'?'#8ed0ff':'#2378c5'
  const path=positions.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ')
  const area=path+' L'+positions[positions.length-1].x+' '+bottom+' L12 '+bottom+' Z'
  return <div className={'cp-vision-chart cp-vision-chart--'+variant} role="img" aria-label="Gráfico dos resultados reais do período">
    <svg viewBox="0 0 520 172" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={'cpVisionFill'+unique} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity=".35"/>
          <stop offset="100%" stopColor={stroke} stopOpacity=".01"/>
        </linearGradient>
      </defs>
      {[36,79,122].map(y=><line key={y} x1="10" y1={y} x2="510" y2={y} stroke={variant==='dark'?'#9bc1e8':'#bfd0e2'} strokeWidth="1" opacity=".27" strokeDasharray="5 7"/>)}
      <path d={area} fill={'url(#cpVisionFill'+unique+')'}/>
      <path d={path} fill="none" stroke={stroke} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={positions[positions.length-1].x} cy={positions[positions.length-1].y} r="6" stroke={stroke} strokeWidth="3" fill={variant==='dark'?'#153a60':'#fff'}/>
    </svg>
    <div className="cp-vision-chart-labels"><span>{labels[0]||''}</span><span>{labels[1]||''}</span><span>{labels[2]||''}</span></div>
  </div>
}
export function recentDailyValues(entries:{date:string;amount:number}[],days=15,accumulate=false,initial=0){
  const today=new Date()
  const start=new Date(today.getFullYear(),today.getMonth(),today.getDate()-days+1)
  const dates=Array.from({length:days},(_,i)=>{
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i)
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
  })
  const buckets=new Map<string,number>()
  let before=initial
  for(const item of entries){
    if(item.date<dates[0]){if(accumulate)before+=item.amount;continue}
    if(item.date>dates[dates.length-1])continue
    buckets.set(item.date,(buckets.get(item.date)||0)+item.amount)
  }
  let sum=before
  const values=dates.map(date=>{
    const value=buckets.get(date)||0
    if(!accumulate)return value
    sum+=value
    return sum
  })
  const format=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','')
  return{values,labels:[format(dates[0]),format(dates[Math.floor(days/2)]),format(dates[days-1])]}
}
