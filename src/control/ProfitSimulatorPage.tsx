import {useMemo,useState} from 'react'
import {ArrowLeft,ArrowRight,Calculator,Check,Copy,Info,ReceiptText,RotateCcw,TrendingUp,WalletCards} from 'lucide-react'

const BRL=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})
const percent=(n:number)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n)+'%'

function amount(input:string){
  const value=input.trim().replace(/\s/g,'').replace(/R\$/g,'')
  const normalized=value.includes(',')?value.replace(/\./g,'').replace(',','.'):value
  const parsed=Number(normalized)
  return Number.isFinite(parsed)?Math.max(0,parsed):0
}

type PriceFieldProps={
  label:string
  value:string
  onChange:(value:string)=>void
  helper?:string
  percent?:boolean
}
function PriceField({label,value,onChange,helper,percent:asPercent=false}:PriceFieldProps){
  return <label className="cp-v3-sim-field">
    <span>{label}</span>
    <div className="cp-v3-sim-control">
      {!asPercent&&<span aria-hidden="true">R$</span>}
      <input inputMode="decimal" value={value} onChange={event=>onChange(event.target.value)} placeholder="0,00" aria-label={label}/>
      {asPercent&&<span aria-hidden="true">%</span>}
    </div>
    {helper&&<small>{helper}</small>}
  </label>
}

