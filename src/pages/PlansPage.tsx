import { useEffect,useMemo,useState } from 'react'
import {
  ArrowRight,BarChart3,BadgeCheck,Camera,Check,Crown,Flame,LockKeyhole,
  LogOut,MessageCircle,RefreshCw,SearchCheck,ShieldAlert,ShieldCheck,Sparkles,
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
  {slug:'start',nome:'Start',preco_mensal:9.90,analises_mes:40,analises_dia:7,destaque:false,descricao:'Para parar de comprar no escuro sem pesar no bolso.',recursos:['40 análises por mês','Até 7 análises por dia','Score de oportunidade','Preço, risco e teto de compra','Mensagens para negociar','Histórico das análises'],ordem:1},
  {slug:'pro',nome:'Pro',preco_mensal:19.90,analises_mes:120,analises_dia:15,destaque:true,descricao:'Para quem quer comprar melhor e também vender melhor.',recursos:['120 análises por mês','Até 15 análises por dia','Tudo do Start','Diagnóstico Premium','Preparar venda com IA','Avaliação das fotos do anúncio'],ordem:2},
  {slug:'max',nome:'Max',preco_mensal:34.90,analises_mes:300,analises_dia:30,destaque:false,descricao:'Para uso intenso, garimpo frequente e maior volume.',recursos:['300 análises por mês','Até 30 análises por dia','Tudo do Pro','Diagnóstico Premium','Preparar venda com IA','Maior franquia para uso intenso'],ordem:3},
]

const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const perDay=(value:number)=>(value/30).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2})

const painPoints=[
  {icon:ShieldAlert,title:'Defeito escondido',text:'O barato pode sair caro quando o problema só aparece depois da compra.'},
  {icon:WalletCards,title:'Preço errado',text:'Sem referência, é fácil pagar acima do que aquele produto realmente vale.'},
  {icon:TrendingUp,title:'Margem que some',text:'Para revender, uma compra ruim pode apagar o lucro de várias oportunidades boas.'},
]

const benefits=[
  {icon:SearchCheck,title:'Diagnóstico em segundos',text:'Produto, preço, condição, riscos e pontos que precisam ser confirmados antes de pagar.'},
  {icon:BarChart3,title:'Score de oportunidade',text:'Bata o olho e entenda se o anúncio merece atenção ou se é melhor seguir procurando.'},
  {icon:WalletCards,title:'Quanto oferecer',text:'Receba oferta agressiva, equilibrada e teto de compra para não negociar no escuro.'},
  {icon:MessageCircle,title:'Negociação pronta',text:'Mensagens naturais para primeiro contato, contraproposta e fechamento.'},
  {icon:Camera,title:'Venda melhor no Pro',text:'Avalie suas fotos e prepare título, descrição e estratégia de preço com IA.'},
  {icon:ShieldCheck,title:'Decisão mais segura',text:'Checklist específico do produto e alertas de risco antes de colocar seu dinheiro.'},
]

