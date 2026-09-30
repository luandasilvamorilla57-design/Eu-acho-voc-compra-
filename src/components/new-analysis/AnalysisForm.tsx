import { FileText, Images, Link2, Plus, ShoppingBag, Sparkles, Trash2, Upload, WalletCards, X } from 'lucide-react'
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
  {id:'olx' as const,label:'OLX',desc:'Cole o link do anúncio',icon:Link2},
  {id:'facebook' as const,label:'Facebook',desc:'Envie prints do Marketplace',icon:Images},
  {id:'manual' as const,label:'Outro',desc:'Cole os dados manualmente',icon:FileText},
]

export function AnalysisForm(p:P){
  return <section className="glass rounded-[26px] p-4 sm:p-6">
    <div className="mb-5">
      <span className="premium-eyebrow text-slate-500">ORIGEM DO ANÚNCIO</span>
      <h3 className="font-display mt-1.5 text-xl font-bold">De onde vem esta oportunidade?</h3>
      <p className="mt-1.5 text-[12px] leading-5 text-slate-500">O Radar adapta a leitura para cada plataforma e deixa claro quando faltam dados.</p>
    </div>

    <div className="grid grid-cols-3 gap-2">
      {origins.map(({id,label,desc,icon:Icon})=>{
        const active=p.origem===id
        return <button key={id} type="button" onClick={()=>p.setOrigem(id)} className={`relative min-h-[96px] rounded-[20px] border p-3 text-left transition sm:min-h-[104px] sm:p-4 ${active?'border-emerald-400/35 bg-emerald-400/[.08] shadow-[0_14px_40px_rgba(16,185,129,.08)]':'border-slate-800 bg-slate-950/30 hover:border-slate-700'}`}>
          <span className={`grid h-8 w-8 place-items-center rounded-xl ${active?'bg-emerald-400/12 text-emerald-300':'bg-slate-800/70 text-slate-500'}`}><Icon size={16}/></span>
          <strong className="mt-3 block text-[12px] text-white">{label}</strong>
          <span className="mt-1 hidden text-[10px] leading-4 text-slate-500 sm:block">{desc}</span>
        </button>
      })}
    </div>

    <div className="mt-5 grid gap-4">
      {p.origem==='olx'&&<>
        <Info tone="blue"><b>OLX:</b> cole o link público. O Radar tenta ler o anúncio diretamente.</Info>
        <label className="text-[12px] font-semibold text-slate-400">Link do anúncio<div className="analysis-input"><Link2 size={16}/><input value={p.link} onChange={e=>p.setLink(e.target.value)} placeholder="https://www.olx.com.br/..."/></div></label>
        <OptionalText p={p}/>
      </>}

      {p.origem==='facebook'&&<>
        <Info tone="green"><b>Facebook Marketplace:</b> envie prints mostrando fotos do produto, título, preço e descrição.</Info>
        <label className="analysis-upload">
          <input type="file" accept="image/*" multiple className="absolute inset-0 cursor-pointer opacity-0" onChange={e=>{p.addImages(e.target.files);e.currentTarget.value=''}}/>
          <div><span><Upload size={21}/></span><strong>{p.imageBusy?'Preparando prints...':'Enviar prints do anúncio'}</strong><small>Até 6 imagens · compressão automática</small></div>
        </label>
        {p.images.length>0&&<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{p.images.map((image,index)=><div key={image.preview} className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-slate-800 bg-slate-950"><img src={image.preview} alt={`Print ${index+1}`} className="h-full w-full object-cover"/><button type="button" onClick={()=>p.removeImage(index)} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white"><X size={13}/></button></div>)}</div>}
        <label className="text-[12px] font-semibold text-slate-400">Informação extra <span className="font-normal text-slate-600">(opcional)</span><textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="analysis-textarea" placeholder="Ex.: vendedor disse que a bateria foi trocada, aceita troca..."/></label>
      </>}

      {p.origem==='manual'&&<>
        <Info><b>Outros anúncios:</b> use para grupos, WhatsApp, classificados ou anúncios recebidos por mensagem.</Info>
        <label className="text-[12px] font-semibold text-slate-400">Dados do anúncio<textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="analysis-textarea min-h-36" placeholder="Cole título, descrição, estado do produto, acessórios e outras informações..."/></label>
      </>}

      <label className="text-[12px] font-semibold text-slate-400">Preço anunciado <span className="font-normal text-slate-600">(se estiver nos prints, pode deixar vazio)</span><div className="analysis-input"><WalletCards size={16}/><input inputMode="decimal" value={p.preco} onChange={e=>p.setPreco(e.target.value.replace(',','.'))} placeholder="Ex.: 1500"/></div></label>

      <section className="market-ref-editor">
        <div className="flex items-start justify-between gap-3">
          <div><span className="premium-eyebrow text-blue-400">COMPARÁVEIS REAIS</span><h4 className="mt-1 text-[13px] font-bold text-slate-200">Tem anúncios parecidos? Dê dados concretos ao Radar.</h4><p className="mt-1 text-[10.5px] leading-5 text-slate-500">Cole links e preços de itens realmente comparáveis. Eles terão prioridade sobre estimativas genéricas.</p></div>
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

      {p.error&&<div className="rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-[12px] leading-5 text-red-300">{p.error}</div>}
      <button disabled={p.busy||p.imageBusy} onClick={p.analyze} className="analysis-primary"><Sparkles size={17}/>{p.busy?'Radar analisando...':p.imageBusy?'Preparando imagens...':'Analisar oportunidade'}</button>
    </div>
  </section>
}

function Info({children,tone='neutral'}:{children:React.ReactNode;tone?:'blue'|'green'|'neutral'}){return <div className={`analysis-info analysis-info--${tone}`}>{children}</div>}
function OptionalText({p}:{p:P}){return <label className="text-[12px] font-semibold text-slate-400">Texto complementar <span className="font-normal text-slate-600">(opcional)</span><textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="analysis-textarea" placeholder="Se quiser, cole também a descrição do anúncio para aumentar a precisão."/></label>}
