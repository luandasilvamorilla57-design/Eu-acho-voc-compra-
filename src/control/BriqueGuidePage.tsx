import {useMemo,useState} from 'react'
import {
  AlertTriangle,ArrowLeft,BadgeDollarSign,Bike,Camera,Car,CheckCircle2,ChevronDown,
  Gamepad2,Info,Monitor,Search,ShieldCheck,Smartphone,Sparkles,Tv,Wrench
} from 'lucide-react'

type PriceItem={
  name:string
  buy:string
  sell:string
  buyMax?:number
  sellMin?:number
  sellMax?:number
  warning?:string
}

type Category={
  id:string
  name:string
  icon:React.ReactNode
  items:PriceItem[]
}

const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})

const categories:Category[]=[
  {
    id:'videogames',
    name:'PlayStation',
    icon:<Gamepad2/>,
    items:[
      {name:'PS2',buy:'até R$ 200',sell:'R$ 350 a R$ 400',buyMax:200,sellMin:350,sellMax:400},
      {name:'PS3',buy:'até R$ 450',sell:'R$ 600 a R$ 700',buyMax:450,sellMin:600,sellMax:700},
      {name:'PS4 FAT',buy:'até R$ 850',sell:'R$ 1.100',buyMax:850,sellMin:1100,sellMax:1100},
      {name:'PS4 Slim',buy:'até R$ 900',sell:'R$ 1.300',buyMax:900,sellMin:1300,sellMax:1300},
      {name:'PS4 Pro',buy:'até R$ 1.300',sell:'R$ 1.700',buyMax:1300,sellMin:1700,sellMax:1700},
      {name:'PS5',buy:'R$ 2.400 a R$ 2.500',sell:'R$ 3.000 a R$ 3.200',buyMax:2500,sellMin:3000,sellMax:3200}
    ]
  },
  {
    id:'xbox',
    name:'Xbox',
    icon:<Gamepad2/>,
    items:[
      {name:'Xbox 360',buy:'até R$ 300',sell:'R$ 600',buyMax:300,sellMin:600,sellMax:600},
      {name:'Xbox One S',buy:'até R$ 700',sell:'R$ 1.000',buyMax:700,sellMin:1000,sellMax:1000},
      {name:'Xbox Series S',buy:'até R$ 1.400',sell:'R$ 1.800 a R$ 1.900',buyMax:1400,sellMin:1800,sellMax:1900},
      {name:'Xbox Series X',buy:'—',sell:'—',warning:'Baixa saída. Só entrar se a compra estiver muito abaixo do mercado.'},
      {name:'Xbox One FAT',buy:'—',sell:'—',warning:'Difícil de vender. Evite prender capital sem margem forte.'}
    ]
  },
  {
    id:'iphones',
    name:'iPhones',
    icon:<Smartphone/>,
    items:[
      {name:'iPhone XR',buy:'até R$ 450',sell:'R$ 650 a R$ 700',buyMax:450,sellMin:650,sellMax:700},
      {name:'iPhone 11',buy:'até R$ 750',sell:'R$ 950',buyMax:750,sellMin:950,sellMax:950},
      {name:'iPhone 12',buy:'até R$ 850',sell:'R$ 1.100 a R$ 1.200',buyMax:850,sellMin:1100,sellMax:1200},
      {name:'iPhone 13',buy:'até R$ 1.600',sell:'R$ 1.900 a R$ 2.000',buyMax:1600,sellMin:1900,sellMax:2000},
      {name:'iPhone 14',buy:'até R$ 1.800',sell:'R$ 2.300',buyMax:1800,sellMin:2300,sellMax:2300},
      {name:'iPhone 15',buy:'até R$ 2.500',sell:'R$ 3.000',buyMax:2500,sellMin:3000,sellMax:3000},
      {name:'iPhone 16',buy:'até R$ 3.300',sell:'R$ 4.000',buyMax:3300,sellMin:4000,sellMax:4000}
    ]
  },
  {
    id:'pro',
    name:'iPhones Pro',
    icon:<Smartphone/>,
    items:[
      {name:'iPhone 11 Pro',buy:'até R$ 900',sell:'R$ 1.200',buyMax:900,sellMin:1200,sellMax:1200},
      {name:'iPhone 12 Pro',buy:'até R$ 1.100',sell:'R$ 1.500',buyMax:1100,sellMin:1500,sellMax:1500},
      {name:'iPhone 13 Pro',buy:'até R$ 1.800',sell:'R$ 2.300',buyMax:1800,sellMin:2300,sellMax:2300},
      {name:'iPhone 14 Pro',buy:'até R$ 2.100',sell:'R$ 2.600',buyMax:2100,sellMin:2600,sellMax:2600},
      {name:'iPhone 15 Pro',buy:'até R$ 3.100',sell:'R$ 3.500',buyMax:3100,sellMin:3500,sellMax:3500},
      {name:'iPhone 16 Pro',buy:'até R$ 4.100',sell:'R$ 4.700 a R$ 4.800',buyMax:4100,sellMin:4700,sellMax:4800}
    ]
  },
  {
    id:'promax',
    name:'iPhones Pro Max',
    icon:<Smartphone/>,
    items:[
      {name:'iPhone 11 Pro Max',buy:'até R$ 950',sell:'R$ 1.300 a R$ 1.400',buyMax:950,sellMin:1300,sellMax:1400},
      {name:'iPhone 12 Pro Max',buy:'R$ 1.200 a R$ 1.300',sell:'R$ 1.600',buyMax:1300,sellMin:1600,sellMax:1600},
      {name:'iPhone 13 Pro Max',buy:'até R$ 1.900',sell:'R$ 2.300 a R$ 2.400',buyMax:1900,sellMin:2300,sellMax:2400},
      {name:'iPhone 14 Pro Max',buy:'até R$ 2.300',sell:'R$ 2.800 a R$ 2.900',buyMax:2300,sellMin:2800,sellMax:2900},
      {name:'iPhone 15 Pro Max',buy:'até R$ 3.300',sell:'R$ 3.900',buyMax:3300,sellMin:3900,sellMax:3900},
      {name:'iPhone 16 Pro Max',buy:'até R$ 4.300',sell:'R$ 5.000',buyMax:4300,sellMin:5000,sellMax:5000}
    ]
  },
  {
    id:'tvs',
    name:'Televisões',
    icon:<Tv/>,
    items:[
      {name:'TV 32”',buy:'até R$ 300',sell:'R$ 600',buyMax:300,sellMin:600,sellMax:600},
      {name:'TV 43”',buy:'até R$ 600',sell:'R$ 900',buyMax:600,sellMin:900,sellMax:900},
      {name:'TV 50”',buy:'até R$ 800',sell:'R$ 1.200',buyMax:800,sellMin:1200,sellMax:1200}
    ]
  },
  {
    id:'bikes',
    name:'Bicicletas',
    icon:<Bike/>,
    items:[
      {name:'Aro 29',buy:'até R$ 450',sell:'R$ 700',buyMax:450,sellMin:700,sellMax:700}
    ]
  },
  {
    id:'vehicles',
    name:'Motos e carros',
    icon:<Car/>,
    items:[
      {name:'Motos',buy:'Tentar pelo menos R$ 3.000 abaixo da FIPE',sell:'Avaliar FIPE + estado + região',warning:'Documento, débitos, pneus, motor, relação e histórico de manutenção mudam completamente a conta.'},
      {name:'Carros',buy:'Tentar 25% abaixo da FIPE',sell:'Avaliar FIPE + estado + região',warning:'FIPE é referência, não preço garantido de venda. Faça vistoria e confira documentação antes de fechar.'}
    ]
  },
  {
    id:'computers',
    name:'Computadores',
    icon:<Monitor/>,
    items:[
      {name:'Computadores em geral',buy:'—',sell:'—',warning:'Baixa saída no momento. Só vale imobilizar capital se a margem e a configuração estiverem muito boas.'}
    ]
  }
]

