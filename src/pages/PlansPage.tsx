import { useEffect,useMemo,useState } from 'react'
import {
  ArrowRight,Banknote,BarChart3,Camera,Check,ChevronDown,Crown,CreditCard,Copy,QrCode,X,
  LockKeyhole,LogOut,MessageCircle,PackageOpen,RefreshCw,SearchCheck,Smartphone,
  ShieldAlert,ShieldCheck,ShoppingBag,Tag,Target,TrendingDown,TrendingUp,
  WalletCards,Zap,Sparkles,Gamepad2,Wrench,Laptop
} from 'lucide-react'
import { Brand } from '../components/Brand'
import { supabase } from '../lib/supabase'
import type { AccountPlan } from '../types/database'
import { signOutFast } from '../services/sessionService'

type PlanRow={
  slug:AccountPlan
  nome:string
  preco_mensal:number
  analises_mes:number
  analises_dia:number
  destaque:boolean
  descricao:string
  recursos:string[]
  ordem:number
}

const fallback:PlanRow[]=[
  {
    slug:'start',nome:'Start',preco_mensal:9.90,analises_mes:40,analises_dia:7,destaque:false,
    descricao:'Para quem está começando a garimpar e quer comprar com critério.',
    recursos:['40 análises por mês','Até 7 análises por dia','Score de oportunidade','Preço, risco e teto de compra','Mensagens para negociar','Histórico das análises'],ordem:1
  },
  {
    slug:'pro',nome:'Pro',preco_mensal:19.90,analises_mes:120,analises_dia:15,destaque:true,
    descricao:'Para quem compra para revender e quer trabalhar a entrada e a saída.',
    recursos:['120 análises por mês','Até 15 análises por dia','Diagnóstico Premium','20 preparações de venda com IA/mês','Avaliação das fotos do anúncio','Título, descrição e estratégia de preço'],ordem:2
  },
  {
    slug:'max',nome:'Max',preco_mensal:34.90,analises_mes:300,analises_dia:30,destaque:false,
    descricao:'Para quem garimpa todos os dias e precisa de mais volume de operação.',
    recursos:['300 análises por mês','Até 30 análises por dia','Diagnóstico Premium','60 preparações de venda com IA/mês','Avaliação das fotos do anúncio','Título, descrição e estratégia de preço'],ordem:3
  },
]

const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const perDay=(value:number)=>(value/30).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2})
const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms))

const profiles=[
  {
    icon:ShoppingBag,
    code:'01',
    label:'REVENDA',
    title:'Compra usado abaixo do preço para vender melhor',
    text:'Para quem procura oportunidade em celular, eletrônico, ferramenta, móvel, veículo, peça e outros usados com saída.'
  },
  {
    icon:SearchCheck,
    code:'02',
    label:'GARIMPO',
    title:'Abre Marketplace e OLX procurando negócio',
    text:'Para quem compara anúncio, conversa com vendedor e precisa decidir rápido se vale chamar, negociar ou passar.'
  },
  {
    icon:WalletCards,
    code:'03',
    label:'CAPITAL',
    title:'Precisa proteger margem e giro',
    text:'Cada compra imobiliza dinheiro. O Radar ajuda a enxergar entrada, risco e espaço para a próxima venda.'
  },
]

const benefits=[
  {icon:Tag,title:'Preço com contexto',text:'Veja se o valor pedido está realmente interessante para uma compra de oportunidade.'},
  {icon:Target,title:'Oferta e teto',text:'Entre na conversa sabendo quanto oferecer e qual limite não vale ultrapassar.'},
  {icon:ShieldAlert,title:'Risco antes da compra',text:'Tenha pontos de verificação e perguntas para reduzir surpresa depois do negócio.'},
  {icon:TrendingUp,title:'Saída pensada na entrada',text:'Analise a compra considerando também o espaço que pode existir para revenda.'},
  {icon:MessageCircle,title:'Negociação mais preparada',text:'Use abordagens prontas para oferta inicial, contraproposta e fechamento.'},
  {icon:Camera,title:'Revenda assistida no Pro',text:'Depois da compra, trabalhe fotos, título, descrição e estratégia de preço.'},
]

