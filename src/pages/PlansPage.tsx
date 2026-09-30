import { useEffect,useMemo,useState } from 'react'
import { Check,Crown,LogOut,RefreshCw,ShieldCheck,Sparkles,Zap } from 'lucide-react'
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
  {slug:'start',nome:'Start',preco_mensal:9.90,analises_mes:40,analises_dia:7,destaque:false,descricao:'Para começar a comprar com mais segurança.',recursos:['40 análises por mês','Até 7 análises por dia','Score de oportunidade','Preço, risco e teto de compra','Mensagens para negociação','Histórico das análises'],ordem:1},
  {slug:'pro',nome:'Pro',preco_mensal:19.90,analises_mes:120,analises_dia:15,destaque:true,descricao:'O pacote completo para comprar e vender com IA.',recursos:['120 análises por mês','Até 15 análises por dia','Tudo do Start','Diagnóstico Premium','Preparar venda com IA','Avaliação das fotos do anúncio'],ordem:2},
  {slug:'max',nome:'Max',preco_mensal:34.90,analises_mes:300,analises_dia:30,destaque:false,descricao:'Mais volume para quem usa o Radar todos os dias.',recursos:['300 análises por mês','Até 30 análises por dia','Tudo do Pro','Diagnóstico Premium','Preparar venda com IA','Maior franquia para uso intenso'],ordem:3},
]

const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

export function PlansPage({email,onRefreshAccess}:{email?:string;onRefreshAccess:()=>Promise<boolean>}){
  const [plans,setPlans]=useState<PlanRow[]>(fallback)
  const [busy,setBusy]=useState<AccountPlan|null>(null)
  const [checking,setChecking]=useState(false)
  const [error,setError]=useState('')
  const returned=useMemo(()=>new URLSearchParams(window.location.search).get('checkout')==='retorno',[])

  useEffect(()=>{
    supabase.from('planos_catalogo').select('slug,nome,preco_mensal,analises_mes,analises_dia,destaque,descricao,recursos,ordem').eq('ativo',true).order('ordem').then(({data})=>{
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
      if(tries<8)setTimeout(check,2200)
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
        await onRefreshAccess()
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
      if(!ok)setError('Ainda não recebemos a confirmação do pagamento. Se acabou de pagar, aguarde alguns segundos e tente novamente.')
    }finally{setChecking(false)}
  }

  return <div className="min-h-screen bg-[#06101c] text-white">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[110px]"/>
      <div className="absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[120px]"/>
    </div>

    <header className="relative z-10 mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8">
      <Brand/>
      <button onClick={()=>supabase.auth.signOut()} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-700 hover:text-white">
        <LogOut size={14}/> Sair
      </button>
    </header>

    <main className="relative z-10 mx-auto max-w-[1240px] px-5 pb-14 pt-5 sm:px-8 sm:pt-10">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[.18em] text-emerald-300">
          <ShieldCheck size={13}/> ESCOLHA SEU ACESSO
        </div>
        <h1 className="font-display mt-5 text-[2.4rem] font-extrabold leading-[.98] tracking-[-.065em] sm:text-[4rem]">Seu radar está pronto.<br/><span className="text-emerald-400">Escolha como quer usar.</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400">Entre no plano que combina com seu volume. O acesso é liberado automaticamente assim que o Mercado Pago confirmar o pagamento.</p>
        {email&&<div className="mt-3 text-xs text-slate-600">{email}</div>}
      </div>

      {returned&&<div className="mx-auto mt-7 flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
        <div><b>Voltamos do Mercado Pago.</b><div className="mt-1 text-xs text-cyan-200/70">{checking?'Confirmando seu pagamento...':'Se o pagamento já foi concluído, atualize o acesso.'}</div></div>
        <button onClick={manualRefresh} disabled={checking} className="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw size={14} className={checking?'animate-spin':''}/> Atualizar</button>
      </div>}

      {error&&<div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="mt-9 grid gap-4 lg:grid-cols-3">
        {plans.map(plan=>{
          const Icon=plan.slug==='max'?Crown:plan.slug==='pro'?Sparkles:Zap
          return <article key={plan.slug} className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-6 ${plan.destaque?'border-emerald-400/45 bg-gradient-to-b from-emerald-400/[.12] to-slate-950/80 shadow-[0_24px_90px_rgba(16,185,129,.12)]':'border-slate-800 bg-slate-950/60'}`}>
            {plan.destaque&&<div className="absolute right-4 top-4 rounded-full bg-emerald-400 px-2.5 py-1 text-[9px] font-black tracking-[.12em] text-slate-950">MAIS ESCOLHIDO</div>}
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.04]"><Icon size={19} className={plan.destaque?'text-emerald-300':'text-slate-300'}/></div>
            <h2 className="mt-5 text-xl font-extrabold">{plan.nome}</h2>
            <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{plan.descricao}</p>
            <div className="mt-5 flex items-end gap-1"><strong className="text-[2.15rem] font-black tracking-[-.06em]">{money(plan.preco_mensal)}</strong><span className="pb-1 text-xs text-slate-500">/mês</span></div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-800 bg-black/15 p-3"><strong className="text-lg">{plan.analises_mes}</strong><span className="mt-1 block text-[10px] text-slate-500">análises / mês</span></div>
              <div className="rounded-2xl border border-slate-800 bg-black/15 p-3"><strong className="text-lg">{plan.analises_dia}</strong><span className="mt-1 block text-[10px] text-slate-500">por dia</span></div>
            </div>
            <ul className="mt-5 grid gap-2.5">{plan.recursos.map(item=><li key={item} className="flex gap-2.5 text-xs leading-5 text-slate-300"><Check size={15} className="mt-0.5 shrink-0 text-emerald-400"/><span>{item}</span></li>)}</ul>
            <button onClick={()=>subscribe(plan.slug)} disabled={busy!==null} className={`mt-6 h-12 w-full rounded-2xl text-sm font-extrabold transition disabled:opacity-50 ${plan.destaque?'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-[0_12px_35px_rgba(52,211,153,.18)]':'border border-slate-700 bg-slate-900 text-white hover:border-slate-600'}`}>
              {busy===plan.slug?'Abrindo pagamento...':`Escolher ${plan.nome}`}
            </button>
          </article>
        })}
      </div>

      <div className="mx-auto mt-7 max-w-3xl text-center text-[11px] leading-5 text-slate-600">Pagamento processado pelo Mercado Pago. Seu plano só é liberado após a confirmação do pagamento no backend do Radar do Brique.</div>
    </main>
  </div>
}
