import { useEffect,useMemo,useState } from 'react'
import { ArrowRight,Camera,Clock3,Flame,MessageCircle,Save,ScanSearch,ShieldAlert,ShoppingBag,Sparkles,WalletCards } from 'lucide-react'
import type { GiroPreferido,RadarConfigRow } from '../../types/database'
import type { RadarConfigPatch } from '../../hooks/useRadarConfig'
import { money } from '../../utils/format'
import { briqueCapitalPresets,catalogGuideNote,opportunitiesFor } from '../../data/briqueCatalog'

export function StrategyPanel({
  config,onSave,onAnalyze
}:{
  config:RadarConfigRow
  onSave:(patch:RadarConfigPatch)=>Promise<void>
  onAnalyze:()=>void
}){
  const [capital,setCapital]=useState(String(config.capital_disponivel||''))
  const [giro,setGiro]=useState<GiroPreferido>(config.giro_preferido||'rapido')
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)

  useEffect(()=>{
    setCapital(String(config.capital_disponivel||''))
    setGiro(config.giro_preferido||'rapido')
  },[config])

  const cash=Math.max(0,Number(String(capital).replace(',','.'))||0)
  const opportunities=useMemo(()=>opportunitiesFor(cash,giro),[cash,giro])

  const save=async()=>{
    setSaving(true)
    setSaved(false)
    try{
      await onSave({capital_disponivel:cash,giro_preferido:giro})
      setSaved(true)
      setTimeout(()=>setSaved(false),1600)
    }finally{
      setSaving(false)
    }
  }

  return <section className="brique-hunt">
    <div className="brique-hunt__hero">
      <div className="brique-hunt__hero-copy">
        <span className="brique-hunt__eyebrow"><Sparkles size={14}/> SEU CAIXA DE COMPRA</span>
        <h3 className="font-display brique-hunt__title">Quanto você tem para colocar no brique hoje?</h3>
        <p>Você informa o caixa e escolhe o tipo de giro. O Radar usa a nossa tabela de produtos para recomendar o que faz sentido procurar nessa faixa — depois você manda o anúncio para <strong>Analisar</strong> antes de comprar.</p>
      </div>
      <span className="brique-hunt__hero-icon"><WalletCards size={23}/></span>
    </div>

    <div className="brique-hunt__controls">
      <div className="brique-cash">
        <div className="brique-cash__head">
          <div>
            <span>Quanto você tem para investir agora?</span>
            <small>Esse é o dinheiro que você quer colocar em mercadoria hoje.</small>
          </div>
          <WalletCards size={19}/>
        </div>
        <label className="brique-cash__input">
          <b>R$</b>
          <input
            aria-label="Valor disponível para investir no brique"
            inputMode="decimal"
            value={capital}
            onChange={e=>setCapital(e.target.value.replace(/[^0-9,.]/g,'').replace(',','.'))}
            placeholder="100"
          />
        </label>
        <div className="brique-cash__presets" aria-label="Valores rápidos">
          {briqueCapitalPresets.map(value=><button key={value} type="button" onClick={()=>setCapital(String(value))} className={cash===value?'is-active':''}>{money(value)}</button>)}
        </div>
      </div>

      <div className="brique-turnover">
        <span className="brique-control-label">Qual tipo de giro você quer?</span>
        <div className="brique-turnover__grid">
          <button type="button" className={giro==='rapido'?'is-active':''} onClick={()=>setGiro('rapido')}>
            <span className="brique-turnover__icon"><Flame size={19}/></span>
            <span><b>Giro rápido</b><small>Prioriza produtos com procura forte e maior chance de sair mais rápido quando comprados no preço certo.</small></span>
          </button>
          <button type="button" className={giro==='medio'?'is-active':''} onClick={()=>setGiro('medio')}>
            <span className="brique-turnover__icon"><Clock3 size={19}/></span>
            <span><b>Giro médio</b><small>Aceita esperar um pouco mais e abre espaço para itens que podem entregar uma margem melhor.</small></span>
          </button>
        </div>
        <div className="brique-turnover__note">
          <ScanSearch size={17}/>
          <p>Seu caixa não é um teto para o <strong>preço anunciado</strong>. Com R$ 100, por exemplo, pode valer olhar um item anunciado por R$ 150 se houver margem real para negociar e fechar perto do seu caixa.</p>
        </div>
      </div>
    </div>

    <button type="button" className="brique-save" onClick={save} disabled={saving||cash<=0}>
      <Save size={17}/>
      {saving?'Salvando...':saved?'Caixa e giro salvos':'Salvar meu caixa e giro'}
    </button>

    {cash>0&&<div className="brique-results">
      <div className="brique-results__head">
        <div>
          <span className="brique-hunt__eyebrow"><Flame size={14}/> PRODUTOS PARA GARIMPAR</span>
          <h4>8 produtos para procurar com {money(cash)} · {giro==='rapido'?'giro rápido':'giro médio'}</h4>
          <p>Isso <strong>não é uma busca de anúncios em tempo real</strong>. É a tabela estratégica do BRike Radar: produtos que fazem sentido para esse caixa e tipo de giro. Você procura o anúncio e manda para <strong>Analisar</strong> antes de fechar.</p>
        </div>
        <span className="brique-results__count">8</span>
      </div>

      <div className="brique-product-grid">
        {opportunities.map(item=><article key={item.id} className="brique-product">
          <div className="brique-product__top">
            <span className={'brique-heat '+(item.heat==='muito-quente'?'is-hot':'')}>
              <Flame size={13}/>{item.heat==='muito-quente'?'MUITO QUENTE':'QUENTE'}
            </span>
            <span className="brique-product__turn">{giro==='rapido'?'⚡ giro rápido':'◎ giro médio'}</span>
          </div>

          <h5>{item.title}</h5>

          <div className="brique-product__prices">
            <span><small>Faixa de anúncio que vale garimpar</small><b>{rangeMoney(item.marketAsk)}</b></span>
            <span><small>Tente fechar a compra por</small><b>{rangeMoney(item.targetBuy)}</b></span>
          </div>

          <p className="brique-product__why">{item.why}</p>

          <div className="brique-product__signal">
            <ShoppingBag size={16}/>
            <p><b>O que procurar para comprar barato</b>{item.signal}</p>
          </div>

          <div className="brique-product__risk">
            <ShieldAlert size={16}/>
            <p><b>Riscos antes de pagar</b>{item.risk}</p>
          </div>

          <div className="brique-product__deal">
            <MessageCircle size={16}/>
            <p><b>Abordagem natural</b>“Oi! Tenho interesse. Está funcionando tudo certinho? Tem algum detalhe além do que aparece nas fotos? Se eu conseguir retirar sem enrolação, você consegue melhorar um pouco o valor?”</p>
          </div>

          <button type="button" className="brique-product__analyze" onClick={onAnalyze}>
            Achei um anúncio · mandar para Analisar <ArrowRight size={15}/>
          </button>
        </article>)}
      </div>

      <div className="brique-flow">
        <div className="brique-flow__head">
          <span className="brique-hunt__eyebrow"><ScanSearch size={14}/> COMO O BRIQUE RADAR DEVE SER USADO</span>
          <h4>Garimpe barato. Valide antes. Venda melhor.</h4>
        </div>
        <div className="brique-flow__steps">
          <FlowStep n="01" title="Procure" text="Busque anúncio com foto ruim, sujeira, descrição fraca, desapego ou pequeno defeito simples — desde que o produto tenha potencial real de recuperação."/>
          <FlowStep n="02" title="Analise" text="Achou algo? Mande print ou link para Analisar. O Radar verifica preço, riscos, testes e quanto vale tentar pagar."/>
          <FlowStep n="03" title="Negocie" text="Não comece jogando o preço lá embaixo. Primeiro mostre interesse e confirme o estado; depois use problemas reais como argumento para negociar."/>
          <FlowStep n="04" title="Compre" text="Fechou? Registre em Comprei para acompanhar custo real, estoque, venda e lucro."/>
          <FlowStep n="05" title="Revenda" text="Faça limpeza caprichada, corrija detalhes simples e tire boas fotos. Depois use Vender com IA para preparar o anúncio."/>
        </div>
      </div>

      <div className="brique-discipline">
        <div><ShieldAlert size={19}/><strong>Regra de ouro da negociação</strong></div>
        <p>Foto ruim, sujeira e pequenos defeitos podem reduzir a percepção de valor e abrir margem para o briqueiro. Use apenas pontos reais do produto para negociar. Seja natural, evite oferta ofensiva logo de cara e nunca deixe um preço barato fazer você ignorar procedência, teste ou sinal de golpe.</p>
      </div>

      <div className="brique-aftercare">
        <Camera size={19}/>
        <p><strong>Depois da compra:</strong> boa limpeza + pequenos acertos + fotos claras costumam melhorar muito a apresentação. Use <b>Vender com IA</b> para transformar isso em um anúncio profissional.</p>
      </div>

      <p className="brique-market-note">{catalogGuideNote}</p>
    </div>}
  </section>
}

function FlowStep({n,title,text}:{n:string;title:string;text:string}){
  return <div className="brique-flow__step"><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>
}

function rangeMoney(range:[number,number]){
  return money(range[0])+' – '+money(range[1])
}