const compareRows=[
  {label:'Análises de oportunidade',start:'40/mês',pro:'120/mês',max:'300/mês'},
  {label:'Limite diário',start:'7/dia',pro:'15/dia',max:'30/dia'},
  {label:'Oferta sugerida + teto',start:'Incluído',pro:'Incluído',max:'Incluído'},
  {label:'Diagnóstico Premium',start:'—',pro:'Incluído',max:'Incluído'},
  {label:'Preparar venda com IA',start:'—',pro:'20/mês',max:'60/mês'},
  {label:'Avaliação de fotos e anúncio',start:'—',pro:'Incluído',max:'Incluído'},
]

const faqs=[
  ['É para quem compra no Marketplace e na OLX?','Sim. O BRIKE RADAR foi pensado para quem garimpa usados, negocia a compra e avalia se existe espaço para revenda.'],
  ['O Radar garante lucro?','Não. Ele organiza preço, risco, oferta e teto para apoiar sua decisão. Resultado de compra e revenda depende do produto, condição, mercado e execução.'],
  ['Quando meu acesso é liberado?','Depois que o gateway confirma o pagamento e o backend do Radar valida a assinatura. A interface sozinha não libera acesso.'],
  ['Qual plano é voltado para quem revende?','O Pro reúne análise de compra, Diagnóstico Premium e Preparar venda com IA. O Max amplia o volume para quem opera mais.'],
  ['O Start já analisa oportunidades?','Sim. O Start inclui score, preço, riscos, oferta sugerida, teto de compra, negociação e histórico.'],
  ['Posso entrar no painel sem pagar?','Não. Sem assinatura confirmada, o painel e as funções protegidas continuam bloqueados no servidor.'],
]

