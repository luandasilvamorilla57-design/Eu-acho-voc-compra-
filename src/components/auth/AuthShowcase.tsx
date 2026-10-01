import { ArrowRight,CheckCircle2,ScanSearch,ShieldCheck,Sparkles,TrendingUp,WalletCards } from 'lucide-react'
import { Brand } from '../Brand'

export function AuthShowcase(){
  return <section className="auth-showcase auth-showcase--register noise radar-grid relative overflow-hidden border-b border-slate-800/70 p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-[5.15vw]">
    <div className="auth-orb auth-orb--one"/>
    <div className="auth-orb auth-orb--two"/>
    <div className="auth-rings" aria-hidden="true"><span/><span/><span/></div>
    <div className="auth-scanline" aria-hidden="true"/>

    <div className="relative z-10 mx-auto flex min-h-full max-w-[920px] flex-col">
      <div className="auth-showcase__top">
        <Brand/>
        <div className="auth-showcase__meta"><span>GARIMPO</span><i/><span>ANÁLISE</span><i/><span>NEGOCIAÇÃO</span><i/><span>REVENDA</span></div>
      </div>

      <div className="auth-register-hero">
        <div className="auth-kicker">PARA QUEM COMPRA BARATO E REVENDE MAIS CARO</div>
        <h1 className="font-display">Pare de depender do <span>“acho que dá lucro”.</span></h1>
        <p>Se você garimpa no Facebook Marketplace, OLX, classificados e desapegos, o BRIKE RADAR transforma cada anúncio em uma decisão mais clara antes de você colocar dinheiro no negócio.</p>
      </div>

      <div className="auth-register-promise">
        <div className="auth-register-promise__lead">
          <span><ScanSearch size={15}/> O QUE MUDA NA PRÁTICA</span>
          <strong>Você deixa de olhar só o preço e passa a enxergar o negócio inteiro.</strong>
        </div>
        <div className="auth-register-promise__grid">
          <PromiseItem icon={WalletCards} title="O que procurar" text="Informe seu caixa e o tipo de giro. O Radar mostra categorias que fazem sentido para garimpar."/>
          <PromiseItem icon={ScanSearch} title="Antes de pagar" text="Mande o anúncio e veja teto de compra, riscos, testes e pontos para negociar."/>
          <PromiseItem icon={TrendingUp} title="Depois da compra" text="Acompanhe estoque, capital, giro, revenda e as ações que pedem sua atenção."/>
        </div>
      </div>

      <div className="auth-register-flow">
        <div className="auth-register-flow__head">
          <span>DO GARIMPO À REVENDA</span>
          <strong>Um fluxo pensado para quem vive de brique.</strong>
        </div>
        <div className="auth-register-flow__steps">
          <Flow n="01" title="Defina seu caixa" text="Ex.: tenho R$ 250 para girar."/>
          <Flow n="02" title="Garimpe melhor" text="Veja o que vale procurar nessa faixa."/>
          <Flow n="03" title="Analise o anúncio" text="Preço, risco, defeitos e teto de compra."/>
          <Flow n="04" title="Negocie com contexto" text="Sem oferta ofensiva e usando fatos reais."/>
          <Flow n="05" title="Revenda melhor" text="Limpeza, boas fotos e apoio do Vender com IA."/>
        </div>
      </div>

      <div className="auth-register-convince">
        <div className="auth-register-convince__copy">
          <span><Sparkles size={15}/> MENOS ACHISMO. MAIS CRITÉRIO.</span>
          <h2>Uma compra ruim prende seu dinheiro. Uma compra bem feita mantém o giro vivo.</h2>
          <p>O BRIKE RADAR foi construído para ajudar você a reduzir compra por impulso, enxergar risco escondido e saber quando uma oportunidade merece atenção.</p>
        </div>
        <div className="auth-register-checks">
          <CheckLine text="Produtos compatíveis com o seu caixa"/>
          <CheckLine text="Checklist de risco por categoria"/>
          <CheckLine text="Faixa para negociar sem estourar o caixa"/>
          <CheckLine text="Central de Ação para estoque e negociações"/>
          <CheckLine text="Histórico real de compras, vendas e ROI"/>
        </div>
      </div>

      <div className="auth-register-final">
        <div>
          <span>SE VOCÊ JÁ COMPRA PARA REVENDER</span>
          <strong>Crie sua conta e coloque método no que hoje depende da experiência e do olho.</strong>
        </div>
        <ArrowRight size={20}/>
      </div>

      <p className="auth-register-disclaimer">A ferramenta ajuda na decisão e organização da operação. Resultado de revenda depende do preço de compra, condição do produto, negociação e mercado.</p>
    </div>
  </section>
}

function PromiseItem({icon:Icon,title,text}:{icon:any;title:string;text:string}){
  return <div className="auth-register-promise__item">
    <span><Icon size={18}/></span>
    <div><strong>{title}</strong><p>{text}</p></div>
  </div>
}

function Flow({n,title,text}:{n:string;title:string;text:string}){
  return <div className="auth-register-flow__step">
    <span>{n}</span>
    <strong>{title}</strong>
    <p>{text}</p>
  </div>
}

function CheckLine({text}:{text:string}){
  return <div className="auth-register-check"><CheckCircle2 size={15}/><span>{text}</span></div>
}
