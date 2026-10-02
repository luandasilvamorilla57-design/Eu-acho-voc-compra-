import { useEffect,useMemo,useState } from 'react'
import {
  ArrowRight,Banknote,BarChart3,Camera,Check,ChevronDown,Crown,
  LockKeyhole,LogOut,MessageCircle,PackageOpen,RefreshCw,SearchCheck,
  ShieldAlert,ShieldCheck,ShoppingBag,Tag,Target,TrendingDown,TrendingUp,
  WalletCards,Zap
} from 'lucide-react'
import { Brand } from '../components/Brand'
import { supabase } from '../lib/supabase'
import type { AccountPlan } from '../types/database'

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

function DealSheet(){
  return <div className="deal-sheet">
    <div className="deal-sheet__header">
      <div>
        <span>OPERAÇÃO EM ANÁLISE</span>
        <strong>iPhone 13 · 128 GB</strong>
      </div>
      <div className="deal-sheet__source">Marketplace</div>
    </div>

    <div className="deal-sheet__listing">
      <div className="deal-sheet__thumb" aria-hidden="true">
        <div className="deal-sheet__phone"/>
      </div>
      <div className="deal-sheet__asking">
        <span>PREÇO DO ANÚNCIO</span>
        <strong>R$ 1.900</strong>
        <small>Usado · retirada em mãos</small>
      </div>
      <div className="deal-sheet__status">
        <span/>
        NEGOCIÁVEL
      </div>
    </div>

    <div className="deal-sheet__ledger">
      <div>
        <span>OFERTA DE ENTRADA</span>
        <strong>R$ 1.650</strong>
      </div>
      <div>
        <span>TETO DE COMPRA</span>
        <strong>R$ 1.780</strong>
      </div>
      <div>
        <span>FAIXA DE SAÍDA*</span>
        <strong>R$ 2.250–2.350</strong>
      </div>
    </div>

    <div className="deal-sheet__decision">
      <div>
        <span>LEITURA DA OPORTUNIDADE</span>
        <strong>Boa para negociar</strong>
      </div>
      <div className="deal-sheet__checks">
        <span><Check size={12}/> bateria</span>
        <span><Check size={12}/> Face ID</span>
        <span><Check size={12}/> IMEI</span>
      </div>
    </div>

    <p className="deal-sheet__footnote">*Exemplo ilustrativo. O Radar organiza informações para decisão; não garante preço de revenda ou lucro.</p>
  </div>
}

function PlanCard({plan,busy,onChoose}:{plan:PlanRow;busy:AccountPlan|null;onChoose:(plan:AccountPlan)=>void}){
  const featured=plan.slug==='pro'
  const Icon=plan.slug==='max'?Crown:Zap
  const cta=featured?'Escolher Pro':plan.slug==='max'?'Escolher Max':'Escolher Start'

  return <article id={featured?'plano-pro':undefined} className={`operator-plan ${featured?'operator-plan--featured':''}`}>
    <div className="operator-plan__head">
      <div>
        <span className="operator-plan__index">0{plan.ordem}</span>
        <span className="operator-plan__name">{plan.nome}</span>
      </div>
      {featured?<span className="operator-plan__recommended">RECOMENDADO PARA REVENDA</span>:<Icon size={18}/>}
    </div>

    <p className="operator-plan__description">{plan.descricao}</p>

    <div className="operator-plan__price">
      <strong>{money(plan.preco_mensal)}</strong>
      <span>/ mês</span>
    </div>
    <div className="operator-plan__daily">aprox. {perDay(plan.preco_mensal)} por dia</div>

    <div className="operator-plan__volume">
      <div><strong>{plan.analises_mes}</strong><span>análises / mês</span></div>
      <div><strong>{plan.analises_dia}</strong><span>por dia</span></div>
    </div>

    <ul className="operator-plan__features">
      {plan.recursos.map(item=><li key={item}><Check size={13}/><span>{item}</span></li>)}
    </ul>

    <button onClick={()=>onChoose(plan.slug)} disabled={busy!==null} className="operator-plan__cta">
      {busy===plan.slug?'Abrindo pagamento...':<>{cta}<ArrowRight size={16}/></>}
    </button>

    {featured&&<p className="operator-plan__micro">Compra + diagnóstico premium + preparação da revenda.</p>}
  </article>
}