function AnimatedNumber({value}:{value:number}){
  const [display,setDisplay]=useState(0)

  useEffect(()=>{
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if(reduce){setDisplay(value);return}

    let raf=0
    const started=performance.now()
    const duration=720
    const tick=(now:number)=>{
      const progress=Math.min(1,(now-started)/duration)
      const eased=1-Math.pow(1-progress,3)
      setDisplay(Math.round(value*eased))
      if(progress<1)raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(raf)
  },[value])

  return <>{display}</>
}

function PlanCard({plan,busy,onChoose}:{plan:PlanRow;busy:AccountPlan|null;onChoose:(plan:AccountPlan)=>void}){
  const featured=plan.slug==='pro'
  const cta=featured?'Escolher Pro':plan.slug==='max'?'Escolher Max':'Escolher Start'
  const label=featured?'MAIS INDICADO PARA REVENDA':plan.slug==='max'?'MAIOR VOLUME':'PARA COMEÇAR'

  return <article id={featured?'plano-pro':undefined} className={`plans-v2-card ${featured?'plans-v2-card--featured':''}`}>
    {featured&&<div className="plans-v2-card__crown"><Sparkles size={13}/> MAIS ESCOLHIDO</div>}

    <div className="plans-v2-card__top">
      <div>
        <span className="plans-v2-card__index">0{plan.ordem}</span>
        <strong className="plans-v2-card__name">{plan.nome}</strong>
      </div>
      <span className="plans-v2-card__label">{label}</span>
    </div>

    <p className="plans-v2-card__description">{plan.descricao}</p>

    <div className="plans-v2-card__price">
      <strong>{money(plan.preco_mensal)}</strong>
      <span>/mês</span>
    </div>
    <div className="plans-v2-card__daily">aprox. {perDay(plan.preco_mensal)} por dia</div>

    <div className="plans-v2-card__metrics">
      <div><strong><AnimatedNumber value={plan.analises_mes}/></strong><span>análises / mês</span></div>
      <div><strong><AnimatedNumber value={plan.analises_dia}/></strong><span>por dia</span></div>
    </div>

    <ul className="plans-v2-card__features">
      {plan.recursos.map(item=><li key={item}><span className="plans-v2-check"><Check size={12}/></span><span>{item}</span></li>)}
    </ul>

    <button onClick={()=>onChoose(plan.slug)} disabled={busy!==null} className="plans-v2-card__cta">
      {busy===plan.slug?'Abrindo pagamento...':<>{cta}<ArrowRight size={16}/></>}
    </button>

    {featured&&<p className="plans-v2-card__micro">Compra + diagnóstico premium + preparação da revenda.</p>}
  </article>
}

export function PlansPage({email,onRefreshAccess}:{email?:string;onRefreshAccess:()=>Promise<boolean>}){
  const [plans,setPlans]=useState<PlanRow[]>(fallback)
  const [busy,setBusy]=useState<AccountPlan|null>(null)
  const [checking,setChecking]=useState(false)
  const [error,setError]=useState('')
  const [paymentPlan,setPaymentPlan]=useState<AccountPlan|null>(null)
  const [pixData,setPixData]=useState<{plan:AccountPlan;amount:number;qr_code:string|null;qr_code_base64:string|null;ticket_url:string|null}|null>(null)
  const [copied,setCopied]=useState(false)
  const returned=useMemo(()=>new URLSearchParams(window.location.search).get('checkout')==='retorno',[])

  useEffect(()=>{
    supabase.from('planos_catalogo')
      .select('slug,nome,preco_mensal,analises_mes,analises_dia,destaque,descricao,recursos,ordem')
      .eq('ativo',true)
      .order('ordem')
      .then(({data})=>{
        if(data?.length)setPlans(data.map((p:any)=>({
          ...p,
          preco_mensal:Number(p.preco_mensal),
          recursos:Array.isArray(p.recursos)?p.recursos:[],
        })))
      })
  },[])

  useEffect(()=>{
    if(!returned)return
    let alive=true
    let tries=0
    const check=async()=>{
      if(!alive)return
      setChecking(true)
      const ok=await onRefreshAccess()
      if(ok){
        history.replaceState({},'',window.location.pathname)
        setChecking(false)
        return
      }
      tries+=1
      if(tries<10)setTimeout(check,2200)
      else setChecking(false)
    }
    void check()
    return()=>{alive=false}
  },[returned,onRefreshAccess])

  const startPix=async(plan:AccountPlan)=>{
    setBusy(plan)
    setError('')
    setCopied(false)
    try{
      const refreshed=await supabase.auth.refreshSession()
      const session=refreshed.data.session
      if(refreshed.error||!session?.access_token){
        await supabase.auth.signOut({scope:'local'})
        throw new Error('Sua sessão expirou. Entre novamente para continuar.')
      }
      const {data,error:fnError}=await supabase.functions.invoke('criar-pix-plano',{
        body:{plano:plan},
        headers:{Authorization:`Bearer ${session.access_token}`}
      })
      if(fnError)throw fnError
      if(!data?.qr_code&&!data?.ticket_url)throw new Error(data?.error||'Não foi possível gerar o Pix.')
      setPixData({
        plan,
        amount:Number(data.amount||0),
        qr_code:data.qr_code||null,
        qr_code_base64:data.qr_code_base64||null,
        ticket_url:data.ticket_url||null
      })
      setPaymentPlan(null)

      for(let attempt=0;attempt<120;attempt+=1){
        await wait(attempt===0?1800:2500)
        const ok=await onRefreshAccess()
        if(ok){ setPixData(null); setBusy(null); return }
      }
      setError('O Pix ainda não foi confirmado. Depois de pagar, toque em “Já paguei” para validar.')
      setBusy(null)
    }catch(e){
      setError(e instanceof Error?e.message:'Não foi possível gerar o Pix.')
      setBusy(null)
    }
  }

  const copyPix=async()=>{
    if(!pixData?.qr_code)return
    try{
      await navigator.clipboard.writeText(pixData.qr_code)
      setCopied(true)
      window.setTimeout(()=>setCopied(false),1800)
    }catch{
      setError('Não foi possível copiar automaticamente. Selecione o código Pix manualmente.')
    }
  }

  const subscribe=async(plan:AccountPlan)=>{
    setBusy(plan)
    setError('')

    // Abre a aba no mesmo gesto do clique para evitar bloqueadores de popup.
    // Assim o BRIKE continua aberto e consegue liberar o acesso assim que o webhook confirmar.
    const checkoutWindow=window.open('about:blank','brike-mercadopago')
    if(checkoutWindow){
      try{
        checkoutWindow.document.title='Abrindo Mercado Pago…'
        checkoutWindow.document.body.innerHTML='<div style="font-family:system-ui;padding:32px;color:#111">Abrindo pagamento seguro…</div>'
      }catch{}
    }

    try{
      const refreshed=await supabase.auth.refreshSession()
      const session=refreshed.data.session
      if(refreshed.error||!session?.access_token){
        try{checkoutWindow?.close()}catch{}
        await supabase.auth.signOut({scope:'local'})
        throw new Error('Sua sessão expirou. Entre novamente para continuar.')
      }

      const verified=await supabase.auth.getUser(session.access_token)
      if(verified.error||!verified.data.user){
        try{checkoutWindow?.close()}catch{}
        await supabase.auth.signOut({scope:'local'})
        throw new Error('Não foi possível validar sua sessão. Entre novamente.')
      }

      const {data,error:fnError}=await supabase.functions.invoke('criar-assinatura-mercadopago',{
        body:{plano:plan},
        headers:{Authorization:`Bearer ${session.access_token}`}
      })
      if(fnError)throw fnError
      if(data?.already_active){
        try{checkoutWindow?.close()}catch{}
        const ok=await onRefreshAccess()
        if(!ok)throw new Error('A assinatura existe, mas o pagamento ainda não foi confirmado.')
        return
      }
      if(!data?.checkout_url)throw new Error(data?.error||'Não foi possível abrir o pagamento.')

      if(checkoutWindow&&!checkoutWindow.closed){
        checkoutWindow.location.href=data.checkout_url
      }else{
        window.location.assign(data.checkout_url)
        return
      }

      // A API de Assinaturas do Mercado Pago usa back_url, mas o checkout pode
      // manter a tela final aberta. O BRIKE não depende disso: ele acompanha
      // a confirmação no servidor e fecha a aba do checkout quando o plano ativar.
      for(let attempt=0;attempt<72;attempt+=1){
        await wait(attempt===0?1800:2500)
        const ok=await onRefreshAccess()
        if(ok){
          const returnUrl=window.location.origin+'/?checkout=retorno'
          try{
            if(checkoutWindow&&!checkoutWindow.closed){
              checkoutWindow.location.href=returnUrl
            }else{
              window.focus()
            }
          }catch{
            try{checkoutWindow?.close()}catch{}
            try{window.focus()}catch{}
          }
          return
        }
      }

      setError('O pagamento continua aberto no Mercado Pago. Depois de concluir, volte a esta aba; o acesso será validado pelo servidor.')
      setBusy(null)
    }catch(e){
      try{checkoutWindow?.close()}catch{}
      setError(e instanceof Error?e.message:'Não foi possível iniciar a assinatura.')
      setBusy(null)
    }
  }

  useEffect(()=>{
    const onVisible=()=>{
      if(document.visibilityState==='visible'&&busy)void onRefreshAccess()
    }
    document.addEventListener('visibilitychange',onVisible)
    return()=>document.removeEventListener('visibilitychange',onVisible)
  },[busy,onRefreshAccess])

  const manualRefresh=async()=>{
    setChecking(true)
    setError('')
    try{
      const ok=await onRefreshAccess()
      if(!ok)setError('Ainda não recebemos a confirmação do pagamento. Se você acabou de pagar, aguarde alguns segundos e tente novamente.')
    }finally{setChecking(false)}
  }

  const pro=plans.find(p=>p.slug==='pro')??fallback[1]

  return <div
    className="plans-gate plans-gate--v2"
    onPointerMove={(event)=>{
      if(!window.matchMedia('(pointer:fine)').matches)return
      const rect=event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--spot-x',`${event.clientX-rect.left}px`)
      event.currentTarget.style.setProperty('--spot-y',`${event.clientY-rect.top}px`)
    }}
  >
    <header className="plans-header">
      <div className="plans-shell plans-header__inner">
        <Brand/>
        <button onClick={()=>void signOutFast()} className="plans-exit"><LogOut size={15}/> Sair</button>
      </div>
    </header>

    <main className="plans-v2-main">
      <section className="plans-v2-hero">
        <div className="plans-v2-aurora" aria-hidden="true"><i/><i/><i/></div>
        <div className="plans-v2-grid-bg" aria-hidden="true"/>

        <div className="plans-shell plans-v2-hero__grid">
          <div className="plans-v2-hero__copy">
            <div className="plans-v2-eyebrow"><span/> RADAR DO BRIQUE · MARKETPLACE · OLX</div>
            <h1>Compra boa começa <em>antes do PIX.</em></h1>
            <p>Analise preço, risco, oferta e teto antes de fechar. O Radar foi feito para quem garimpa usado, negocia rápido e precisa preservar margem para revender.</p>

            <div className="plans-v2-hero__actions">
              <a href="#planos" className="plans-v2-primary">Ver planos e liberar acesso <ArrowRight size={17}/></a>
              <a href="#como-funciona" className="plans-v2-ghost">Como funciona <ChevronDown size={15}/></a>
            </div>

            <div className="plans-v2-hero__trust">
              <span><ShieldCheck size={14}/> pagamento validado no servidor</span>
              <span><Target size={14}/> decisão antes da compra</span>
            </div>

            {email&&<div className="plans-v2-account"><LockKeyhole size={13}/> Conta conectada: {email}</div>}
          </div>

          <div className="plans-v2-console" aria-label="Exemplo visual de análise do Radar">
            <div className="plans-v2-console__glow"/>
            <div className="plans-v2-console__top">
              <div><span className="plans-v2-live-dot"/> ANÁLISE AO VIVO</div>
              <small>MARKETPLACE</small>
            </div>

            <div className="plans-v2-radar">
              <span className="plans-v2-radar__ring plans-v2-radar__ring--1"/>
              <span className="plans-v2-radar__ring plans-v2-radar__ring--2"/>
              <span className="plans-v2-radar__ring plans-v2-radar__ring--3"/>
              <span className="plans-v2-radar__sweep"/>
              <div className="plans-v2-radar__core"><Target size={25}/><strong>RADAR</strong><small>analisando</small></div>
              <i className="plans-v2-signal plans-v2-signal--1"/>
              <i className="plans-v2-signal plans-v2-signal--2"/>
              <i className="plans-v2-signal plans-v2-signal--3"/>
            </div>

            <div className="plans-v2-console__decision">
              <div><span>PREÇO PEDIDO</span><strong>R$ 1.900</strong></div>
              <div className="is-accent"><span>OFERTA INICIAL</span><strong>R$ 1.650</strong></div>
              <div><span>TETO</span><strong>R$ 1.780</strong></div>
            </div>

            <div className="plans-v2-console__verdict">
              <span><Check size={13}/> OPORTUNIDADE NEGOCIÁVEL</span>
              <strong>Entre sabendo onde parar.</strong>
            </div>
          </div>
        </div>
      </section>

      {returned&&<section className="plans-shell plans-payment-wrap">
        <div className="plans-payment-return">
          <div>
            <strong>Pagamento enviado ao checkout.</strong>
            <span>{checking?'Validando sua assinatura no servidor...':'Se você concluiu o pagamento, valide seu acesso.'}</span>
          </div>
          <button onClick={manualRefresh} disabled={checking}><RefreshCw size={14} className={checking?'animate-spin':''}/> Validar acesso</button>
        </div>
      </section>}

      <section className="plans-shell plans-v2-proof plans-v2-reveal">
        <article><span>01</span><Target size={21}/><strong>Oferta com referência</strong><p>Chegue na conversa sabendo quanto propor e qual limite não vale ultrapassar.</p></article>
        <article><span>02</span><ShieldAlert size={21}/><strong>Risco antes da compra</strong><p>Veja o que precisa ser conferido antes do dinheiro sair da sua mão.</p></article>
        <article><span>03</span><TrendingUp size={21}/><strong>Saída pensada na entrada</strong><p>Compre considerando margem, giro e espaço para a próxima revenda.</p></article>
      </section>

      <section id="como-funciona" className="plans-v2-section plans-v2-section--flow">
        <div className="plans-shell">
          <div className="plans-v2-heading plans-v2-reveal">
            <span className="plans-v2-number">01</span>
            <div><small>DO ANÚNCIO À DECISÃO</small><h2>Menos feeling. Mais contexto para negociar.</h2><p>O Radar organiza os pontos que mais pesam numa compra de oportunidade sem transformar sua operação em planilha.</p></div>
          </div>

          <div className="plans-v2-flow">
            <article className="plans-v2-flow__item plans-v2-reveal">
              <div><SearchCheck size={22}/><span>01</span></div>
              <strong>Garimpe</strong>
              <p>Encontrou um anúncio que parece barato? Traga para o Radar.</p>
            </article>
            <div className="plans-v2-flow__line" aria-hidden="true"/>
            <article className="plans-v2-flow__item plans-v2-reveal">
              <div><BarChart3 size={22}/><span>02</span></div>
              <strong>Analise</strong>
              <p>Preço, risco, oferta sugerida e teto aparecem em uma leitura objetiva.</p>
            </article>
            <div className="plans-v2-flow__line" aria-hidden="true"/>
            <article className="plans-v2-flow__item plans-v2-reveal">
              <div><MessageCircle size={22}/><span>03</span></div>
              <strong>Negocie</strong>
              <p>Entre com proposta e saiba até onde ainda vale subir.</p>
            </article>
            <div className="plans-v2-flow__line" aria-hidden="true"/>
            <article className="plans-v2-flow__item plans-v2-reveal">
              <div><PackageOpen size={22}/><span>04</span></div>
              <strong>Revenda</strong>
              <p>No Pro e Max, prepare também a saída com IA.</p>
            </article>
          </div>

          <div className="plans-v2-benefits">
            {benefits.map(({icon:Icon,title,text})=><article className="plans-v2-benefit plans-v2-reveal" key={title}>
              <div className="plans-v2-benefit__icon"><Icon size={19}/></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section id="planos" className="plans-v2-section plans-v2-section--pricing">
        <div className="plans-shell">
          <div className="plans-v2-heading plans-v2-heading--center plans-v2-reveal">
            <span className="plans-v2-number">02</span>
            <div><small>ESCOLHA SEU RITMO DE BRIQUE</small><h2>Um plano para cada volume. O Pro é o ponto certo para revenda.</h2><p>Comece enxuto, opere com profundidade ou escale o volume. Em todos os planos, a compra vem antes do impulso.</p></div>
          </div>

          {error&&<div className="plans-error">{error}</div>}

          <div className="plans-v2-pricing">
            {plans.map(plan=><PlanCard key={plan.slug} plan={plan} busy={busy} onChoose={setPaymentPlan}/>)}
          </div>

          <div className="plans-v2-pro-strip plans-v2-reveal">
            <div className="plans-v2-pro-strip__icon"><Sparkles size={22}/></div>
            <div><span>POR QUE O PRO É O CENTRO DA OPERAÇÃO</span><strong>Você usa o Radar na entrada e a IA na saída.</strong><p>120 análises por mês, Diagnóstico Premium e preparação da revenda com IA.</p></div>
            <button onClick={()=>setPaymentPlan('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Quero o Pro'}<ArrowRight size={15}/></button>
          </div>
        </div>
      </section>

      <section className="plans-v2-section plans-v2-section--compare">
        <div className="plans-shell">
          <div className="plans-v2-heading plans-v2-heading--center plans-v2-reveal">
            <span className="plans-v2-number">03</span>
            <div><small>SEM LETRA MIÚDA</small><h2>Veja exatamente o que muda.</h2></div>
          </div>

          <div className="plans-v2-compare plans-v2-reveal">
            <div className="plans-compare-row plans-compare-row--head"><span>RECURSO</span><b>START</b><b className="is-pro">PRO</b><b>MAX</b></div>
            {compareRows.map(row=><div className="plans-compare-row" key={row.label}><span>{row.label}</span><b>{row.start}</b><b className="is-pro">{row.pro}</b><b>{row.max}</b></div>)}
          </div>
        </div>
      </section>

      <section className="plans-v2-section plans-v2-section--security">
        <div className="plans-shell plans-v2-security-grid">
          <div className="plans-v2-security plans-v2-reveal">
            <div className="plans-v2-security__icon"><ShieldCheck size={25}/></div>
            <span>ACESSO PROTEGIDO</span>
            <h2>Pagamento confirmado no servidor. Sem atalho pelo navegador.</h2>
            <p>O gateway processa a cobrança e o backend valida a assinatura antes de liberar o painel e os recursos do seu plano.</p>
            <div className="plans-v2-security__list">
              <span><Check size={13}/> checkout seguro</span>
              <span><Check size={13}/> webhook validado</span>
              <span><Check size={13}/> plano conferido no backend</span>
            </div>
          </div>

          <div className="plans-v2-pro-mini plans-v2-reveal">
            <span>RECOMENDADO PARA REVENDA</span>
            <strong>BRIKE Pro</strong>
            <b>{money(pro.preco_mensal)}<small>/mês</small></b>
            <p>Mais análise na compra. Mais contexto na negociação. IA para preparar a saída.</p>
            <button onClick={()=>setPaymentPlan('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Escolher Pro'}<ArrowRight size={15}/></button>
          </div>
        </div>
      </section>

      <section className="plans-v2-section plans-v2-faq-section">
        <div className="plans-shell plans-v2-faq">
          <div className="plans-v2-heading plans-v2-reveal">
            <span className="plans-v2-number">04</span>
            <div><small>DÚVIDAS</small><h2>Antes de destravar seu acesso.</h2></div>
          </div>
          <div className="plans-faq-list plans-v2-reveal">
            {faqs.map(([q,a])=><details key={q} className="plans-faq">
              <summary><span>{q}</span><ChevronDown size={16}/></summary>
              <p>{a}</p>
            </details>)}
          </div>
        </div>
      </section>

      <section className="plans-v2-final">
        <div className="plans-v2-final__aurora" aria-hidden="true"/>
        <div className="plans-shell plans-v2-final__inner plans-v2-reveal">
          <span>PRÓXIMA OPORTUNIDADE</span>
          <h2>Quando o anúncio certo aparecer, entre sabendo quanto oferecer e onde parar.</h2>
          <p>Escolha seu plano e libere o Radar para a próxima negociação.</p>
          <a href="#planos">Escolher meu plano <ArrowRight size={16}/></a>
          <small><ShieldCheck size={13}/> pagamento processado pelo gateway · acesso validado no servidor</small>
        </div>
      </section>
    </main>

    <div className="plans-mobile-sticky plans-v2-sticky">
      <div><span>PRO · RECOMENDADO</span><strong>{money(pro.preco_mensal)}<small>/mês</small></strong></div>
      <button onClick={()=>setPaymentPlan('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Liberar Pro'}<ArrowRight size={14}/></button>
    </div>
    {paymentPlan&&<div className="payment-method-backdrop" role="dialog" aria-modal="true" aria-label="Escolha a forma de pagamento">
      <div className="payment-method-modal">
        <button className="payment-method-close" onClick={()=>setPaymentPlan(null)} aria-label="Fechar"><X size={18}/></button>
        <span className="payment-method-kicker">PAGAMENTO SEGURO</span>
        <h3>Como você quer pagar?</h3>
        <p>Plano {plans.find(p=>p.slug===paymentPlan)?.nome||paymentPlan} · {money(plans.find(p=>p.slug===paymentPlan)?.preco_mensal||0)}</p>
        <div className="payment-method-options">
          <button onClick={()=>{const p=paymentPlan;setPaymentPlan(null);void subscribe(p)}} disabled={busy!==null}>
            <span className="payment-method-icon"><CreditCard size={21}/></span>
            <span><strong>Cartão</strong><small>Assinatura com renovação automática mensal</small></span>
            <ArrowRight size={17}/>
          </button>
          <button onClick={()=>void startPix(paymentPlan)} disabled={busy!==null}>
            <span className="payment-method-icon"><QrCode size={21}/></span>
            <span><strong>Pix</strong><small>Pagamento único · libera 30 dias de acesso</small></span>
            <ArrowRight size={17}/>
          </button>
        </div>
        <div className="payment-method-security"><ShieldCheck size={14}/> O acesso só é liberado após confirmação do Mercado Pago.</div>
      </div>
    </div>}

    {pixData&&<div className="payment-method-backdrop" role="dialog" aria-modal="true" aria-label="Pagamento por Pix">
      <div className="payment-method-modal pix-payment-modal">
        <button className="payment-method-close" onClick={()=>{setPixData(null);setBusy(null)}} aria-label="Fechar"><X size={18}/></button>
        <span className="payment-method-kicker">PIX · 30 DIAS DE ACESSO</span>
        <h3>Escaneie ou copie o Pix</h3>
        <p>Assim que o Mercado Pago confirmar o pagamento, seu plano é liberado automaticamente.</p>
        {pixData.qr_code_base64&&<div className="pix-qr"><img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix"/></div>}
        <div className="pix-amount"><span>VALOR</span><strong>{money(pixData.amount)}</strong></div>
        {pixData.qr_code&&<button className="pix-copy" onClick={()=>void copyPix()}><Copy size={16}/>{copied?'Pix copiado':'Copiar código Pix'}</button>}
        {!pixData.qr_code&&pixData.ticket_url&&<button className="pix-copy" onClick={()=>window.open(pixData.ticket_url!,'_blank','noopener,noreferrer')}><QrCode size={16}/>Abrir Pix no Mercado Pago</button>}
        <button className="pix-check" onClick={()=>void manualRefresh()} disabled={checking}><RefreshCw size={15} className={checking?'animate-spin':''}/>{checking?'Validando...':'Já paguei · validar acesso'}</button>
        <small className="pix-note">O Pix não renova sozinho. Ao final dos 30 dias, você poderá pagar novamente.</small>
      </div>
    </div>}
  </div>
}
