import { Moon, Sun } from 'lucide-react'
import { Brand } from '../Brand'
import type { View } from '../BottomNav'
import { AccountMenu } from './AccountMenu'

const meta={
  dashboard:['VISÃO DE MERCADO','Painel de oportunidades','Acompanhe capital, margem, lucro e negócios ativos no radar.'],
  radar:['CENTRAL OPERACIONAL','Radar do dia','Veja o que precisa de atenção antes de abrir outro negócio.'],
  new:['ANÁLISE GUIADA','Nova análise inteligente','Cruze anúncio, mercado, risco e seu próprio histórico antes de negociar.'],
  bought:['CARTEIRA DE COMPRAS','Itens comprados','Controle custo real, estoque, fotos, preço mínimo e preparação para revenda.'],
  history:['ACOMPANHAMENTO','Histórico do radar','Revise análises, contrapropostas, visitas e oportunidades anteriores.']
} as const

export function TopHeader({view,dark,setDark,email}:{view:View;dark:boolean;setDark:(v:boolean)=>void;email?:string}){
  const [eyebrow,title,desc]=meta[view]
  return <header className="app-top-header sticky top-0 z-30 border-b backdrop-blur-2xl">
    <div className="flex min-h-[88px] items-center justify-between px-4 py-3 sm:px-6 lg:min-h-[106px] lg:px-8">
      <div><div className="lg:hidden"><Brand compact/></div><div className="hidden lg:block"><div className="premium-eyebrow text-emerald-400">{eyebrow}</div><h1 className="font-display mt-1.5 text-[29px] font-extrabold tracking-[-.05em] app-heading">{title}</h1><p className="mt-1.5 text-[14px] text-slate-500">{desc}</p></div></div>
      <div className="flex items-center gap-2"><button type="button" onClick={()=>setDark(!dark)} className="theme-toggle grid h-11 w-11 place-items-center rounded-2xl border transition" aria-label={dark?'Ativar tema claro':'Ativar tema escuro'} title={dark?'Tema claro':'Tema escuro'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><AccountMenu email={email}/></div>
    </div>
  </header>
}
