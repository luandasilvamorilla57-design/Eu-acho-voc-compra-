import { FileText,Images,Link2,Plus,ScanSearch,ShoppingBag,Sparkles,Trash2,Upload,WalletCards,X } from 'lucide-react'
import type { PreparedImage } from '../../utils/imageInput'
import type { MarketReferenceInput } from '../../types/market'

export type AdOrigin='olx'|'facebook'|'manual'

type P={
  origem:AdOrigin
  link:string
  texto:string
  preco:string
  marketRefs:MarketReferenceInput[]
  images:PreparedImage[]
  imageBusy:boolean
  busy:boolean
  error:string
  setOrigem:(v:AdOrigin)=>void
  setLink:(v:string)=>void
  setTexto:(v:string)=>void
  setPreco:(v:string)=>void
  addMarketRef:()=>void
  updateMarketRef:(index:number,patch:Partial<MarketReferenceInput>)=>void
  removeMarketRef:(index:number)=>void
  addImages:(files:FileList|null)=>void
  removeImage:(index:number)=>void
  analyze:()=>void
}

const origins=[
  {id:'olx' as const,label:'OLX',desc:'Cole o link público do anúncio',icon:Link2},
  {id:'facebook' as const,label:'Facebook',desc:'Envie prints do Marketplace',icon:Images},
  {id:'manual' as const,label:'Outro',desc:'Cole os dados manualmente',icon:FileText},
]

export function AnalysisForm(p:P){
  return <section className="glass analysis-form-card">
    <div className="analysis-form-card__head">
      <div><span className="premium-eyebrow text-emerald-400">PASSO 01 · ORIGEM</span><h3 className="font-display">De onde vem esta oportunidade?</h3><p>O Radar adapta a leitura para cada plataforma e sinaliza quando faltam dados para decidir com segurança.</p></div>
      <span className="analysis-form-card__head-icon"><ScanSearch size={20}/></span>
    </div>

    <div className="analysis-origin-grid">
      {origins.map(({id,label,desc,icon:Icon})=>{
        const active=p.origem===id
        return <button key={id} type="button" onClick={()=>p.setOrigem(id)} className={'analysis-origin-card '+(active?'is-active':'')}>
          <span className="analysis-origin-card__icon"><Icon size={17}/></span>
          <strong>{label}</strong>
          <small>{desc}</small>
          {active&&<i/>}
        </button>
      })}
    </div>

    <div className="analysis-form-fields">
      {p.origem==='olx'&&<>
        <Info tone="blue"><b>OLX:</b> cole o link público. O Radar tenta ler o anúncio diretamente e deixa claro se algum dado não pôde ser confirmado.</Info>
        <label className="analysis-field-label">Link do anúncio<div className="analysis-input"><Link2 size={16}/><input value={p.link} onChange={e=>p.setLink(e.target.value)} placeholder="https://www.olx.com.br/..."/></div></label>
        <OptionalText p={p}/>
      </>}

      {p.origem==='facebook'&&<>
        <Info tone="green"><b>Facebook Marketplace:</b> envie prints com fotos, título, preço e descrição. Quanto mais completo, melhor a leitura.</Info>
        <label className="analysis-upload">
          <input type="file" accept="image/*" multiple className="absolute inset-0 cursor-pointer opacity-0" onChange={e=>{p.addImages(e.target.files);e.currentTarget.value=''}}/>
          <div><span><Upload size={21}/></span><strong>{p.imageBusy?'Preparando prints...':'Enviar prints do anúncio'}</strong><small>Até 6 imagens · compressão automática</small></div>
        </label>
        {p.images.length>0&&<div className="analysis-image-grid">{p.images.map((image,index)=><div key={image.preview} className="analysis-image-thumb"><img src={image.preview} alt={`Print ${index+1}`}/><span>{index+1}</span><button type="button" onClick={()=>p.removeImage(index)}><X size={13}/></button></div>)}</div>}
        <label className="analysis-field-label">Informação extra <span>(opcional)</span><textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="analysis-textarea" placeholder="Ex.: vendedor disse que a bateria foi trocada, aceita troca..."/></label>
      </>}

      {p.origem==='manual'&&<>
        <Info><b>Outros anúncios:</b> use para grupos, WhatsApp, classificados ou oportunidades recebidas por mensagem.</Info>
        <label className="analysis-field-label">Dados do anúncio<textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="analysis-textarea min-h-36" placeholder="Cole título, descrição, estado do produto, acessórios e outras informações..."/></label>
      </>}

      <label className="analysis-field-label">Preço anunciado <span>(se estiver nos prints, pode deixar vazio)</span><div className="analysis-input"><WalletCards size={16}/><input inputMode="decimal" value={p.preco} onChange={e=>p.setPreco(e.target.value.replace(',','.'))} placeholder="Ex.: 1500"/></div></label>

      <section className="market-ref-editor">
        <div className="market-ref-editor__head">
          <div><span className="premium-eyebrow text-blue-400">COMPARÁVEIS REAIS</span><h4>Tem anúncios parecidos? Dê dados concretos ao Radar.</h4><p>Links e preços realmente comparáveis têm prioridade sobre estimativas genéricas.</p></div>
          {p.marketRefs.length<5&&<button type="button" onClick={p.addMarketRef} className="market-ref-add"><Plus size={13}/> Adicionar</button>}
        </div>
        {p.marketRefs.length===0?<button type="button" onClick={p.addMarketRef} className="market-ref-empty"><ShoppingBag size={16}/><span><b>Adicionar referência de mercado</b><small>Opcional, mas aumenta a confiança do preço.</small></span></button>:<div className="mt-3 grid gap-2">{p.marketRefs.map((r,i)=><div key={i} className="market-ref-row">
          <div className="market-ref-index">{i+1}</div>
          <input value={r.url} onChange={e=>p.updateMarketRef(i,{url:e.target.value})} placeholder="Link do anúncio comparável"/>
          <div className="market-ref-price"><span>R$</span><input inputMode="decimal" value={r.price||''} onChange={e=>p.updateMarketRef(i,{price:Number(e.target.value.replace(',','.')||0)})} placeholder="Preço"/></div>
          <input value={r.note} onChange={e=>p.updateMarketRef(i,{note:e.target.value})} placeholder="Ex.: mesmo modelo, usado, bom estado"/>
          <button type="button" onClick={()=>p.removeMarketRef(i)} aria-label="Remover referência"><Trash2 size={14}/></button>
        </div>)}</div>}
      </section>

      {p.error&&<div className="analysis-error">{p.error}</div>}
      <div className="analysis-submit-zone">
        <button disabled={p.busy||p.imageBusy} onClick={p.analyze} className="analysis-primary"><span><Sparkles size={17}/></span><strong>{p.busy?'Radar analisando...':p.imageBusy?'Preparando imagens...':'Analisar oportunidade'}</strong></button>
        <small>O resultado separa fatos, estimativas e pontos que ainda precisam ser conferidos.</small>
      </div>
    </div>
  </section>
}

function Info({children,tone='neutral'}:{children:React.ReactNode;tone?:'blue'|'green'|'neutral'}){return <div className={`analysis-info analysis-info--${tone}`}>{children}</div>}
function OptionalText({p}:{p:P}){return <label className="analysis-field-label">Texto complementar <span>(opcional)</span><textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="analysis-textarea" placeholder="Cole também a descrição do anúncio para aumentar a precisão."/></label>}