function PlanCard({plan,busy,onChoose}:{plan:PlanRow;busy:AccountPlan|null;onChoose:(plan:AccountPlan)=>void}){
  const Icon=plan.slug==='max'?Crown:plan.slug==='pro'?Sparkles:Zap
  const featured=plan.slug==='pro'
  return <article className={`plan-card plan-reveal relative overflow-hidden rounded-[30px] border p-5 sm:p-6 ${featured?'plan-card--featured border-emerald-400/45 bg-gradient-to-b from-emerald-400/[.13] via-slate-950/75 to-slate-950/95 lg:-translate-y-3':'border-slate-800/90 bg-slate-950/66'}`}>
    {featured&&<div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-emerald-300 px-3 py-1.5 text-[9px] font-black tracking-[.12em] text-slate-950 shadow-[0_8px_30px_rgba(52,211,153,.25)]"><Flame size={12}/> MAIS ESCOLHIDO</div>}
    <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${featured?'border-emerald-300/25 bg-emerald-300/10 text-emerald-300':'border-slate-800 bg-slate-900 text-slate-300'}`}><Icon size={21}/></div>
    <div className="mt-5 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[1.35rem] font-extrabold tracking-[-.03em]">{plan.nome}</h2>
        <p className="mt-2 max-w-[26rem] text-xs leading-5 text-slate-500">{plan.descricao}</p>
      </div>
    </div>

    <div className="mt-6 flex items-end gap-1.5">
      <strong className="text-[2.5rem] font-black leading-none tracking-[-.07em]">{money(plan.preco_mensal)}</strong>
      <span className="pb-1 text-xs text-slate-500">/mês</span>
    </div>
    <div className="mt-2 text-[10px] font-semibold tracking-[.08em] text-slate-600">≈ {perDay(plan.preco_mensal)} POR DIA</div>

    <div className="mt-5 grid grid-cols-2 gap-2">
      <div className="rounded-2xl border border-slate-800/90 bg-black/15 p-3.5"><strong className="text-xl tracking-[-.04em]">{plan.analises_mes}</strong><span className="mt-1 block text-[10px] text-slate-500">análises por mês</span></div>
      <div className="rounded-2xl border border-slate-800/90 bg-black/15 p-3.5"><strong className="text-xl tracking-[-.04em]">{plan.analises_dia}</strong><span className="mt-1 block text-[10px] text-slate-500">por dia</span></div>
    </div>

    <ul className="mt-5 grid gap-2.5">
      {plan.recursos.map(item=><li key={item} className="flex gap-2.5 text-xs leading-5 text-slate-300"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/10"><Check size={11} className="text-emerald-300"/></span><span>{item}</span></li>)}
    </ul>

    <button
      onClick={()=>onChoose(plan.slug)}
      disabled={busy!==null}
      className={`mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${featured?'plan-cta-pro bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 text-slate-950 shadow-[0_14px_40px_rgba(45,212,191,.2)] hover:scale-[1.01]':'border border-slate-700 bg-slate-900 text-white hover:border-slate-600 hover:bg-slate-800'}`}
    >
      {busy===plan.slug?'Abrindo pagamento...':<>Escolher {plan.nome}<ArrowRight size={16}/></>}
    </button>

    {featured&&<div className="mt-3 text-center text-[10px] font-semibold text-emerald-300/75">Maior equilíbrio entre volume e recursos premium</div>}
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

  return <div className="plans-gate min-h-screen text-white">
    <div className="plans-grid-bg pointer-events-none fixed inset-0"/>
    <div className="plans-orb pointer-events-none fixed -left-28 -top-24 h-[380px] w-[380px] rounded-full bg-emerald-400/10 blur-[105px]"/>
    <div className="plans-orb plans-orb--delay pointer-events-none fixed -right-36 top-[28%] h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-[120px]"/>

    <header className="relative z-20 mx-auto flex max-w-[1260px] items-center justify-between px-5 py-5 sm:px-8">
      <Brand/>
      <button onClick={()=>supabase.auth.signOut()} className="flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-950/55 px-3 py-2 text-xs font-semibold text-slate-400 backdrop-blur transition hover:border-slate-700 hover:text-white"><LogOut size={14}/> Sair</button>
    </header>

    <main className="relative z-10">
      <section className="mx-auto grid max-w-[1260px] gap-9 px-5 pb-12 pt-5 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-20 lg:pt-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-1.5 text-[10px] font-black tracking-[.16em] text-emerald-300"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-300"/> SUA CONTA ESTÁ PRONTA</div>
          <h1 className="font-display mt-5 max-w-[780px] text-[2.65rem] font-black leading-[.93] tracking-[-.075em] sm:text-[4.2rem] xl:text-[5rem]">Antes de gastar seu dinheiro, <span className="text-emerald-300">coloque o anúncio no radar.</span></h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-slate-400 sm:text-base">Comprar usado sem referência é decidir no escuro. O Radar do Brique transforma anúncio, preço e condição em uma decisão clara: <b className="font-semibold text-slate-200">quanto vale, quanto oferecer, o que pode dar errado e onde está sua margem.</b></p>
          <div className="mt-7 flex flex-wrap gap-2">
            {['Preço justo','Teto de compra','Riscos','Negociação','Revenda'].map(item=><span key={item} className="rounded-full border border-slate-800 bg-slate-950/45 px-3 py-2 text-[11px] font-semibold text-slate-400">{item}</span>)}
          </div>
          <a href="#planos" className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:scale-[1.01]">Ver planos <ArrowRight size={16}/></a>
          {email&&<div className="mt-4 text-[11px] text-slate-600">Conta: {email}</div>}
        </div>

        <div className="relative mx-auto w-full max-w-[540px]">
          <div className="radar-core relative aspect-square overflow-hidden rounded-[38px] border border-emerald-300/20 bg-slate-950/70 p-6 sm:p-8">
            <div className="absolute inset-[12%] rounded-full border border-emerald-300/10"/>
            <div className="absolute inset-[25%] rounded-full border border-emerald-300/10"/>
            <div className="absolute inset-[38%] rounded-full border border-emerald-300/10"/>
            <div className="absolute bottom-1/2 left-[10%] right-[10%] border-t border-emerald-300/10"/>
            <div className="absolute bottom-[10%] top-[10%] left-1/2 border-l border-emerald-300/10"/>
            <div className="radar-sweep absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-full -translate-y-full"/>
            <div className="pulse-dot absolute left-[32%] top-[29%] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(52,211,153,.9)]"/>
            <div className="pulse-dot absolute right-[27%] top-[41%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.85)]" style={{animationDelay:'-.8s'}}/>
            <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-slate-800/90 bg-[#081521]/92 p-4 backdrop-blur sm:inset-x-8 sm:bottom-8">
              <div className="flex items-center justify-between gap-3">
                <div><div className="text-[9px] font-black tracking-[.17em] text-emerald-300">ANTES DE FECHAR</div><div className="mt-1 text-lg font-extrabold tracking-[-.03em]">Você quer respostas, não achismo.</div></div>
                <BadgeCheck size={26} className="shrink-0 text-emerald-300"/>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-800 bg-black/20 px-2 py-3"><b className="block text-sm text-white">R$</b><span className="mt-1 block text-[9px] text-slate-500">preço</span></div>
                <div className="rounded-xl border border-slate-800 bg-black/20 px-2 py-3"><b className="block text-sm text-white">0–100</b><span className="mt-1 block text-[9px] text-slate-500">score</span></div>
                <div className="rounded-xl border border-slate-800 bg-black/20 px-2 py-3"><b className="block text-sm text-white">✓</b><span className="mt-1 block text-[9px] text-slate-500">checklist</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {returned&&<section className="mx-auto max-w-[900px] px-5 sm:px-8">
        <div className="flex flex-col gap-3 rounded-[24px] border border-cyan-300/20 bg-cyan-300/[.08] p-4 text-sm text-cyan-50 sm:flex-row sm:items-center sm:justify-between">
          <div><b>Pagamento enviado ao Mercado Pago.</b><div className="mt-1 text-xs leading-5 text-cyan-100/65">{checking?'Estamos validando a confirmação no servidor...':'Se você concluiu o pagamento, atualize o acesso.'}</div></div>
          <button onClick={manualRefresh} disabled={checking} className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-extrabold disabled:opacity-50"><RefreshCw size={14} className={checking?'animate-spin':''}/> Validar acesso</button>
        </div>
      </section>}

      <section className="mx-auto max-w-[1260px] px-5 py-12 sm:px-8 lg:py-16">
        <div className="text-center">
          <div className="text-[10px] font-black tracking-[.18em] text-rose-300">O CUSTO DO ACHISMO</div>
          <h2 className="font-display mx-auto mt-3 max-w-3xl text-3xl font-extrabold tracking-[-.05em] sm:text-[2.7rem]">O problema não é encontrar anúncio. <span className="text-slate-500">É saber se vale a pena antes de pagar.</span></h2>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {painPoints.map(({icon:Icon,title,text})=><div key={title} className="pain-card rounded-[24px] border border-slate-800/90 bg-slate-950/48 p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-400/10 text-rose-300"><Icon size={18}/></div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{text}</p></div>)}
        </div>
      </section>

      <section className="border-y border-slate-800/70 bg-slate-950/28">
        <div className="mx-auto max-w-[1260px] px-5 py-12 sm:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black tracking-[.18em] text-emerald-300">O QUE VOCÊ LEVA PARA A NEGOCIAÇÃO</div>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-.05em] sm:text-[2.7rem]">Menos dúvida. Mais controle sobre a compra.</h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({icon:Icon,title,text})=><div key={title} className="benefit-card rounded-[24px] border border-slate-800/90 bg-[#091725]/72 p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Icon size={18}/></div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section id="planos" className="fine-scroll mx-auto max-w-[1260px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-1.5 text-[10px] font-black tracking-[.16em] text-emerald-300"><LockKeyhole size={13}/> ACESSO PROTEGIDO</div>
          <h2 className="font-display mt-4 text-[2.2rem] font-black tracking-[-.06em] sm:text-[3.4rem]">Escolha seu nível de radar.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">Seu painel só é liberado depois que o backend recebe e valida a confirmação do pagamento.</p>
        </div>

        {error&&<div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:items-start">
          {plans.map(plan=><PlanCard key={plan.slug} plan={plan} busy={busy} onChoose={subscribe}/>)}
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 rounded-[28px] border border-emerald-300/15 bg-gradient-to-r from-emerald-300/[.08] to-cyan-300/[.05] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div>
            <div className="text-[10px] font-black tracking-[.17em] text-emerald-300">PENSE NO CUSTO DA DECISÃO ERRADA</div>
            <h3 className="mt-2 text-xl font-extrabold tracking-[-.035em]">Uma compra ruim pode custar muito mais do que um mês de Radar.</h3>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">A ideia não é comprar mais. É ter mais informação antes de colocar dinheiro em uma oportunidade.</p>
          </div>
          <a href="#planos" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-xs font-black text-slate-950">Escolher plano <ArrowRight size={15}/></a>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 pb-16 sm:px-8 lg:pb-24">
        <div className="text-center">
          <div className="text-[10px] font-black tracking-[.18em] text-slate-500">DÚVIDAS ANTES DE ENTRAR</div>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-.05em]">O essencial, sem enrolação.</h2>
        </div>
        <div className="mt-7 grid gap-2">
          {[
            ['Quando meu acesso é liberado?','Depois que o Mercado Pago confirma o pagamento e o nosso backend valida a assinatura. O navegador sozinho não consegue liberar o plano.'],
            ['Qual a diferença do Pro?','Além de uma franquia maior, o Pro libera o Diagnóstico Premium e o Preparar venda com IA, incluindo avaliação das fotos.'],
            ['Posso usar uma conta sem pagar?','Não. Contas sem assinatura confirmada ficam nesta área de planos e as funções principais também são bloqueadas no servidor.'],
            ['Meu pagamento fica no Radar do Brique?','Não. O processamento do pagamento é feito pelo Mercado Pago; o Radar recebe apenas os eventos necessários para controlar o acesso.'],
          ].map(([q,a])=><details key={q} className="group rounded-2xl border border-slate-800/90 bg-slate-950/45 p-4"><summary className="cursor-pointer list-none pr-4 text-sm font-bold text-slate-200">{q}</summary><p className="mt-3 text-xs leading-6 text-slate-500">{a}</p></details>)}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-slate-600"><ShieldCheck size={13} className="text-emerald-400/70"/> Pagamento processado pelo Mercado Pago. Liberação controlada no servidor.</div>
      </section>
    </main>
  </div>
}