const prepTips=[
  {icon:<Sparkles/>,title:'Limpe antes de anunciar',text:'Produto limpo parece mais bem cuidado e aumenta o valor percebido. Tire poeira, gordura, marcas de dedo e organize cabos e acessórios.'},
  {icon:<Camera/>,title:'Foto vende antes do preço',text:'Use luz natural ou luz branca suave, fundo limpo e várias posições. Faça uma foto principal forte e mostre detalhes, acessórios e defeitos reais.'},
  {icon:<Wrench/>,title:'Teste tudo antes de colocar preço',text:'Não anuncie “100%” sem testar. Registre o que funciona, o que foi reparado e o que ainda merece atenção.'},
  {icon:<BadgeDollarSign/>,title:'Não olhe só o lucro',text:'Considere custo de compra, bateria, reparo, transporte, taxa, tempo parado e risco. Giro rápido pode valer mais que margem alta.'},
  {icon:<ShieldCheck/>,title:'Transparência protege sua venda',text:'Não esconda defeito. Produto descrito corretamente gera menos devolução, menos discussão e mais confiança na negociação.'}
]

const categoryChecks=[
  {title:'iPhone',icon:<Smartphone/>,checks:['IMEI e situação do aparelho','Face ID / Touch ID','Saúde da bateria','Câmeras, microfone e alto-falantes','Tela, toque e True Tone','Chip, Wi‑Fi e Bluetooth','Conector de carga e botões','Histórico de peças/trocas quando disponível']},
  {title:'Videogame',icon:<Gamepad2/>,checks:['HDMI e imagem','Leitor de disco, se houver','Controle e analógicos','Wi‑Fi / rede','Superaquecimento e ruído','Armazenamento','Cabos, fonte e acessórios','Conta ou bloqueio pendente']},
  {title:'Televisão',icon:<Tv/>,checks:['Manchas e linhas no painel','Backlight e brilho','HDMI e USB','Som','Wi‑Fi / apps','Controle remoto','Pés ou suporte','Tela sem trincas']},
  {title:'Bike / veículo',icon:<Bike/>,checks:['Procedência e documento','Pneus e freios','Estrutura/quadro','Motor e parte mecânica quando houver','Custos de manutenção imediata','Débitos ou pendências','Condição real x preço pedido','Liquidez na sua região']}
]

