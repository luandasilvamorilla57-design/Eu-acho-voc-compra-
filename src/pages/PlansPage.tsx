import { useEffect,useMemo,useState } from 'react'
import {
  ArrowRight,BarChart3,BadgeCheck,Camera,Check,ChevronDown,CircleDollarSign,
  Clock3,Crown,Flame,Gauge,LockKeyhole,LogOut,MessageCircle,RefreshCw,
  SearchCheck,ShieldAlert,ShieldCheck,Sparkles,Target,TrendingDown,
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
  {
    slug:'start',nome:'Start',preco_mensal:9.90,analises_mes:40,analises_dia:7,destaque:false,
    descricao:'Para parar de comprar no escuro sem pesar no bolso.',
    recursos:['40 análises por mês','Até 7 análises por dia','Score de oportunidade','Preço, risco e teto de compra','Mensagens para negociar','Histórico das análises'],ordem:1
  },
  {
    slug:'pro',nome:'Pro',preco_mensal:19.90,analises_mes:120,analises_dia:15,destaque:true,
    descricao:'Para quem quer comprar melhor e também vender melhor.',
    recursos:['120 análises por mês','Até 15 análises por dia','Diagnóstico Premium','20 preparações de venda com IA/mês','Avaliação das fotos do anúncio','Título, descrição e estratégia de preço'],ordem:2
  },
  {
    slug:'max',nome:'Max',preco_mensal:34.90,analises_mes:300,analises_dia:30,destaque:false,
    descricao:'Para uso intenso, garimpo frequente e maior volume.',
    recursos:['300 análises por mês','Até 30 análises por dia','Diagnóstico Premium','60 preparações de venda com IA/mês','Avaliação das fotos do anúncio','Título, descrição e estratégia de preço'],ordem:3
  },
]

const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const perDay=(value:number)=>(value/30).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2})

const pains=[
  {icon:WalletCards,eyebrow:'PREÇO',title:'Pagar mais do que vale',text:'Sem referência, o desconto parece bom até você descobrir que o preço real era ainda menor.'},
  {icon:ShieldAlert,eyebrow:'RISCO',title:'Descobrir o problema tarde',text:'Defeito, procedência e detalhe ignorado aparecem depois — quando o dinheiro já saiu da sua mão.'},
  {icon:TrendingDown,eyebrow:'MARGEM',title:'Comprar sem espaço para lucro',text:'Uma compra apertada prende capital e pode transformar uma revenda promissora em dor de cabeça.'},
]

const benefits=[
  {icon:SearchCheck,title:'Diagnóstico objetivo',text:'Produto, condição, sinais de risco e informações que ainda precisam ser confirmadas.'},
  {icon:Gauge,title:'Score da oportunidade',text:'Uma leitura rápida para separar anúncio interessante de anúncio que merece cautela.'},
  {icon:Target,title:'Oferta e teto de compra',text:'Saiba onde começar a negociação e qual limite não faz sentido ultrapassar.'},
  {icon:MessageCircle,title:'Negociação pronta',text:'Mensagens naturais para primeiro contato, contraproposta e fechamento.'},
  {icon:Camera,title:'Venda assistida no Pro',text:'Fotos avaliadas, anúncio estruturado e estratégia de preço para publicar melhor.'},
  {icon:BarChart3,title:'Histórico que vira contexto',text:'Suas análises e resultados ajudam você a enxergar padrões no que compra e vende.'},
]

const compareRows=[
  {label:'Análises com score, risco e teto',start:'40/mês',pro:'120/mês',max:'300/mês'},
  {label:'Limite diário de análises',start:'7/dia',pro:'15/dia',max:'30/dia'},
  {label:'Mensagens de negociação',start:'Incluído',pro:'Incluído',max:'Incluído'},
  {label:'Diagnóstico Premium',start:'—',pro:'Incluído',max:'Incluído'},
  {label:'Preparar venda com IA',start:'—',pro:'20/mês',max:'60/mês'},
  {label:'Avaliação das fotos',start:'—',pro:'Incluído',max:'Incluído'},
]

const howItWorks=[
  {n:'01',icon:SearchCheck,title:'Cole o anúncio',text:'Envie o link, os prints ou os dados do produto que você está avaliando.'},
  {n:'02',icon:Gauge,title:'O Radar cruza os sinais',text:'Preço, risco, margem, liquidez, pontos de atenção e estratégia de negociação.'},
  {n:'03',icon:Target,title:'Você decide com limite',text:'Receba oferta sugerida, teto de compra e checklist antes de colocar dinheiro.'},
]

