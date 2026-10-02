import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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

const stageTargets=[24,49,74,94] as const

export function RadarLoader({origem}:{origem:AdOrigin}){
  const [stage,setStage]=useState(0)
  const [progress,setProgress]=useState(8)
  const stages=useMemo(()=>stageMap[origem],[origem])

  useEffect(()=>{
    setStage(0)
    setProgress(8)

    const body=document.body
    const root=document.documentElement
    const oldBodyOverflow=body.style.overflow
    const oldRootOverflow=root.style.overflow
    const active=document.activeElement
    if(active instanceof HTMLElement)active.blur()

    body.style.overflow='hidden'
    root.style.overflow='hidden'

    const timers=stages.slice(1).map((_,index)=>
      window.setTimeout(()=>setStage(index+1),1500*(index+1))
    )

    return ()=>{
      timers.forEach(timer=>window.clearTimeout(timer))
      body.style.overflow=oldBodyOverflow
      root.style.overflow=oldRootOverflow
    }
  },[stages])

  useEffect(()=>{
    const target=stageTargets[stage]??94
    const timer=window.setInterval(()=>{
      setProgress(current=>{
        if(current>=target)return current
        const distance=target-current
        return Math.min(target,current+(distance>12?2:1))
      })
    },85)
    return ()=>window.clearInterval(timer)
  },[stage])

  const current=stages[stage]
  const CurrentIcon=current[2]

  const loader=<div className="radar-loader radar-loader--v3" role="status" aria-live="polite" aria-label="Análise em andamento">
    <div className="radar-loader__backdrop" aria-hidden="true"/>
    <div className="radar-loader__mesh" aria-hidden="true"/>
    <div className="radar-loader__orb radar-loader__orb--one" aria-hidden="true"/>
    <div className="radar-loader__orb radar-loader__orb--two" aria-hidden="true"/>

    <div className="radar-loader__panel">
      <header className="radar-loader__brand">
        <div className="radar-loader__brand-mark"><Radar size={15}/></div>
        <div className="radar-loader__brand-copy">
          <strong>BRIKE RADAR</strong>
          <span>ANÁLISE EM TEMPO REAL</span>
        </div>
        <div className="radar-loader__online"><i/> ONLINE</div>
      </header>

      <div className="radar-loader__hero">
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
          <div className="radar-loader__core"><CurrentIcon size={28}/><i/></div>
        </div>

        <div className="radar-loader__copy">
          <div className="radar-loader__eyebrow"><Sparkles size={13}/> RADAR TRABALHANDO</div>
          <h3>{current[0]}</h3>
          <p>{current[1]}</p>
        </div>
      </div>

      <section className="radar-loader__progress" aria-label="Progresso estimado da análise">
        <div className="radar-loader__progress-head">
          <span>PROGRESSO DA ANÁLISE</span>
          <strong>{progress}<small>%</small></strong>
        </div>
        <div className="radar-loader__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="radar-loader__fill" style={{width:`${progress}%`}}>
            <i/>
          </div>
        </div>
        <div className="radar-loader__progress-foot">
          <span>Processando dados do anúncio</span>
          <span>{stage+1} de {stages.length} etapas</span>
        </div>
      </section>

      <div className="radar-loader__stages">
        {stages.map(([title,,Icon],index)=>{
          const done=index<stage
          const active=index===stage
          return <div key={title} className={`radar-loader__stage ${done?'is-done':''} ${active?'is-active':''}`}>
            <span className="radar-loader__stage-icon">
              {done?<CheckCircle2 size={15}/>:<Icon size={15}/>}
            </span>
            <span className="radar-loader__stage-copy">
              <small>{String(index+1).padStart(2,'0')}</small>
              <b>{title}</b>
            </span>
            <span className="radar-loader__stage-state">{done?'CONCLUÍDO':active?'AGORA':'AGUARDANDO'}</span>
          </div>
        })}
      </div>

      <footer className="radar-loader__footer">
        <div className="radar-loader__signal" aria-hidden="true"><span/><span/><span/><span/><span/></div>
        <p>O Radar está cruzando as informações para montar uma leitura mais segura da oportunidade.</p>
      </footer>
    </div>
  </div>

  return createPortal(loader,document.body)
}
