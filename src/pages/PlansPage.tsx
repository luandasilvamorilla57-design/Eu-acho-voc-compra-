import { useEffect,useMemo,useState } from 'react'
import {
  ArrowRight,BadgeCheck,Banknote,BarChart3,Camera,Check,ChevronDown,Crown,
  Flame,LockKeyhole,LogOut,MessageCircle,PackageOpen,RefreshCw,SearchCheck,
  ShieldAlert,ShieldCheck,ShoppingCart,Sparkles,Tag,Target,TrendingDown,
  TrendingUp,WalletCards,Zap
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
  {slug:'start',nome:'Start',preco_mensal:9.90,analises_mes:40,analises_dia:7,destaque:false,descricao:'Para começar a garimpar com mais critério e menos chute.',recursos:['40 análises por mês','Até 7 análises por dia','Score de oportunidade','Preço, risco e teto de compra','Mensagens para negociar','Histórico das análises'],ordem:1},
  {slug:'pro',nome:'Pro',preco_mensal:19.90,analises_mes:120,analises_dia:15,destaque:true,descricao:'Para quem compra para revender e quer ganhar também na saída.',recursos:['120 análises por mês','Até 15 análises por dia','Diagnóstico Premium','20 preparações de venda com IA/mês','Avaliação das fotos do anúncio','Título, descrição e estratégia de preço'],ordem:2},
  {slug:'max',nome:'Max',preco_mensal:34.90,analises_mes:300,analises_dia:30,destaque:false,descricao:'Para quem garimpa todo dia e precisa de volume para girar capital.',recursos:['300 análises por mês','Até 30 análises por dia','Diagnóstico Premium','60 preparações de venda com IA/mês','Avaliação das fotos do anúncio','Título, descrição e estratégia de preço'],ordem:3},
]

const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const perDay=(value:number)=>(value/30).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2})

const operatorProfiles=[
  {icon:ShoppingCart,tag:'REVENDEDOR',title:'Compra barato para vender mais caro',text:'Garimpa produto usado, negocia forte e precisa saber se ainda existe margem antes de fechar.'},
  {icon:SearchCheck,tag:'GARIMPEIRO',title:'Procura oportunidade todo dia',text:'Abre Marketplace e OLX várias vezes por dia e não quer perder tempo com anúncio que não fecha a conta.'},
  {icon:WalletCards,tag:'GIRO DE CAPITAL',title:'Precisa colocar dinheiro no item certo',text:'Cada compra prende caixa. O objetivo é entrar onde existe preço, saída e espaço para negociação.'},
]

const benefits=[
  {icon:Tag,title:'Preço pedido × preço que faz sentido',text:'Entenda se o anúncio está realmente barato ou só parece barato.'},
  {icon:Target,title:'Oferta sugerida e teto',text:'Saiba onde começar a proposta e o máximo que ainda preserva a operação.'},
  {icon:ShieldAlert,title:'Riscos antes de sair de casa',text:'Veja o que precisa perguntar, conferir ou desconfiar antes de perder tempo e dinheiro.'},
  {icon:TrendingUp,title:'Margem de revenda',text:'Analise a compra pensando também na saída e no espaço que sobra para lucro.'},
  {icon:MessageCircle,title:'Negociação pronta',text:'Tenha mensagens naturais para oferta inicial, contraproposta e fechamento.'},
  {icon:Camera,title:'Venda assistida no Pro',text:'Depois da compra, o Pro ajuda a apresentar melhor o item para revender.'},
]

const compareRows=[
  {label:'Análises de oportunidade',start:'40/mês',pro:'120/mês',max:'300/mês'},
  {label:'Limite diário',start:'7/dia',pro:'15/dia',max:'30/dia'},
  {label:'Oferta sugerida + teto de compra',start:'Incluído',pro:'Incluído',max:'Incluído'},
  {label:'Diagnóstico Premium',start:'—',pro:'Incluído',max:'Incluído'},
  {label:'Preparar venda com IA',start:'—',pro:'20/mês',max:'60/mês'},
  {label:'Avaliação de fotos e anúncio',start:'—',pro:'Incluído',max:'Incluído'},
]