function conservativeProfit(item:PriceItem){
  if(item.buyMax===undefined||item.sellMin===undefined)return null
  return item.sellMin-item.buyMax
}

export function BriqueGuidePage({onBack}:{onBack:()=>void}){
  const [query,setQuery]=useState('')
  const [open,setOpen]=useState<string>('videogames')
  const [tab,setTab]=useState<'prices'|'prepare'|'checks'>('prices')

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase()
    if(!q)return categories
    return categories
      .map(cat=>({...cat,items:cat.items.filter(item=>(cat.name+' '+item.name).toLowerCase().includes(q))}))
      .filter(cat=>cat.items.length)
  },[query])

  return <div className="cp-page cp-brique-guide">
    <section className="cp-guide-hero">
      <button className="cp-guide-back" onClick={onBack}><ArrowLeft/></button>
      <div className="cp-guide-hero-copy">
        <span className="cp-guide-kicker">GUIA DO BRIQUE · COMPRA E REVENDA</span>
        <h1>Compre com margem. Venda com apresentação.</h1>
        <p>Referências rápidas para não entrar caro, cuidar melhor da mercadoria e transformar produto parado em dinheiro girando.</p>
      </div>
      <span className="cp-guide-hero-icon"><BadgeDollarSign/></span>
    </section>

    <section className="cp-guide-warning">
      <Info/>
      <div><b>Preço de referência, não promessa de venda.</b><p>Os valores mudam por cidade, estado, conservação, armazenamento, acessórios e procura. Antes de comprar, confira a média real da sua região.</p></div>
    </section>

    <div className="cp-guide-tabs">
      <button className={tab==='prices'?'active':''} onClick={()=>setTab('prices')}>Compra x venda</button>
      <button className={tab==='prepare'?'active':''} onClick={()=>setTab('prepare')}>Valorizar produto</button>
      <button className={tab==='checks'?'active':''} onClick={()=>setTab('checks')}>O que testar</button>
    </div>

    {tab==='prices'&&<>
      <label className="cp-guide-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar PS5, iPhone 13, TV 43..."/></label>

      <section className="cp-guide-rule-strip">
        <div><span>REGRA 01</span><b>Margem começa na compra</b><p>Se entrar caro, fica difícil recuperar depois.</p></div>
        <div><span>REGRA 02</span><b>Capital parado custa</b><p>Produto de giro ruim precisa de margem maior.</p></div>
        <div><span>REGRA 03</span><b>Região manda no preço</b><p>Valide Marketplace e OLX da sua cidade.</p></div>
      </section>

      <div className="cp-guide-categories">
        {filtered.map(cat=>{
          const isOpen=open===cat.id||query.trim().length>0
          return <section className={isOpen?'cp-guide-category is-open':'cp-guide-category'} key={cat.id}>
            <button className="cp-guide-category-head" onClick={()=>setOpen(isOpen&&query.trim().length===0?'':cat.id)}>
              <span className="cp-guide-category-icon">{cat.icon}</span>
              <div><span>CATEGORIA</span><b>{cat.name}</b><small>{cat.items.length} referência(s)</small></div>
              <ChevronDown/>
            </button>
            {isOpen&&<div className="cp-guide-price-list">
              {cat.items.map(item=>{
                const profit=conservativeProfit(item)
                return <article className={item.warning&&!item.buyMax?'cp-guide-price-row is-warning':'cp-guide-price-row'} key={item.name}>
                  <div className="cp-guide-product-name">
                    <b>{item.name}</b>
                    {profit!==null&&profit>0&&<small>potencial bruto conservador: +{money.format(profit)}</small>}
                    {item.warning&&<small className="is-warning"><AlertTriangle/> {item.warning}</small>}
                  </div>
                  <div className="cp-guide-price-box buy"><span>COMPRAR</span><strong>{item.buy}</strong></div>
                  <div className="cp-guide-price-box sell"><span>VENDER</span><strong>{item.sell}</strong></div>
                </article>
              })}
            </div>}
          </section>
        })}
        {!filtered.length&&<div className="cp-guide-empty"><Search/><b>Nenhuma referência encontrada.</b><span>Tente outro nome de produto.</span></div>}
      </div>
    </>}

    {tab==='prepare'&&<>
      <section className="cp-guide-section-title"><span>ANTES DE ANUNCIAR</span><h2>Faça o produto parecer o melhor que ele realmente é.</h2><p>Valorizar não é esconder defeito. É apresentar direito o que você comprou.</p></section>
      <div className="cp-guide-tips">
        {prepTips.map((tip,i)=><article key={tip.title}><span className="cp-guide-tip-number">{String(i+1).padStart(2,'0')}</span><span className="cp-guide-tip-icon">{tip.icon}</span><div><b>{tip.title}</b><p>{tip.text}</p></div></article>)}
      </div>

      <section className="cp-guide-photo-plan">
        <div className="cp-guide-section-title"><span>ROTEIRO DE FOTO</span><h2>7 fotos que ajudam a vender.</h2></div>
        <div className="cp-guide-photo-grid">
          {[
            ['01','Foto principal','Produto inteiro, limpo e bem enquadrado.'],
            ['02','Frente / tela','Sem reflexo forte e com boa iluminação.'],
            ['03','Traseira','Mostre conservação de verdade.'],
            ['04','Laterais','Ajuda a provar que não está escondendo marcas.'],
            ['05','Acessórios','Cabos, controles, caixa, carregador e extras.'],
            ['06','Funcionando','Tela ligada, menu ou teste visível.'],
            ['07','Defeito real','Se tiver marca ou detalhe, mostre de perto.']
          ].map(([n,t,d])=><article key={n}><span>{n}</span><b>{t}</b><p>{d}</p></article>)}
        </div>
      </section>

      <section className="cp-guide-copy-card">
        <span className="cp-guide-copy-icon"><CheckCircle2/></span>
        <div><span>ANÚNCIO QUE PASSA CONFIANÇA</span><h3>Seja específico, não genérico.</h3><p>Informe modelo, armazenamento/tamanho, estado, acessórios, testes feitos, defeitos conhecidos e o que acompanha. Isso filtra curioso e reduz perguntas repetidas.</p></div>
      </section>
    </>}

    {tab==='checks'&&<>
      <section className="cp-guide-section-title"><span>CHECKLIST DE COMPRA</span><h2>Teste antes de entregar seu dinheiro.</h2><p>Quanto mais caro o produto, mais caro fica um erro de avaliação.</p></section>
      <div className="cp-guide-checks">
        {categoryChecks.map(group=><article key={group.title}>
          <div className="cp-guide-check-head"><span>{group.icon}</span><div><small>ANTES DE COMPRAR</small><b>{group.title}</b></div></div>
          <div>{group.checks.map(item=><p key={item}><CheckCircle2/>{item}</p>)}</div>
        </article>)}
      </div>

      <section className="cp-guide-negotiation">
        <div><span>NEGOCIAÇÃO</span><h2>Desconto bom é o que fecha sem ofender.</h2></div>
        <div className="cp-guide-negotiation-grid">
          <article><b>Mostre interesse real</b><p>Pergunte condição, funcionamento, defeitos e o que acompanha antes de jogar preço baixo.</p></article>
          <article><b>Use motivo concreto</b><p>Bateria, reparo, distância, ausência de acessórios e risco são argumentos melhores que “faço X agora”.</p></article>
          <article><b>Tenha teto definido</b><p>Antes de sair de casa, saiba o máximo que pode pagar sem destruir sua margem.</p></article>
          <article><b>Dinheiro rápido ajuda</b><p>Quando fizer sentido, disponibilidade para fechar no mesmo dia pode valer mais que insistir demais no desconto.</p></article>
        </div>
      </section>

      <section className="cp-guide-safety">
        <ShieldCheck/>
        <div><b>Segurança também faz parte do lucro.</b><p>Evite adiantamento sem garantia, confirme procedência, teste pessoalmente quando possível e faça negócios de maior valor em local seguro. Em veículos, confira documentação e pendências antes de qualquer pagamento.</p></div>
      </section>
    </>}
  </div>
}
