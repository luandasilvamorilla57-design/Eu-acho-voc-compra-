import { Activity,BarChart3,ScanSearch,ShieldCheck,Sparkles,TrendingUp } from 'lucide-react'
import { Brand } from '../Brand'
import { AuthPainCard } from './AuthPainCard'
import { AuthBenefits } from './AuthBenefits'
import type { AuthMode } from './authCopy'

export function AuthShowcase({mode}:{mode:AuthMode}){
  const detailed=mode==='register'
  const recovery=mode==='recover'||mode==='reset'

  return <section className={'auth-showcase auth-showcase--'+mode+' noise radar-grid relative overflow-hidden border-b border-slate-800/70 p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-[5.4vw]'}>
    <div className="auth-orb auth-orb--one"/>
    <div className="auth-orb auth-orb--two"/>
    <div className="auth-rings" aria-hidden="true"><span/><span/><span/></div>
    <div className="auth-scanline" aria-hidden="true"/>

    <div className="relative z-10 mx-auto flex min-h-full max-w-[920px] flex-col justify-between">
      <div>
        <div className="auth-showcase__top">
          <Brand/>
          <div className="auth-showcase__meta"><span>COMPRA</span><i/><span>NEGOCIAÇÃO</span><i/><span>REVENDA</span></div>
        </div>

        <div className={'auth-hero-copy '+(detailed?'is-register':'is-simple')+' mt-8 sm:mt-11'}>
          <div className="auth-kicker">{recovery?'ACESSO À SUA OPERAÇÃO':'FEITO PARA QUEM VIVE DE BRIQUE'}</div>
          <h1 className="font-display mt-4">
            {recovery
              ?<>Seu histórico de compra e revenda continua <span>protegido.</span></>
              :<>Compre melhor. Negocie melhor. <span>Revenda com margem.</span></>}
          </h1>
          <p>{recovery
            ?'Recupere seu acesso para voltar às análises, compras, ações pendentes e histórico da sua operação.'
            :'Para quem garimpa barato no Facebook Marketplace, OLX e outros classificados para revender mais caro. O BRIKE RADAR ajuda a decidir o que vale comprar antes de colocar dinheiro no negócio.'}</p>
        </div>

        {!recovery&&<div className="auth-marketplaces" aria-label="Onde o usuário encontra oportunidades">
          <span>Facebook Marketplace</span>
          <span>OLX</span>
          <span>Classificados locais</span>
          <span>Desapegos</span>
        </div>}

        {!detailed&&!recovery&&<div className="auth-simple-flow">
          <span><b>01</b><strong>Garimpe</strong><small>Encontre o anúncio.</small></span>
          <i/>
          <span><b>02</b><strong>Analise</strong><small>Veja risco e teto.</small></span>
          <i/>
          <span><b>03</b><strong>Negocie</strong><small>Compre no preço certo.</small></span>
          <i/>
          <span><b>04</b><strong>Revenda</strong><small>Proteja sua margem.</small></span>
        </div>}

        {recovery&&<div className="auth-recovery-note">
          <ShieldCheck size={20}/>
          <div><strong>Seu histórico não é perdido.</strong><span>Redefinir a senha apenas recupera seu acesso à conta e aos dados já salvos.</span></div>
        </div>}

        {detailed&&<>
          <div className="auth-intel-preview" aria-label="Exemplo de inteligência do BRIKE RADAR">
            <div className="auth-intel-preview__head">
              <div>
                <span><ScanSearch size={13}/> ANÁLISE ANTES DA COMPRA</span>
                <strong>Decisão baseada em preço, risco e giro.</strong>
              </div>
              <b>Score 86</b>
            </div>
            <div className="auth-intel-preview__grid">
              <Metric icon={TrendingUp} label="Preço de compra" value="R$ 780" hint="teto recomendado"/>
              <Metric icon={BarChart3} label="Revenda provável" value="R$ 1.050" hint="faixa estimada"/>
              <Metric icon={ShieldCheck} label="Risco" value="Baixo" hint="checklist validado"/>
            </div>
            <div className="auth-intel-preview__signal">
              <Activity size={15}/>
              <span>O BRIKE RADAR conecta garimpo, análise, negociação, estoque, ações e revenda em um único fluxo.</span>
            </div>
          </div>

          <AuthPainCard/>
          <AuthBenefits/>
        </>}

        {detailed&&<div className="auth-register-positioning">
          <strong>Do anúncio mal apresentado até a venda.</strong>
          <p>Use o Radar para encontrar o que procurar com seu caixa, mande o anúncio para análise, negocie com base em fatos e depois acompanhe estoque, giro e revenda.</p>
        </div>}
      </div>

      <div className="auth-outcome mt-6 hidden lg:flex">
        <div className="auth-outcome__icon"><Sparkles size={15}/></div>
        <div>
          <div>{detailed?'UMA OPERAÇÃO MAIS INTELIGENTE':recovery?'SEUS DADOS CONTINUAM LÁ':'CRIADO PARA O BRIQUE REAL'}</div>
          <p>{detailed
            ?'Garimpo por caixa, análise com IA, Central de Ação e apoio para preparar a revenda.'
            :recovery
              ?'Recupere sua conta e continue de onde parou.'
              :'Não é só calcular lucro: é comprar melhor, reduzir risco e saber quando agir.'}</p>
        </div>
      </div>
    </div>
  </section>
}

function Metric({icon:Icon,label,value,hint}:{icon:any;label:string;value:string;hint:string}){
  return <div className="auth-intel-metric">
    <span><Icon size={15}/></span>
    <div><small>{label}</small><strong>{value}</strong><em>{hint}</em></div>
  </div>
}
