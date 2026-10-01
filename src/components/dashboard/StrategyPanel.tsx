import { useEffect,useMemo,useState } from 'react'
import { ArrowRight,Camera,Clock3,Flame,Save,ScanSearch,ShieldAlert,ShoppingBag,Sparkles,WalletCards } from 'lucide-react'
import type { GiroPreferido,RadarConfigRow } from '../../types/database'
import type { RadarConfigPatch } from '../../hooks/useRadarConfig'
import { money } from '../../utils/format'
import { briqueCapitalPresets,marketResearchNote,opportunitiesFor,tierName } from '../../data/briqueCatalog'

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
        <span className="brique-hunt__eyebrow"><Sparkles size={13}/> SEU CAIXA DE COMPRA</span>
        <h3 className="font-display brique-hunt__title">O que dá para girar com o dinheiro que você tem hoje?</h3>
        <p>Informe seu caixa e escolha a velocidade de giro. O Radar mostra alvos reais para garimpar, sem esconder uma boa oportunidade só porque o anúncio começou um pouco acima do seu valor.</p>
      </div>
      <span className="brique-hunt__hero-icon"><WalletCards size={23}/></span>
    </div>

    <div className="brique-hunt__controls">
      <div className="brique-cash">
        <div className="brique-cash__head">
          <div>
            <span>Quanto você tem para investir agora?</span>
            <small>Esse valor orienta o garimpo — não vira um bloqueio rígido.</small>
          </div>
          <WalletCards size={18}/>
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
        <span className="brique-control-label">Como você quer girar esse dinheiro?</span>
        <div className="brique-turnover__grid">
          <button type="button" className={giro==='rapido'?'is-active':''} onClick={()=>setGiro('rapido')}>
            <span className="brique-turnover__icon"><Flame size={18}/></span>
            <span><b>Giro rápido</b><small>Prioriza liquidez e produtos com saída mais curta.</small></span>
          </button>
          <button type="button" className={giro==='medio'?'is-active':''} onClick={()=>setGiro('medio')}>
            <span className="brique-turnover__icon"><Clock3 size={18}/></span>
            <span><b>Giro médio</b><small>Aceita esperar um pouco mais por uma compra potencialmente melhor.</small></span>
          </button>
        </div>
        <div className="brique-turnover__note">
          <ScanSearch size={15}/>
          <p>Exemplo: com R$ 100, o Radar pode mostrar um anúncio de R$ 150 quando existe espaço realista para negociar. O que importa é o <strong>preço que vale pagar</strong>, não só o preço publicado.</p>
        </div>
      </div>
    </div>

    <button type="button" className="brique-save" onClick={save} disabled={saving||cash<=0}>
      <Save size={16}/>
      {saving?'Salvando...':saved?'Caixa salvo':'Salvar meu caixa e giro'}
    </button>

    {cash>0&&<div className="brique-results">
      <div className="brique-results__head">
        <div>
          <span className="brique-hunt__eyebrow"><Flame size={13}/> GARIMPO DO RADAR</span>
          <h4>8 alvos para {tierName(cash)} · {giro==='rapido'?'giro rápido':'giro médio'}</h4>
          <p>Faixas de anúncio são referências observadas no mercado. O alvo de compra considera negociação e precisa ser validado no <strong>Analisar</strong> antes de fechar.</p>
        </div>
        <span className="brique-results__count">8</span>
      </div>

      <div className="brique-product-grid">
        {opportunities.map(item=><article key={item.id} className="brique-product">
          <div className="brique-product__top">
            <span className={'brique-heat '+(item.heat==='muito-quente'?'is-hot':'')}>
              <Flame size={12}/>{item.heat==='muito-quente'?'MUITO QUENTE':'QUENTE'}
            </span>
            <span className="brique-product__turn">{giro==='rapido'?'⚡ rápido':'◎ médio'}</span>
          </div>
          <h5>{item.title}</h5>
          <div className="brique-product__prices">
            <span><small>Anúncios observados</small><b>{rangeMoney(item.marketAsk)}</b></span>
            <span><small>Alvo de compra</small><b>{rangeMoney(item.targetBuy)}</b></span>
          </div>
          <p className="brique-product__why">{item.why}</p>
          <div className="brique-product__signal">
            <ShoppingBag size={14}/>
            <p><b>Onde pode estar a margem</b>{item.signal}</p>
          </div>
          <div className="brique-product__risk">
            <ShieldAlert size={15}/>
            <p><b>Riscos antes de pagar</b>{item.risk}</p>
          </div>
          <button type="button" className="brique-product__analyze" onClick={onAnalyze}>
            Achei um anúncio · Analisar <ArrowRight size={14}/>
          </button>
        </article>)}
      </div>

      <div className="brique-flow">
        <div className="brique-flow__head">
          <span className="brique-hunt__eyebrow"><ScanSearch size={13}/> FLUXO DO BRIQUE</span>
          <h4>Do anúncio mal apresentado até a revenda</h4>
        </div>
        <div className="brique-flow__steps">
          <FlowStep n="01" title="Garimpe" text="Procure anúncio mal fotografado, sujo, desapego e descrição fraca — sem confundir aparência ruim com produto ruim."/>
          <FlowStep n="02" title="Valide" text="Mande o print ou link para Analisar. O Radar confere preço, riscos, testes e teto de compra."/>
          <FlowStep n="03" title="Negocie" text="Mostre interesse primeiro. Use estado, limpeza, acessórios, reparos e retirada como argumentos reais para melhorar o preço."/>
          <FlowStep n="04" title="Compre e registre" text="Fechou? Registre em Comprei para acompanhar custo real, estoque, venda e lucro."/>
          <FlowStep n="05" title="Venda melhor" text="Limpe bem, faça fotos claras e use Vender com IA para montar apresentação, preço e anúncio de revenda."/>
        </div>
      </div>

      <div className="brique-discipline">
        <div><ShieldAlert size={18}/><strong>Negociação boa não começa ofendendo o vendedor.</strong></div>
        <p>Evite oferta muito abaixo logo na primeira mensagem. Pergunte funcionamento e condição, demonstre interesse e só então negocie com base em fatos. Você não precisa dizer que vai revender, mas também não invente história de “uso próprio”. E preço baixo nunca justifica ignorar procedência, segurança ou sinais de golpe.</p>
      </div>

      <div className="brique-aftercare">
        <Camera size={18}/>
        <p><strong>Comprou?</strong> Higienização cuidadosa e boas fotos aumentam percepção de valor. Depois, use <b>Vender com IA</b> para preparar a revenda.</p>
      </div>

      <p className="brique-market-note">{marketResearchNote}</p>
    </div>}
  </section>
}

function FlowStep({n,title,text}:{n:string;title:string;text:string}){
  return <div className="brique-flow__step"><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>
}

function rangeMoney(range:[number,number]){
  return money(range[0])+' – '+money(range[1])
}
