import { Moon, Sun } from 'lucide-react'
import { Brand } from '../Brand'
import type { View } from '../BottomNav'
import { AccountMenu } from './AccountMenu'

const meta={
  dashboard:['VISÃO DE MERCADO','Painel de oportunidades','Acompanhe score, lucro e negócios salvos no radar.'],
  new:['ANÁLISE GUIADA','Nova análise inteligente','Cole um anúncio e receba uma leitura estratégica.'],
  history:['ACOMPANHAMENTO','Histórico do radar','Atualize status, compra, venda e resultado real.']
} as const

export function TopHeader({view,dark,setDark,email}:{view:View;dark:boolean;setDark:(v:boolean)=>void;email?:string}){
  const [eyebrow,title,desc]=meta[view]
  return <header className="app-top-header sticky top-0 z-30 border-b backdrop-blur-2xl">
    <div className="flex min-h-[86px] items-center justify-between px-4 py-3 sm:px-6 lg:min-h-[104px] lg:px-8">
      <div>
        <div className="lg:hidden"><Brand compact/></div>
        <div className="hidden lg:block">
          <div className="text-[10px] font-bold tracking-[.24em] text-emerald-400">{eyebrow}</div>
          <h1 className="font-display mt-1 text-[28px] font-extrabold tracking-[-.05em] app-heading">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={()=>setDark(!dark)}
          className="theme-toggle grid h-11 w-11 place-items-center rounded-2xl border transition"
          aria-label={dark?'Ativar tema claro':'Ativar tema escuro'}
          title={dark?'Tema claro':'Tema escuro'}
        >
          {dark?<Sun size={17}/>:<Moon size={17}/>}
        </button>
        <AccountMenu email={email}/>
      </div>
    </div>
  </header>
}