export function ProfitSimulatorPage({onBack}:{onBack:()=>void}){
  const [purchase,setPurchase]=useState('500')
  const [sale,setSale]=useState('750')
  const [freight,setFreight]=useState('20')
  const [repair,setRepair]=useState('0')
  const [other,setOther]=useState('0')
  const [fee,setFee]=useState('0')
  const [fixedFee,setFixedFee]=useState('0')
  const [desiredMargin,setDesiredMargin]=useState('20')
  const [quantity,setQuantity]=useState('1')
  const [copied,setCopied]=useState(false)

  const result=useMemo(()=>{
    const price=amount(sale)
    const cost=amount(purchase)+amount(freight)+amount(repair)+amount(other)
    const feeRate=Math.min(100,amount(fee))/100
    const feeCost=price*feeRate+amount(fixedFee)
    const profit=price-cost-feeCost
    const qty=Math.min(100000,Math.max(1,Math.floor(Number(quantity)||1)))
    const roi=cost>0?profit/cost*100:0
    const margin=price>0?profit/price*100:0
    const denominator=1-feeRate
    const breakEven=denominator>0?(cost+amount(fixedFee))/denominator:null
    const desired=Math.min(99,amount(desiredMargin))/100
    const targetDenominator=1-feeRate-desired
    const targetPrice=targetDenominator>0?(cost+amount(fixedFee))/targetDenominator:null
    return {price,cost,feeCost,profit,qty,roi,margin,breakEven,targetPrice,feeRate}
  },[purchase,sale,freight,repair,other,fee,fixedFee,desiredMargin,quantity])

  async function copySummary(){
    const text=['Simulação CONTROLE+',
      'Compra + custos: '+BRL.format(result.cost),
      'Preço de venda: '+BRL.format(result.price),
      'Taxas: '+BRL.format(result.feeCost),
      'Lucro por unidade: '+BRL.format(result.profit),
      'Margem: '+percent(result.margin),
      'ROI: '+percent(result.roi),
      'Quantidade: '+result.qty,
      'Lucro total: '+BRL.format(result.profit*result.qty)
    ].join('\n')
    try{
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(()=>setCopied(false),2500)
    }catch{setCopied(false)}
  }

  function reset(){
    setPurchase('500');setSale('750');setFreight('20');setRepair('0');setOther('0');setFee('0');setFixedFee('0');setDesiredMargin('20');setQuantity('1')
  }

  return <main className="cp-page cp-v3-sim-page">
    <div className="cp-v3-page-top">
      <button className="cp-v3-back" onClick={onBack} aria-label="Voltar ao início"><ArrowLeft size={18}/> Voltar</button>
      <span className="cp-v3-feature-label"><Calculator size={15}/> FERRAMENTA CONTROLE+</span>
    </div>
    <header className="cp-v3-sim-intro">
      <div><span className="cp-v3-eyebrow">ANTES DE FECHAR O NEGÓCIO</span>
        <h1>Essa compra <em>vale a pena?</em></h1>
        <p>Faça as contas antes de gastar. Simule taxas, frete, reparos e descubra quanto sobra de lucro de verdade.</p>
      </div>
      <span className="cp-v3-sim-intro-icon"><Calculator size={35}/></span>
    </header>
    <div className="cp-v3-sim-layout">
      <section className="cp-v3-sim-panel cp-v3-sim-form" aria-label="Dados da simulação">
        <div className="cp-v3-section-title"><span>01</span><div><h2>Valores do negócio</h2><p>Preencha os custos por unidade.</p></div></div>
        <div className="cp-v3-sim-fields">
          <PriceField label="Preço de compra" value={purchase} onChange={setPurchase}/>
          <PriceField label="Preço de venda" value={sale} onChange={setSale}/>
          <PriceField label="Frete e transporte" value={freight} onChange={setFreight}/>
          <PriceField label="Reparos ou preparação" value={repair} onChange={setRepair}/>
          <PriceField label="Outros custos" value={other} onChange={setOther}/>
          <PriceField label="Taxa de venda" value={fee} onChange={setFee} percent helper="Informe a taxa real da plataforma."/>
          <PriceField label="Taxa fixa por unidade" value={fixedFee} onChange={setFixedFee}/>
          <PriceField label="Margem desejada" value={desiredMargin} onChange={setDesiredMargin} percent/>
          <label className="cp-v3-sim-field"><span>Quantidade de unidades</span>
            <div className="cp-v3-sim-control"><input type="number" min="1" max="100000" value={quantity} onChange={e=>setQuantity(e.target.value)} aria-label="Quantidade de unidades"/></div>
          </label>
        </div>
        <div className="cp-v3-sim-help"><Info size={17}/><span>A simulação não altera seu estoque nem seu caixa. As taxas são preenchidas por você, pois variam conforme o canal e o anúncio.</span></div>
        <button className="cp-v3-reset" onClick={reset}><RotateCcw size={16}/> Restaurar exemplo</button>
      </section>
      <section className="cp-v3-sim-output" aria-label="Resultado da simulação">
        <div className={'cp-v3-profit-hero '+(result.profit>=0?'is-positive':'is-negative')}>
          <span><TrendingUp size={18}/> LUCRO ESTIMADO POR UNIDADE</span>
          <strong>{BRL.format(result.profit)}</strong>
          <p>{result.profit>0?'Este valor pode sobrar após custos e taxas informados.':result.profit<0?'A venda gera prejuízo com estes valores.':'A venda cobre exatamente os custos informados.'}</p>
          <div className="cp-v3-profit-metrics">
            <div><small>Margem líquida simulada</small><b>{percent(result.margin)}</b></div>
            <div><small>Retorno sobre custo (ROI)</small><b>{percent(result.roi)}</b></div>
          </div>
        </div>
        <div className="cp-v3-sim-panel cp-v3-breakdown">
          <div className="cp-v3-section-title"><span><ReceiptText size={17}/></span><div><h2>Para onde vai o dinheiro</h2><p>Resumo por unidade vendida.</p></div></div>
          <div className="cp-v3-breakdown-rows">
            <div><span>Venda</span><b>{BRL.format(result.price)}</b></div>
            <div><span>Compra + custos</span><b>− {BRL.format(result.cost)}</b></div>
            <div><span>Taxas da venda</span><b>− {BRL.format(result.feeCost)}</b></div>
            <div className="cp-v3-breakdown-total"><span>Sobra estimada</span><strong>{BRL.format(result.profit)}</strong></div>
          </div>
          <div className="cp-v3-breakdown-track" aria-label="Composição do valor da venda">
            <span style={{width:result.price>0?Math.min(100,result.cost/result.price*100)+'%':'0%'}}/>
            <i style={{width:result.price>0?Math.min(100,result.feeCost/result.price*100)+'%':'0%'}}/>
          </div>
          <div className="cp-v3-price-guides">
            <div><small>Preço para empatar</small><b>{result.breakEven===null?'Não é possível':BRL.format(result.breakEven)}</b></div>
            <div><small>Preço para margem de {percent(amount(desiredMargin))}</small><b>{result.targetPrice===null?'Não é possível':BRL.format(result.targetPrice)}</b></div>
          </div>
        </div>
        <div className="cp-v3-sim-panel cp-v3-projection">
          <span><WalletCards size={17}/> PROJEÇÃO DE {result.qty} {result.qty===1?'UNIDADE':'UNIDADES'}</span>
          <strong>{BRL.format(result.profit*result.qty)}</strong>
          <p>Lucro estimado se vender toda a quantidade por esse preço.</p>
          <button onClick={()=>void copySummary()}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?'Resumo copiado':'Copiar simulação'} <ArrowRight size={16}/></button>
        </div>
      </section>
    </div>
  </main>
}
