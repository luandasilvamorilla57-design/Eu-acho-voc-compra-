import { Activity,Moon,Sun } from 'lucide-react'
import { Brand } from '../Brand'
import type { View } from '../BottomNav'
import { AccountMenu } from './AccountMenu'

const meta={
  dashboard:['VISÃO DE MERCADO','Painel de oportunidades','Capital, margem, lucro e negócios ativos em uma única visão.'],
  radar:['CENTRAL DE AÇÃO','Ações do dia','Pendências, estoque, negociações e próximos passos que pedem sua atenção.'],
  new:['ANÁLISE GUIADA','Nova análise inteligente','Cruze anúncio, mercado, risco e seu histórico antes de negociar.'],
  bought:['CARTEIRA DE COMPRAS','Itens comprados','Custo real, estoque, fotos, preço mínimo e preparação para revenda.'],
  history:['ACOMPANHAMENTO','Histórico do radar','Análises, negociações, anúncios com IA e resultados reais.'],
  subscription:['CONTA E COBRANÇA','Minha assinatura','Franquia, créditos extras, renovação e recursos do seu plano.'],
  admin:['OPERAÇÃO DO SAAS','Painel proprietário','Usuários, assinaturas, consumo, erros e saúde do BRIKE RADAR.']
} as const

export function TopHeader({view,dark,setDark,email,ownerAccess=false,onManageSubscription,onOpenAdmin}:{view:View;dark:boolean;setDark:(v:boolean)=>void;email?:string;ownerAccess?:boolean;onManageSubscription?:()=>void;onOpenAdmin?:()=>void}){
  const [eyebrow,title,desc]=meta[view]
  return <header className="app-top-header sticky top-0 z-30 border-b backdrop-blur-2xl">
    <div className="top-header-inner">
      <div className="top-header-mobile-brand lg:hidden"><Brand compact/></div>
      <div className="hidden min-w-0 lg:block">
        <div className="header-context-kicker"><span className="premium-eyebrow">{eyebrow}</span><i/></div>
        <h1 className="font-display app-heading header-page-title">{title}</h1>
        <p className="header-page-description">{desc}</p>
      </div>

      <div className="top-header-actions">
        <div className="header-live hidden xl:flex"><Activity size={13}/><span>RADAR ONLINE</span><i/></div>
        <button type="button" onClick={()=>setDark(!dark)} className="theme-toggle" aria-label={dark?'Ativar tema claro':'Ativar tema escuro'} title={dark?'Tema claro':'Tema escuro'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
        <AccountMenu email={email} ownerAccess={ownerAccess} onManageSubscription={onManageSubscription} onOpenAdmin={onOpenAdmin}/>
      </div>
    </div>
  </header>
}