const faqs=[
  ['Isso é para quem compra no Marketplace e na OLX?','Sim. O foco do BRIKE RADAR é ajudar quem garimpa anúncios de usados, negocia a compra e quer avaliar se existe espaço para revenda.'],
  ['O Radar garante lucro?','Não. Ele organiza preço, risco, teto de compra e sinais da operação para você decidir melhor. A decisão e o resultado continuam sendo seus.'],
  ['Quando meu acesso é liberado?','Depois que o Mercado Pago confirma o pagamento e o backend do Radar valida a assinatura. A interface sozinha não libera plano.'],
  ['Qual plano faz mais sentido para quem revende?','O Pro concentra os recursos de compra e venda: mais análises, Diagnóstico Premium e Preparar venda com IA.'],
  ['O Start já serve para analisar oportunidades?','Sim. Ele inclui score, preço, riscos, oferta sugerida, teto de compra, negociação e histórico.'],
  ['Posso entrar no painel sem pagar?','Não. Contas sem assinatura confirmada ficam nesta área de planos e as funções protegidas também são bloqueadas no servidor.'],
]

function ValueTick({children}:{children:React.ReactNode}){
  return <span className="plans-value-tick"><Check size={12}/>{children}</span>
}

function DealBoard(){
  return <div className="deal-board">
    <div className="deal-board__top">
      <div>
        <span className="deal-board__eyebrow">EXEMPLO DE ANÁLISE</span>
        <h3>iPhone 13 • 128 GB</h3>
      </div>
      <span className="deal-board__platform">Marketplace</span>
    </div>

    <div className="deal-board__listing">
      <div className="deal-board__photo">
        <div className="deal-board__phone"/>
        <span>anúncio</span>
      </div>
      <div className="deal-board__listing-copy">
        <small>PREÇO PEDIDO</small>
        <strong>R$ 1.900</strong>
        <p>Usado • retirada em mãos</p>
        <div className="deal-board__signal"><span/> anúncio interessante para negociar</div>
      </div>
    </div>

    <div className="deal-board__numbers">
      <div><span>OFERTA INICIAL</span><strong>R$ 1.650</strong></div>
      <div><span>TETO DE COMPRA</span><strong>R$ 1.780</strong></div>
      <div className="is-profit"><span>SAÍDA ESTIMADA*</span><strong>R$ 2.350</strong></div>
    </div>

    <div className="deal-board__bottom">
      <div className="deal-board__score"><span>OPORTUNIDADE</span><strong>8,7</strong><small>/10</small></div>
      <div className="deal-board__warnings">
        <span><Check size={11}/> Conferir bateria</span>
        <span><Check size={11}/> Testar Face ID</span>
        <span><Check size={11}/> Validar IMEI</span>
      </div>
    </div>
    <p className="deal-board__note">*Exemplo visual de como a análise organiza a operação. Valores meramente ilustrativos.</p>
  </div>
}