const faqs=[
  ['Quando meu acesso é liberado?','Depois que o Mercado Pago confirma o pagamento e o backend do Radar valida a assinatura. A interface sozinha não consegue liberar um plano.'],
  ['Por que o Pro é o plano mais destacado?','Porque ele combina mais análises com os recursos de Diagnóstico Premium e Preparar venda com IA, sem chegar ao volume do Max.'],
  ['O Start já analisa anúncios?','Sim. O Start inclui as funções principais de análise, score de oportunidade, faixa de preço, riscos, teto de compra e negociação.'],
  ['O que o Pro adiciona?','Diagnóstico Premium, avaliação das fotos e Preparar venda com IA para transformar um item em anúncio mais bem apresentado.'],
  ['Posso entrar no painel sem pagar?','Não. Contas sem assinatura confirmada ficam nesta área de planos e as funções principais também são protegidas no servidor.'],
  ['O pagamento fica armazenado no Radar?','O processamento é feito pelo Mercado Pago. O Radar recebe os eventos necessários para controlar assinatura e acesso.'],
]

function ValueTick({children}:{children:React.ReactNode}){
  return <span className="plans-value-tick"><Check size={12}/>{children}</span>
}

function PlanCard({plan,busy,onChoose}:{plan:PlanRow;busy:AccountPlan|null;onChoose:(plan:AccountPlan)=>void}){
  const featured=plan.slug==='pro'
  const Icon=plan.slug==='max'?Crown:featured?Sparkles:Zap
  const cta=featured?'Quero o BRIKE Pro':plan.slug==='max'?'Escolher Max':'Começar no Start'
  const micro=featured?'Melhor equilíbrio entre preço, volume e recursos premium':plan.slug==='max'?'Para quem usa o Radar com frequência':'A porta de entrada para comprar com mais critério'

  return <article id={featured?'plano-pro':undefined} className={`plan-card plan-reveal relative overflow-hidden rounded-[32px] border p-5 sm:p-6 ${featured?'plan-card--featured border-emerald-300/50 bg-gradient-to-b from-emerald-300/[.14] via-slate-950/78 to-slate-950/96 lg:-translate-y-4':'border-slate-800/90 bg-slate-950/68'}`}>
    <div className="plan-card__noise"/>
    {featured&&<>
      <div className="plan-card__popular"><Flame size={12}/> MAIS ESCOLHIDO</div>
      <div className="plan-card__halo"/>
    </>}

    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${featured?'border-emerald-300/25 bg-emerald-300/10 text-emerald-300':'border-slate-800 bg-slate-900 text-slate-300'}`}><Icon size={21}/></div>
        {!featured&&<span className="plan-card__fit">{plan.slug==='max'?'USO INTENSO':'ESSENCIAL'}</span>}
      </div>

      <h3 className="mt-5 text-[1.45rem] font-black tracking-[-.04em]">{plan.nome}</h3>
      <p className="mt-2 min-h-[42px] text-xs leading-5 text-slate-500">{plan.descricao}</p>

      <div className="mt-6 flex items-end gap-1.5">
        <strong className="text-[2.75rem] font-black leading-none tracking-[-.075em]">{money(plan.preco_mensal)}</strong>
        <span className="pb-1 text-xs text-slate-500">/mês</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] font-bold tracking-[.08em] text-slate-600">
        <span>≈ {perDay(plan.preco_mensal)} POR DIA</span>
        {featured&&<span className="rounded-full bg-emerald-300/10 px-2 py-1 text-emerald-300">CUSTO-BENEFÍCIO</span>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="plan-stat"><strong>{plan.analises_mes}</strong><span>análises / mês</span></div>
        <div className="plan-stat"><strong>{plan.analises_dia}</strong><span>por dia</span></div>
      </div>

      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-slate-700/70 to-transparent"/>

      <ul className="mt-5 grid gap-2.5">
        {plan.recursos.map(item=><li key={item} className="flex gap-2.5 text-xs leading-5 text-slate-300"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-300/10"><Check size={11} className="text-emerald-300"/></span><span>{item}</span></li>)}
      </ul>

      <button
        onClick={()=>onChoose(plan.slug)}
        disabled={busy!==null}
        className={`mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${featured?'plan-cta-pro bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 text-slate-950 shadow-[0_16px_45px_rgba(45,212,191,.22)] hover:scale-[1.01]':'border border-slate-700 bg-slate-900 text-white hover:border-slate-600 hover:bg-slate-800'}`}
      >
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
    <div className="plans-grain pointer-events-none fixed inset-0"/>
    <div className="plans-orb pointer-events-none fixed -left-28 -top-24 h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-[105px]"/>
    <div className="plans-orb plans-orb--delay pointer-events-none fixed -right-36 top-[28%] h-[470px] w-[470px] rounded-full bg-cyan-400/10 blur-[125px]"/>

    <header className="plans-header relative z-30 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8">
      <Brand/>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-xl border border-emerald-300/10 bg-emerald-300/[.05] px-3 py-2 text-[10px] font-bold text-emerald-200/75 sm:flex"><ShieldCheck size={13}/> CONTA PROTEGIDA</span>
        <button onClick={()=>supabase.auth.signOut()} className="flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-950/55 px-3 py-2 text-xs font-semibold text-slate-400 backdrop-blur transition hover:border-slate-700 hover:text-white"><LogOut size={14}/> Sair</button>
      </div>
    </header>

    <main className="relative z-10 overflow-hidden">
      <section className="plans-hero mx-auto grid max-w-[1280px] gap-10 px-5 pb-14 pt-4 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:pb-20 lg:pt-12">
        <div className="plan-reveal">
          <div className="plans-account-ready"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-300"/> CONTA CRIADA • AGORA ESCOLHA SEU ACESSO</div>
          <h1 className="plans-hero-title font-display mt-5 max-w-[790px] text-[2.7rem] font-black leading-[.92] tracking-[-.078em] sm:text-[4.35rem] xl:text-[5.2rem]">Pare de comprar no escuro. <span>Descubra se é oportunidade ou prejuízo antes de pagar.</span></h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-slate-400 sm:text-base">O BRIKE RADAR transforma anúncio, preço e condição em uma leitura prática: <b className="font-semibold text-slate-200">quanto vale, quanto oferecer, o que conferir e até onde a compra ainda faz sentido.</b></p>

          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
            <ValueTick>Preço justo</ValueTick>
            <ValueTick>Teto de compra</ValueTick>
            <ValueTick>Score 0–100</ValueTick>
            <ValueTick>Riscos</ValueTick>
            <ValueTick>Negociação</ValueTick>
            <ValueTick>Revenda</ValueTick>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#planos" className="plans-primary-cta flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:scale-[1.01]">Ver planos e liberar acesso <ArrowRight size={16}/></a>
            <span className="flex items-center justify-center gap-2 text-[11px] text-slate-600 sm:justify-start"><LockKeyhole size={13}/> Sem pagamento confirmado, o painel continua bloqueado.</span>
          </div>

          {email&&<div className="mt-4 text-[11px] text-slate-600">Conta conectada: {email}</div>}
        </div>

        <div className="plan-reveal relative mx-auto w-full max-w-[550px]">
          <div className="radar-core plans-radar-card relative aspect-square overflow-hidden rounded-[40px] border border-emerald-300/20 bg-slate-950/72 p-6 sm:p-8">
            <div className="plans-radar-glow"/>
            <div className="absolute inset-[10%] rounded-full border border-emerald-300/10"/>
            <div className="absolute inset-[24%] rounded-full border border-emerald-300/10"/>
            <div className="absolute inset-[38%] rounded-full border border-emerald-300/10"/>
            <div className="absolute bottom-1/2 left-[9%] right-[9%] border-t border-emerald-300/10"/>
            <div className="absolute bottom-[9%] top-[9%] left-1/2 border-l border-emerald-300/10"/>
            <div className="radar-sweep absolute left-1/2 top-1/2 h-[43%] w-[43%] -translate-x-full -translate-y-full"/>
            <div className="pulse-dot absolute left-[31%] top-[28%] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(52,211,153,.9)]"/>
            <div className="pulse-dot absolute right-[26%] top-[41%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.85)]" style={{animationDelay:'-.8s'}}/>
            <div className="pulse-dot absolute bottom-[30%] left-[39%] h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,.8)]" style={{animationDelay:'-1.25s'}}/>

            <div className="plans-radar-score">
              <span>OPORTUNIDADE</span>
              <strong>84</strong>
              <small>/100</small>
            </div>

            <div className="absolute inset-x-5 bottom-5 rounded-[25px] border border-slate-800/90 bg-[#081521]/94 p-4 backdrop-blur sm:inset-x-8 sm:bottom-8">
              <div className="flex items-center justify-between gap-3">
                <div><div className="text-[9px] font-black tracking-[.17em] text-emerald-300">ANTES DE FECHAR</div><div className="mt-1 text-lg font-extrabold tracking-[-.03em]">Você quer respostas, não achismo.</div></div>
                <BadgeCheck size={27} className="shrink-0 text-emerald-300"/>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="plans-radar-mini"><b>R$ 420</b><span>oferta</span></div>
                <div className="plans-radar-mini"><b>R$ 470</b><span>teto</span></div>
                <div className="plans-radar-mini"><b>Baixo</b><span>risco</span></div>
              </div>
            </div>
          </div>
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
          {[...Array(2)].flatMap((_,i)=>['PREÇO JUSTO','RISCO','TETO DE COMPRA','ROI','NEGOCIAÇÃO','CHECKLIST','REVENDABILIDADE','FOTOS','ANÚNCIO'].map(item=><span key={i+item}><i/> {item}</span>))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="plans-kicker plans-kicker--danger">O CUSTO DO ACHISMO</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.9rem]">O problema não é encontrar anúncio. <span className="text-slate-500">É descobrir tarde demais que a conta não fechava.</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">Uma decisão ruim pode custar em preço, reparo, tempo parado ou margem de revenda. O Radar existe para colocar esses sinais na mesa antes da compra.</p>
        </div>
        <div className="mt-9 grid gap-3 md:grid-cols-3">
          {pains.map(({icon:Icon,eyebrow,title,text})=><article key={title} className="pain-card plan-reveal rounded-[26px] border border-slate-800/90 bg-slate-950/50 p-5">
            <div className="flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-400/10 text-rose-300"><Icon size={18}/></div><span className="text-[9px] font-black tracking-[.16em] text-rose-300/55">{eyebrow}</span></div>
            <h3 className="mt-5 text-lg font-extrabold tracking-[-.03em]">{title}</h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
          </article>)}
        </div>
      </section>

      <section className="border-y border-slate-800/70 bg-slate-950/30">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:py-20">
          <div>
            <div className="plans-kicker">NO ACHISMO × COM RADAR</div>
            <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.85rem]">Troque “acho que compensa” por uma decisão com limite.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">O Radar não compra por você. Ele organiza os sinais que mais pesam na decisão para você negociar com mais clareza.</p>
          </div>
          <div className="plans-before-after">
            <div className="plans-before">
              <div className="plans-compare-head"><TrendingDown size={17}/> SEM RADAR</div>
              {['“Parece barato”','“Acho que dá para revender”','“Depois eu vejo o defeito”','“Vou oferecer qualquer valor”'].map(x=><span key={x}>{x}</span>)}
            </div>
            <div className="plans-after">
              <div className="plans-compare-head"><TrendingUp size={17}/> COM RADAR</div>
              {['Faixa de preço e score','Margem e revenda estimada','Riscos e checklist específico','Oferta sugerida e teto de compra'].map(x=><span key={x}><Check size={12}/>{x}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="plans-kicker">O QUE ENTRA NA SUA DECISÃO</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.85rem]">Menos dúvida. Mais contexto para negociar.</h2>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({icon:Icon,title,text})=><article key={title} className="benefit-card rounded-[25px] border border-slate-800/90 bg-[#091725]/74 p-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300"><Icon size={18}/></div>
            <h3 className="mt-4 font-extrabold tracking-[-.025em]">{title}</h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
          </article>)}
        </div>
      </section>

      <section className="plans-how border-y border-slate-800/70">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="plans-kicker">3 PASSOS PARA SAIR DO ESCURO</div>
            <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.85rem]">Do anúncio à decisão sem transformar tudo em planilha.</h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {howItWorks.map(({n,icon:Icon,title,text})=><div key={n} className="plans-step">
              <span className="plans-step__number">{n}</span>
              <div className="plans-step__icon"><Icon size={19}/></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>)}
          </div>
        </div>
      </section>

      <section id="planos" className="fine-scroll mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="plans-kicker"><LockKeyhole size={12}/> ACESSO PROTEGIDO</div>
          <h2 className="font-display mt-4 text-[2.3rem] font-black tracking-[-.065em] sm:text-[3.6rem]">Escolha o nível de radar que cabe no seu ritmo.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">Todos os planos são liberados somente após a confirmação do pagamento no backend. O Pro concentra os recursos premium e continua sendo a escolha mais equilibrada.</p>
        </div>

        {error&&<div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:items-start">
          {plans.map(plan=><PlanCard key={plan.slug} plan={plan} busy={busy} onChoose={subscribe}/>)}
        </div>

        <div className="plans-pro-proof mx-auto mt-10 max-w-5xl">
          <div className="plans-pro-proof__icon"><CircleDollarSign size={22}/></div>
          <div>
            <div className="plans-kicker">UMA REFERÊNCIA SIMPLES DE VALOR</div>
            <h3>Negociar R$ 50 a menos em uma única compra já supera dois meses do Pro.</h3>
            <p>O objetivo não é prometer economia. É mostrar por que ter limite, preço e risco na mesma tela pode valer muito mais do que decidir no impulso.</p>
          </div>
          <a href="#plano-pro">Ver Pro <ArrowRight size={15}/></a>
        </div>
      </section>

      <section className="border-y border-slate-800/70 bg-slate-950/30">
        <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="plans-kicker">COMPARE SEM LETRA MIÚDA</div>
            <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.8rem]">O que muda de verdade entre Start, Pro e Max.</h2>
          </div>
          <div className="plans-compare-table mt-9 overflow-hidden rounded-[28px] border border-slate-800/90">
            <div className="plans-compare-row plans-compare-row--head">
              <span>RECURSO</span><b>START</b><b className="is-pro">PRO</b><b>MAX</b>
            </div>
            {compareRows.map(row=><div className="plans-compare-row" key={row.label}>
              <span>{row.label}</span>
              <b>{row.start}</b>
              <b className="is-pro">{row.pro}</b>
              <b>{row.max}</b>
            </div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
        <div className="plans-security-card">
          <div className="plans-kicker"><ShieldCheck size={12}/> PAGAMENTO E ACESSO</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em]">Seu plano não é liberado por um botão escondido no navegador.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">O pagamento é processado pelo Mercado Pago e o acesso é validado no servidor. Se a assinatura não estiver confirmada, as funções protegidas continuam bloqueadas.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <ValueTick>Checkout via Mercado Pago</ValueTick>
            <ValueTick>Webhook validado</ValueTick>
            <ValueTick>Plano conferido no backend</ValueTick>
            <ValueTick>Recursos Pro protegidos no servidor</ValueTick>
          </div>
        </div>
        <div className="plans-pro-mini">
          <div className="plans-pro-mini__badge"><Sparkles size={14}/> RECOMENDADO</div>
          <strong>BRIKE Pro</strong>
          <span>{money(pro.preco_mensal)}/mês</span>
          <p>Para usar o Radar na compra e ainda transformar fotos em anúncio com IA.</p>
          <button onClick={()=>subscribe('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Escolher Pro'}<ArrowRight size={15}/></button>
        </div>
      </section>

      <section className="mx-auto max-w-[940px] px-5 pb-28 sm:px-8 lg:pb-28">
        <div className="text-center">
          <div className="plans-kicker plans-kicker--muted">DÚVIDAS ANTES DE ENTRAR</div>
          <h2 className="font-display mt-3 text-3xl font-black tracking-[-.055em] sm:text-[2.8rem]">O essencial, sem enrolação.</h2>
        </div>
        <div className="mt-8 grid gap-2">
          {faqs.map(([q,a])=><details key={q} className="plans-faq group rounded-2xl border border-slate-800/90 bg-slate-950/48">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-extrabold text-slate-200"><span>{q}</span><ChevronDown size={16} className="shrink-0 text-slate-600 transition group-open:rotate-180"/></summary>
            <p className="px-4 pb-4 text-xs leading-6 text-slate-500">{a}</p>
          </details>)}
        </div>

        <div className="plans-final-cta mt-10 overflow-hidden rounded-[30px] border border-emerald-300/18 p-6 text-center sm:p-8">
          <div className="plans-final-cta__glow"/>
          <div className="relative">
            <div className="plans-kicker mx-auto w-max">PRONTO PARA USAR</div>
            <h3 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-black tracking-[-.06em] sm:text-[2.7rem]">Escolha seu plano e coloque o próximo anúncio no radar antes de colocar dinheiro na compra.</h3>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">Seu acesso é liberado somente depois da confirmação do pagamento.</p>
            <a href="#planos" className="mt-6 inline-flex h-[52px] items-center gap-2 rounded-2xl bg-emerald-300 px-6 text-sm font-black text-slate-950 transition hover:scale-[1.01]">Escolher meu plano <ArrowRight size={16}/></a>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-slate-600"><ShieldCheck size={13} className="text-emerald-400/70"/> Pagamento processado pelo Mercado Pago • liberação controlada no servidor.</div>
      </section>
    </main>

    <div className="plans-mobile-sticky lg:hidden">
      <div><span>MAIS ESCOLHIDO</span><strong>Pro • {money(pro.preco_mensal)}/mês</strong></div>
      <button onClick={()=>subscribe('pro')} disabled={busy!==null}>{busy==='pro'?'Abrindo...':'Escolher Pro'}<ArrowRight size={15}/></button>
    </div>
  </div>
}
