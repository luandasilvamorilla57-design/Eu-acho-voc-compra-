import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Radar, ScanSearch, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import type { AdOrigin } from './AnalysisForm'

const stageMap={
  olx:[
    ['Acessando o anúncio','Lendo as informações disponíveis no link da OLX.',ScanSearch],
    ['Identificando a oportunidade','Organizando produto, preço, estado e contexto.',Radar],
    ['Calculando risco e margem','Cruzando preço, teto de compra, ROI e pontos de atenção.',ShieldCheck],
    ['Preparando a negociação','Montando score, checklist e abordagem para o vendedor.',TrendingUp],
  ],
  facebook:[
    ['Lendo os prints','Extraindo título, preço, descrição e detalhes visuais.',ScanSearch],
    ['Identificando o produto','Reconhecendo modelo, versão, estado e acessórios visíveis.',Radar],
    ['Calculando risco e margem','Analisando sinais de risco, teto de compra e potencial.',ShieldCheck],
    ['Preparando a negociação','Montando score, checklist e mensagens de abordagem.',TrendingUp],
  ],
  manual:[
    ['Interpretando o anúncio','Organizando as informações que você forneceu.',ScanSearch],
    ['Identificando a oportunidade','Entendendo produto, estado e contexto da venda.',Radar],
    ['Calculando risco e margem','Estimando teto de compra, ROI e pontos de atenção.',ShieldCheck],
    ['Preparando a negociação','Montando score, checklist e mensagens de abordagem.',TrendingUp],
  ],
} as const

export function RadarLoader({origem}:{origem:AdOrigin}){
  const [stage,setStage]=useState(0)
  const stages=useMemo(()=>stageMap[origem],[origem])

  useEffect(()=>{
    const oldOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const timer=window.setInterval(()=>setStage(current=>Math.min(current+1,stages.length-1)),1550)
    return ()=>{
      window.clearInterval(timer)
      document.body.style.overflow=oldOverflow
    }
  },[stages])

  const current=stages[stage]
  const CurrentIcon=current[2]

  return <div className="radar-loader" role="status" aria-live="polite" aria-label="Análise em andamento">
    <div className="radar-loader__backdrop"/>
    <div className="radar-loader__panel">
      <div className="radar-loader__brand">
        <span className="radar-loader__brand-dot"/>
        <span>BRIKE RADAR</span>
        <small>ANÁLISE EM TEMPO REAL</small>
      </div>

      <div className="radar-loader__visual" aria-hidden="true">
        <div className="radar-loader__glow"/>
        <div className="radar-loader__circle radar-loader__circle--1"/>
        <div className="radar-loader__circle radar-loader__circle--2"/>
        <div className="radar-loader__circle radar-loader__circle--3"/>
        <div className="radar-loader__cross radar-loader__cross--h"/>
        <div className="radar-loader__cross radar-loader__cross--v"/>
        <div className="radar-loader__sweep"/>
        <span className="radar-loader__ping radar-loader__ping--1"/>
        <span className="radar-loader__ping radar-loader__ping--2"/>
        <span className="radar-loader__ping radar-loader__ping--3"/>
        <div className="radar-loader__core"><Radar size={26}/></div>
      </div>

      <div className="radar-loader__copy">
        <div className="radar-loader__eyebrow"><Sparkles size={13}/> RADAR TRABALHANDO</div>
        <h3>{current[0]}</h3>
        <p>{current[1]}</p>
      </div>

      <div className="radar-loader__stages">
        {stages.map(([title,,Icon],index)=>{
          const done=index<stage
          const active=index===stage
          return <div key={title} className={`radar-loader__stage ${done?'is-done':''} ${active?'is-active':''}`}>
            <span className="radar-loader__stage-icon">
              {done?<CheckCircle2 size={14}/>:<Icon size={14}/>}
            </span>
            <span>{title}</span>
          </div>
        })}
      </div>

      <div className="radar-loader__signal">
        <span/><span/><span/><span/><span/>
      </div>
    </div>
  </div>
}