function PlanCard({plan,busy,onChoose}:{plan:PlanRow;busy:AccountPlan|null;onChoose:(plan:AccountPlan)=>void}){
  const featured=plan.slug==='pro'
  const Icon=plan.slug==='max'?Crown:featured?Sparkles:Zap
  const cta=featured?'Quero o plano Pro':plan.slug==='max'?'Escolher Max':'Começar no Start'
  const micro=featured?'Para quem compra e também revende':plan.slug==='max'?'Para operação de maior volume':'Para começar a garimpar melhor'

  return <article id={featured?'plano-pro':undefined} className={`plan-card plan-reveal relative overflow-hidden rounded-[30px] border p-5 sm:p-6 ${featured?'plan-card--featured border-emerald-300/48 bg-gradient-to-b from-emerald-300/[.12] via-slate-950/80 to-slate-950/96 lg:-translate-y-4':'border-slate-800/90 bg-slate-950/70'}`}>
    {featured&&<div className="plan-card__popular"><Flame size={12}/> MAIS ESCOLHIDO POR QUEM REVENDE</div>}
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${featured?'border-emerald-300/25 bg-emerald-300/10 text-emerald-300':'border-slate-800 bg-slate-900 text-slate-300'}`}><Icon size={21}/></div>
        {!featured&&<span className="plan-card__fit">{plan.slug==='max'?'ALTO VOLUME':'ENTRADA'}</span>}
      </div>

      <h3 className="mt-5 text-[1.45rem] font-black tracking-[-.04em]">{plan.nome}</h3>
      <p className="mt-2 min-h-[42px] text-xs leading-5 text-slate-500">{plan.descricao}</p>

      <div className="mt-6 flex items-end gap-1.5">
        <strong className="text-[2.75rem] font-black leading-none tracking-[-.075em]">{money(plan.preco_mensal)}</strong>
        <span className="pb-1 text-xs text-slate-500">/mês</span>
      </div>
      <div className="mt-2 text-[10px] font-bold tracking-[.08em] text-slate-600">≈ {perDay(plan.preco_mensal)} POR DIA</div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="plan-stat"><strong>{plan.analises_mes}</strong><span>análises / mês</span></div>
        <div className="plan-stat"><strong>{plan.analises_dia}</strong><span>por dia</span></div>
      </div>

      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-700/70 to-transparent"/>

      <ul className="mt-5 grid gap-2.5">
        {plan.recursos.map(item=><li key={item} className="flex gap-2.5 text-xs leading-5 text-slate-300"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-300/10"><Check size={11} className="text-emerald-300"/></span><span>{item}</span></li>)}
      </ul>

      <button onClick={()=>onChoose(plan.slug)} disabled={busy!==null} className={`mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${featured?'plan-cta-pro bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 text-slate-950 shadow-[0_16px_45px_rgba(45,212,191,.20)] hover:scale-[1.01]':'border border-slate-700 bg-slate-900 text-white hover:border-slate-600 hover:bg-slate-800'}`}>
        {busy===plan.slug?'Abrindo pagamento...':<>{cta}<ArrowRight size={16}/></>}
      </button>

      <p className={`mt-3 text-center text-[10px] font-semibold leading-4 ${featured?'text-emerald-300/75':'text-slate-600'}`}>{micro}</p>
    </div>
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
        if(data?.length)setPlans(data.map((p:any)=>({...p,preco_mensal:Number(p.preco_mensal),recursos:Array.isArray(p.recursos)?p.recursos:[]})))
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
    try{
      const {data,error:fnError}=await supabase.functions.invoke('criar-assinatura-mercadopago',{body:{plano:plan}})
      if(fnError)throw fnError
      if(data?.already_active){
        const ok=await onRefreshAccess()
        if(!ok)throw new Error('A assinatura existe, mas o pagamento ainda não foi confirmado.')
        return
      }
      if(!data?.checkout_url)throw new Error(data?.error||'Não foi possível abrir o pagamento.')
      window.location.assign(data.checkout_url)
    }catch(e){
      setError(e instanceof Error?e.message:'Não foi possível iniciar a assinatura.')
      setBusy(null)
    }
  }

  const manualRefresh=async()=>{
    setChecking(true)
    setError('')
    try{
      const ok=await onRefreshAccess()
      if(!ok)setError('Ainda não recebemos a confirmação do pagamento. Se você acabou de pagar, aguarde alguns segundos e tente novamente.')
    }finally{setChecking(false)}
  }

  const pro=plans.find(p=>p.slug==='pro')??fallback[1]

  return <div className="plans-gate min-h-screen text-white">
    <div className="plans-grid-bg pointer-events-none fixed inset-0"/>
    <div className="plans-orb pointer-events-none fixed -left-28 -top-24 h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-[110px]"/>
    <div className="plans-orb plans-orb--delay pointer-events-none fixed -right-36 top-[26%] h-[470px] w-[470px] rounded-full bg-cyan-400/[.07] blur-[125px]"/>

    <header className="plans-header relative z-30 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8">
      <Brand/>
      <button onClick={()=>supabase.auth.signOut()} className="flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-950/55 px-3 py-2 text-xs font-semibold text-slate-400 backdrop-blur transition hover:border-slate-700 hover:text-white"><LogOut size={14}/> Sair</button>
    </header>

    <main className="relative z-10 overflow-hidden">
      <section className="plans-hero mx-auto grid max-w-[1280px] gap-10 px-5 pb-14 pt-4 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:pb-20 lg:pt-12">
        <div className="plan-reveal">
          <div className="plans-account-ready"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-300"/> FEITO PARA QUEM GARIMPA E REVENDE</div>
          <h1 className="plans-hero-title font-display mt-5 max-w-[800px] text-[2.72rem] font-black leading-[.93] tracking-[-.078em] sm:text-[4.35rem] xl:text-[5.15rem]">Compre mais barato no Marketplace e na OLX. <span>Revenda com mais margem e menos chute.</span></h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-slate-400 sm:text-base">O BRIKE RADAR foi feito para quem vive de oportunidade: analisa o anúncio, ajuda a entender o preço, sugere uma oferta, mostra o teto de compra e organiza os riscos antes de você colocar dinheiro na operação.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="platform-chip">Facebook Marketplace</span>
            <span className="platform-chip">OLX</span>
            <span className="platform-chip">Compra de usados</span>
            <span className="platform-chip">Revenda</span>
          </div>

          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
            <ValueTick>Oferta sugerida</ValueTick>
            <ValueTick>Teto de compra</ValueTick>
            <ValueTick>Margem de revenda</ValueTick>
            <ValueTick>Riscos</ValueTick>
            <ValueTick>Negociação</ValueTick>
            <ValueTick>Giro de capital</ValueTick>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#planos" className="plans-primary-cta flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:scale-[1.01]">Quero usar no meu garimpo <ArrowRight size={16}/></a>
            <span className="flex items-center justify-center gap-2 text-[11px] text-slate-600 sm:justify-start"><LockKeyhole size={13}/> O painel só libera depois do pagamento confirmado.</span>
          </div>

          {email&&<div className="mt-4 text-[11px] text-slate-600">Conta conectada: {email}</div>}
        </div>

        <div className="plan-reveal mx-auto w-full max-w-[570px]">
          <DealBoard/>
        </div>
      </section>

      {returned&&<section className="mx-auto max-w-[920px] px-5 pb-4 sm:px-8">
        <div className="plans-payment-return flex flex-col gap-3 rounded-[24px] border border-cyan-300/20 bg-cyan-300/[.08] p-4 text-sm text-cyan-50 sm:flex-row sm:items-center sm:justify-between">
          <div><b>Voltamos do Mercado Pago.</b><div className="mt-1 text-xs leading-5 text-cyan-100/65">{checking?'Estamos validando a confirmação no servidor...':'Se você concluiu o pagamento, valide seu acesso.'}</div></div>
          <button onClick={manualRefresh} disabled={checking} className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-extrabold disabled:opacity-50"><RefreshCw size={14} className={checking?'animate-spin':''}/> Validar acesso</button>
        </div>
      </section>}

      <section className="plans-marquee-wrap border-y border-slate-800/65 bg-slate-950/32">
        <div className="plans-marquee">
          {[...Array(2)].flatMap((_,i)=>['MARKETPLACE','OLX','GARIMPO','OFERTA','TETO DE COMPRA','MARGEM','GIRO','NEGOCIAÇÃO','REVENDA'].map(item=><span key={i+item}><i/> {item}</span>))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="plans-kicker">PARA QUEM É O BRIKE RADAR</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.9rem]">Para quem abre anúncio procurando margem, não só produto.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">Se você compra usado abaixo do preço, negocia e revende, o Radar foi pensado em cima dessa rotina.</p>
        </div>
        <div className="mt-9 grid gap-3 md:grid-cols-3">
          {operatorProfiles.map(({icon:Icon,tag,title,text})=><article key={title} className="operator-card">
            <div className="operator-card__top"><div className="operator-card__icon"><Icon size={19}/></div><span>{tag}</span></div>
            <h3>{title}</h3><p>{text}</p>
          </article>)}
        </div>
      </section>

      <section className="border-y border-slate-800/70 bg-slate-950/30">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:py-20">
          <div>
            <div className="plans-kicker plans-kicker--danger">ONDE A MARGEM SOME</div>
            <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.85rem]">Quem vive de revenda não perde dinheiro só no preço. <span className="text-slate-500">Perde no chute.</span></h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">Oferta alta demais, defeito ignorado, saída ruim e capital parado corroem a operação sem parecer grandes erros no começo.</p>
          </div>
          <div className="plans-before-after">
            <div className="plans-before">
              <div className="plans-compare-head"><TrendingDown size={17}/> NO ACHISMO</div>
              {['“Tá barato, vou pegar”','“Depois eu descubro o defeito”','“Acho que vendo por mais”','“Vou oferecer qualquer valor”'].map(x=><span key={x}>{x}</span>)}
            </div>
            <div className="plans-after">
              <div className="plans-compare-head"><TrendingUp size={17}/> COM BRIKE RADAR</div>
              {['Preço contextualizado','Checklist antes de fechar','Margem pensada na saída','Oferta sugerida + teto de compra'].map(x=><span key={x}><Check size={12}/>{x}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="plans-kicker">DA COMPRA À REVENDA</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.85rem]">Seu lucro começa antes de você buscar o produto.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">O Radar organiza a entrada para você não descobrir tarde demais que pagou demais, esqueceu um risco ou não deixou espaço para negociar a saída.</p>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({icon:Icon,title,text})=><article key={title} className="benefit-card rounded-[25px] border border-slate-800/90 bg-[#091725]/74 p-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300"><Icon size={18}/></div>
            <h3 className="mt-4 font-extrabold tracking-[-.025em]">{title}</h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
          </article>)}
        </div>
      </section>

      <section className="resale-flow-section border-y border-slate-800/70">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="plans-kicker">A OPERAÇÃO COMPLETA</div>
            <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.85rem]">Garimpar. Negociar. Comprar. Preparar. Revender.</h2>
          </div>
          <div className="resale-flow mt-9">
            {[
              ['01','GARIMPE',SearchCheck,'Ache o anúncio que parece abaixo do mercado.'],
              ['02','ANALISE',BarChart3,'Veja preço, risco, teto e margem antes de sair de casa.'],
              ['03','NEGOCIE',MessageCircle,'Entre com uma oferta e saiba até onde ainda faz sentido subir.'],
              ['04','REVENDA',PackageOpen,'No Pro, prepare fotos, título, descrição e estratégia de preço.'],
            ].map(([n,label,Icon,text]:any)=><div className="resale-flow__step" key={n}>
              <span>{n}</span><div><Icon size={18}/></div><strong>{label}</strong><p>{text}</p>
            </div>)}
          </div>
        </div>
      </section>

      <section id="planos" className="fine-scroll mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="plans-kicker"><LockKeyhole size={12}/> ESCOLHA SEU RITMO DE GARIMPO</div>
          <h2 className="font-display mt-4 text-[2.3rem] font-black tracking-[-.065em] sm:text-[3.6rem]">Comece analisando melhor. No Pro, compre e venda melhor.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">O Start cobre a análise da compra. O Pro adiciona a preparação da revenda. O Max aumenta o volume para quem usa a ferramenta todos os dias.</p>
        </div>

        {error&&<div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:items-start">
          {plans.map(plan=><PlanCard key={plan.slug} plan={plan} busy={busy} onChoose={subscribe}/>)}
        </div>

        <div className="pro-reseller-callout mx-auto mt-10 max-w-5xl">
          <div className="pro-reseller-callout__icon"><Banknote size={22}/></div>
          <div><span>POR QUE O PRO É O PLANO DE REVENDA</span><h3>Você usa o Radar na entrada e a IA na saída.</h3><p>Analisa a compra, negocia com teto e depois prepara o anúncio para vender o item com uma apresentação melhor.</p></div>
          <a href="#plano-pro">Ver Pro <ArrowRight size={15}/></a>
        </div>
      </section>

      <section className="border-y border-slate-800/70 bg-slate-950/30">
        <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="plans-kicker">COMPARE SEM ENROLAÇÃO</div>
            <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.8rem]">Escolha pelo seu volume e pelo quanto você quer fazer dentro do Radar.</h2>
          </div>
          <div className="plans-compare-table mt-9 overflow-hidden rounded-[28px] border border-slate-800/90">
            <div className="plans-compare-row plans-compare-row--head"><span>RECURSO</span><b>START</b><b className="is-pro">PRO</b><b>MAX</b></div>
            {compareRows.map(row=><div className="plans-compare-row" key={row.label}><span>{row.label}</span><b>{row.start}</b><b className="is-pro">{row.pro}</b><b>{row.max}</b></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
        <div className="plans-security-card">
          <div className="plans-kicker"><ShieldCheck size={12}/> ACESSO E PAGAMENTO</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em]">Sem assinatura confirmada, não existe atalho para entrar.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">O Mercado Pago processa o pagamento e o backend valida a assinatura antes de liberar o painel e os recursos protegidos.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <ValueTick>Checkout via Mercado Pago</ValueTick>
            <ValueTick>Webhook validado</ValueTick>
            <ValueTick>Plano conferido no backend</ValueTick>
            <ValueTick>Recursos Pro protegidos no servidor</ValueTick>
          </div>
        </div>
        <div className="plans-pro-mini">
          <div className="plans-pro-mini__badge"><Sparkles size={14}/> PARA QUEM REVENDE</div>
          <strong>BRIKE Pro</strong>
          <span>{money(pro.preco_mensal)}/mês</span>
          <p>Mais análises na compra + Diagnóstico Premium + Preparar venda com IA na saída.</p>
          <button onClick={()=>subscribe('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Quero o Pro'}<ArrowRight size={15}/></button>
        </div>
      </section>

      <section className="mx-auto max-w-[940px] px-5 pb-28 sm:px-8 lg:pb-28">
        <div className="text-center">
          <div className="plans-kicker plans-kicker--muted">DÚVIDAS DE QUEM REVENDE</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.8rem]">O essencial antes de assinar.</h2>
        </div>
        <div className="mt-8 grid gap-2">
          {faqs.map(([q,a])=><details key={q} className="plans-faq group rounded-2xl border border-slate-800/90 bg-slate-950/48">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-extrabold text-slate-200"><span>{q}</span><ChevronDown size={16} className="shrink-0 text-slate-600 transition group-open:rotate-180"/></summary>
            <p className="px-4 pb-4 text-xs leading-6 text-slate-500">{a}</p>
          </details>)}
        </div>

        <div className="plans-final-cta mt-10 overflow-hidden rounded-[30px] border border-emerald-300/18 p-6 text-center sm:p-8">
          <div className="relative">
            <div className="plans-kicker mx-auto w-max">PRÓXIMA OPORTUNIDADE</div>
            <h3 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-black tracking-[-.06em] sm:text-[2.7rem]">Quando aparecer aquele anúncio barato, entre sabendo quanto oferecer e até onde vale ir.</h3>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">Escolha o plano que combina com seu volume de garimpo e revenda.</p>
            <a href="#planos" className="mt-6 inline-flex h-[52px] items-center gap-2 rounded-2xl bg-emerald-300 px-6 text-sm font-black text-slate-950 transition hover:scale-[1.01]">Escolher meu plano <ArrowRight size={16}/></a>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-slate-600"><ShieldCheck size={13} className="text-emerald-400/70"/> Pagamento processado pelo Mercado Pago • liberação controlada no servidor.</div>
      </section>
    </main>

    <div className="plans-mobile-sticky lg:hidden">
      <div><span>PARA QUEM REVENDE</span><strong>Pro • {money(pro.preco_mensal)}/mês</strong></div>
      <button onClick={()=>subscribe('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Quero Pro'}<ArrowRight size={15}/></button>
    </div>
  </div>
}
