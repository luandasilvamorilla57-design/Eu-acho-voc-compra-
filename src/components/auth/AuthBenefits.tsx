import { ListChecks,ScanSearch,WalletCards } from 'lucide-react'

const data=[
  [WalletCards,'Garimpo por caixa','Informe quanto tem e o tipo de giro para descobrir o que vale procurar.'],
  [ScanSearch,'Análise + negociação','Preço, riscos, teto de compra e abordagem para negociar sem parecer robô.'],
  [ListChecks,'Central de Ação','Estoque, capital, negociações e próximos passos em uma fila clara de prioridades.']
] as const

export function AuthBenefits(){
  return <>
    <div className="auth-mobile-benefits mt-4 grid grid-cols-3 gap-2 lg:hidden">
      {data.map(([Icon,label])=><div key={label} className="auth-mobile-benefit"><Icon size={16}/><span>{label}</span></div>)}
    </div>
    <div className="auth-desktop-features mt-5 hidden gap-3 lg:grid lg:grid-cols-3">
      {data.map(([Icon,title,desc])=><div key={title} className="auth-feature rounded-[22px] p-4">
        <div className="auth-feature__icon"><Icon size={18}/></div>
        <strong className="mt-4 block text-sm">{title}</strong>
        <span className="mt-1 block text-[11px] leading-5 text-slate-500">{desc}</span>
      </div>)}
    </div>
  </>
}