export function PlansPage({email,onRefreshAccess}:{email?:string;onRefreshAccess:()=>Promise<boolean>}){
  const [plans,setPlans]=useState<PlanRow[]>(fallback)
  const [busy,setBusy]=useState<AccountPlan|null>(null)
  const [checking,setChecking]=useState(false)
  const [error,setError]=useState('')
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
      const {data,error:fnError}=await supabase.functions.invoke('criar-assinatura-mercadopago',{body:{plano:plan}})
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
          try{checkoutWindow.close()}catch{}
          try{window.focus()}catch{}
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

  return <div className="plans-gate">
    <header className="plans-header">
      <div className="plans-shell plans-header__inner">
        <Brand/>
        <button onClick={()=>supabase.auth.signOut()} className="plans-exit"><LogOut size={15}/> Sair</button>
      </div>
    </header>

    <main>
      <section className="plans-hero">
        <div className="plans-shell plans-hero__grid">
          <div className="plans-hero__copy plan-reveal">
            <div className="plans-eyebrow"><span/> ANÁLISE DE OPORTUNIDADE · MARKETPLACE · OLX</div>
            <h1>
              Compre melhor no Marketplace e na OLX.<br/>
              <em>Revenda com margem.</em>
            </h1>
            <p>O BRIKE RADAR foi criado para quem encontra usados abaixo do preço, negocia a entrada e precisa saber se a operação ainda faz sentido antes de imobilizar dinheiro.</p>

            <div className="plans-hero__facts">
              <div><span>01</span><strong>PREÇO</strong><small>se está interessante</small></div>
              <div><span>02</span><strong>OFERTA</strong><small>quanto propor</small></div>
              <div><span>03</span><strong>RISCO</strong><small>o que conferir</small></div>
            </div>

            <div className="plans-hero__actions">
              <a href="#planos" className="plans-primary-cta">Ver planos e liberar acesso <ArrowRight size={16}/></a>
              <a href="#como-funciona" className="plans-text-link">Ver como funciona</a>
            </div>

            {email&&<div className="plans-account-line"><LockKeyhole size={12}/> Conta conectada: {email}</div>}
          </div>

          <div className="plan-reveal">
            <DealSheet/>
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

      <section className="plans-context-strip">
        <div className="plans-shell">
          <span>FACEBOOK MARKETPLACE</span>
          <span>OLX</span>
          <span>USADOS</span>
          <span>OFERTA</span>
          <span>MARGEM</span>
          <span>GIRO</span>
        </div>
      </section>

      <section className="plans-section">
        <div className="plans-shell">
          <div className="plans-section__intro">
            <span className="plans-section__number">01</span>
            <div>
              <div className="plans-kicker">PARA QUEM É</div>
              <h2>Feito para quem vive de garimpo e revenda.</h2>
              <p>Não é uma ferramenta genérica de IA. O fluxo foi pensado em cima de quem encontra anúncio, negocia a entrada e precisa preservar margem na saída.</p>
            </div>
          </div>

          <div className="operator-grid">
            {profiles.map(({icon:Icon,code,label,title,text})=><article className="operator-card" key={code}>
              <div className="operator-card__meta"><span>{code}</span><b>{label}</b></div>
              <Icon size={22}/>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="plans-section plans-section--contrast">
        <div className="plans-shell plans-problem-grid">
          <div>
            <span className="plans-section__number">02</span>
            <div className="plans-kicker plans-kicker--risk">ONDE O LUCRO SOME</div>
            <h2>O prejuízo quase nunca começa na revenda. Começa na compra errada.</h2>
            <p>Oferta alta demais, problema ignorado e saída superestimada corroem a margem antes do produto chegar na sua mão.</p>
          </div>

          <div className="plans-ledger-compare">
            <div className="plans-ledger-compare__head">
              <span>SEM REFERÊNCIA</span>
              <span>COM BRIKE RADAR</span>
            </div>
            {[
              ['“Parece barato”','Preço analisado no contexto'],
              ['Oferta no impulso','Oferta sugerida + teto'],
              ['Risco visto depois','Checklist antes de fechar'],
              ['“Acho que vendo por mais”','Saída considerada na compra'],
            ].map(([before,after])=><div className="plans-ledger-compare__row" key={before}>
              <span><TrendingDown size={13}/>{before}</span>
              <span><TrendingUp size={13}/>{after}</span>
            </div>)}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="plans-section">
        <div className="plans-shell">
          <div className="plans-section__intro">
            <span className="plans-section__number">03</span>
            <div>
              <div className="plans-kicker">A OPERAÇÃO</div>
              <h2>Da busca no anúncio até a revenda.</h2>
              <p>O Radar entra onde a decisão pesa: na entrada, na negociação e, nos planos Pro e Max, também na preparação da saída.</p>
            </div>
          </div>

          <div className="plans-operation-list">
            {[
              ['01',SearchCheck,'GARIMPE','Encontre um anúncio que pareça abaixo do mercado.'],
              ['02',BarChart3,'ANALISE','Organize preço, risco, oferta e teto antes de fechar.'],
              ['03',MessageCircle,'NEGOCIE','Entre com proposta e saiba até onde ainda vale subir.'],
              ['04',PackageOpen,'REVENDA','No Pro e Max, prepare fotos, texto e estratégia de preço.'],
            ].map(([n,Icon,label,text]:any)=><div className="plans-operation-row" key={n}>
              <span>{n}</span>
              <Icon size={19}/>
              <strong>{label}</strong>
              <p>{text}</p>
            </div>)}
          </div>

          <div className="plans-benefit-grid">
            {benefits.map(({icon:Icon,title,text})=><article key={title}>
              <Icon size={18}/>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section id="planos" className="plans-section plans-section--plans">
        <div className="plans-shell">
          <div className="plans-section__intro plans-section__intro--center">
            <span className="plans-section__number">04</span>
            <div>
              <div className="plans-kicker">PLANOS</div>
              <h2>Escolha pelo seu volume de operação.</h2>
              <p>Start para analisar compras. Pro para comprar e preparar a revenda. Max para quem usa o Radar com frequência maior.</p>
            </div>
          </div>

          {error&&<div className="plans-error">{error}</div>}

          <div className="operator-plans">
            {plans.map(plan=><PlanCard key={plan.slug} plan={plan} busy={busy} onChoose={subscribe}/>)}
          </div>

          <div className="plans-pro-note">
            <div><Banknote size={20}/></div>
            <div>
              <span>POR QUE O PRO É O CENTRO DA OPERAÇÃO</span>
              <strong>Você usa o Radar na entrada e a IA na saída.</strong>
              <p>Analise a compra, negocie com teto e depois prepare o item para voltar ao mercado com uma apresentação melhor.</p>
            </div>
            <a href="#plano-pro">Ver Pro <ArrowRight size={14}/></a>
          </div>
        </div>
      </section>

      <section className="plans-section plans-section--contrast">
        <div className="plans-shell">
          <div className="plans-section__intro plans-section__intro--center">
            <span className="plans-section__number">05</span>
            <div>
              <div className="plans-kicker">COMPARAÇÃO</div>
              <h2>Sem letra miúda. Veja o que muda.</h2>
            </div>
          </div>

          <div className="plans-compare-table">
            <div className="plans-compare-row plans-compare-row--head"><span>RECURSO</span><b>START</b><b className="is-pro">PRO</b><b>MAX</b></div>
            {compareRows.map(row=><div className="plans-compare-row" key={row.label}><span>{row.label}</span><b>{row.start}</b><b className="is-pro">{row.pro}</b><b>{row.max}</b></div>)}
          </div>
        </div>
      </section>

      <section className="plans-section">
        <div className="plans-shell plans-trust-grid">
          <div className="plans-trust">
            <ShieldCheck size={22}/>
            <div className="plans-kicker">ACESSO PROTEGIDO</div>
            <h2>Pagamento confirmado no servidor. Sem atalho pelo navegador.</h2>
            <p>O gateway processa a cobrança e o backend valida a assinatura antes de liberar o painel e os recursos do seu plano.</p>
            <ul>
              <li><Check size={13}/> checkout seguro</li>
              <li><Check size={13}/> webhook validado</li>
              <li><Check size={13}/> plano conferido no backend</li>
              <li><Check size={13}/> recursos premium protegidos no servidor</li>
            </ul>
          </div>

          <div className="plans-pro-box">
            <span>PLANO PARA REVENDA</span>
            <strong>BRIKE Pro</strong>
            <b>{money(pro.preco_mensal)}<small>/mês</small></b>
            <p>Mais análises na compra + Diagnóstico Premium + Preparar venda com IA.</p>
            <button onClick={()=>subscribe('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Escolher Pro'}<ArrowRight size={15}/></button>
          </div>
        </div>
      </section>

      <section className="plans-section plans-faq-section">
        <div className="plans-shell plans-faq-shell">
          <div>
            <span className="plans-section__number">06</span>
            <div className="plans-kicker">DÚVIDAS</div>
            <h2>Antes de colocar o próximo anúncio no Radar.</h2>
          </div>
          <div className="plans-faq-list">
            {faqs.map(([q,a])=><details key={q} className="plans-faq">
              <summary><span>{q}</span><ChevronDown size={16}/></summary>
              <p>{a}</p>
            </details>)}
          </div>
        </div>
      </section>

      <section className="plans-final">
        <div className="plans-shell">
          <div className="plans-final__inner">
            <span>PRÓXIMA OPORTUNIDADE</span>
            <h2>Quando aparecer o anúncio certo, entre sabendo quanto oferecer e onde parar.</h2>
            <p>Escolha o plano que combina com seu ritmo de garimpo e revenda.</p>
            <a href="#planos">Escolher meu plano <ArrowRight size={16}/></a>
          </div>
          <div className="plans-final__security"><ShieldCheck size={13}/> Pagamento processado pelo gateway · acesso validado no servidor.</div>
        </div>
      </section>
    </main>

    <div className="plans-mobile-sticky">
      <div><span>RECOMENDADO PARA REVENDA</span><strong>Pro · {money(pro.preco_mensal)}/mês</strong></div>
      <button onClick={()=>subscribe('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Escolher Pro'}<ArrowRight size={14}/></button>
    </div>
  </div>
}
